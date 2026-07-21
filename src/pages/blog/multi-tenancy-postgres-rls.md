---
layout: ../../layouts/Layout.astro
title: "Multi-tenancy en PostgreSQL: Row-Level Security con Supabase"
description: "Cómo implemento aislamiento de datos entre organizaciones usando Row-Level Security de PostgreSQL y Supabase, sin necesidad de bases de datos separadas por tenant."
pubDate: 2026-07-05
date: 2026-07-05
tags: ["PostgreSQL", "Supabase", "Multi-tenancy", "Backend", "TypeScript"]
---

# Multi-tenancy en PostgreSQL: Row-Level Security con Supabase

Cuando construyes un SaaS multi-tenant, una de las primeras decisiones de arquitectura es cómo aislar los datos entre organizaciones. Hay tres enfoques clásicos:

1. **Base de datos por tenant** — máximo aislamiento, costo operativo alto.
2. **Schema por tenant** — buen aislamiento, migraciones complejas.
3. **Tabla compartida con columna `tenant_id`** — más simple, requiere disciplina para no filtrar datos.

El tercer enfoque es el que uso, pero con **Row-Level Security (RLS)** de PostgreSQL para que el motor de base de datos sea quien garantice el aislamiento, no el código de la aplicación.

## Qué es Row-Level Security

RLS permite definir políticas a nivel de tabla que determinan qué filas puede ver o modificar cada usuario o rol. Es una característica nativa de PostgreSQL que se ejecuta dentro del motor, antes de que los datos lleguen a la aplicación.

Cuando está habilitado, una query como `SELECT * FROM conversations` solo devuelve las filas que la política permite para la sesión actual.

## Estructura de la base de datos

Todas las tablas tienen una columna `organization_id` que referencia la organización dueña del dato:

```sql
CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id),
  contact_id  UUID NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Habilitar RLS y definir políticas

```sql
-- Habilitar RLS en la tabla
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Política: solo ver filas de tu organización
CREATE POLICY "tenant_isolation" ON conversations
  USING (org_id = current_setting('app.current_org_id')::UUID);
```

La función `current_setting('app.current_org_id')` lee una variable de sesión que la aplicación establece al inicio de cada request o transacción.

## Configurar el contexto desde la aplicación

Antes de ejecutar cualquier query, el servicio establece la variable de sesión con el `org_id` del tenant autenticado:

```typescript
@Injectable()
export class TenantService {
  constructor(private readonly db: DatabaseService) {}

  async withTenant<T>(orgId: string, fn: () => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_org_id', ${orgId}, true)`
      );
      return fn();
    });
  }
}
```

El tercer argumento `true` en `set_config` hace que la variable sea local a la transacción, lo que es importante para evitar fugas entre requests en un pool de conexiones.

## Integración con Supabase

Supabase expone RLS de forma nativa y lo recomienda como el mecanismo de seguridad principal. Sin embargo, en mi caso no uso el cliente de Supabase directamente desde el frontend, sino que tengo un backend NestJS que actúa como intermediario.

El backend conecta a Supabase con el rol de `service_role` (que puede bypassear RLS cuando necesito operaciones administrativas), pero para las queries de aplicación uso un rol con RLS activo y establezco el contexto manualmente.

```typescript
// Para operaciones de aplicación (con RLS)
const appClient = createClient(url, anonKey);

// Para operaciones administrativas (sin RLS)
const adminClient = createClient(url, serviceRoleKey);
```

## Migraciones con múltiples tenants

Una ventaja de este modelo es que las migraciones son simples: una sola base de datos, un solo schema, una sola migración que aplica a todos los tenants a la vez. No hay que coordinar N migraciones en N bases de datos.

## Consideraciones de rendimiento

Con RLS activo, PostgreSQL evalúa la política para cada fila. El índice en `org_id` es fundamental:

```sql
CREATE INDEX idx_conversations_org_id ON conversations(org_id);
```

Sin ese índice, el planner puede terminar haciendo un full table scan para luego filtrar por RLS, lo que escala muy mal.

## Lo que ganás con este enfoque

- **Seguridad garantizada por el motor**: aunque haya un bug en la aplicación que olvide filtrar por `org_id`, PostgreSQL no va a devolver datos de otros tenants.
- **Operaciones simplificadas**: una sola base de datos para todos los tenants.
- **Escalabilidad**: cuando un tenant necesita más recursos, se puede migrar a una base de datos dedicada con un cambio de conexión, sin tocar el schema.

El principal trade-off es la complejidad de asegurarse de que el contexto de sesión siempre esté correctamente establecido. Un error ahí puede resultar en que las políticas fallen y el query no devuelva nada, o en el peor caso, que se use el contexto de otro tenant. Por eso centralizo ese setup en un único servicio y nunca lo repito en la capa de repositorios.
