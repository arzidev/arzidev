---
layout: ../../layouts/Layout.astro
title: "Arquitectura hexagonal en NestJS: cómo la aplico en mis proyectos"
description: "Un recorrido por cómo estructuro mis proyectos NestJS usando arquitectura hexagonal, separando dominio, aplicación e infraestructura para mantener el código mantenible y testeable."
pubDate: 2026-07-15
date: 2026-07-15
tags: ["NestJS", "TypeScript", "Clean Architecture", "Backend"]
---

# Arquitectura hexagonal en NestJS: cómo la aplico en mis proyectos

Cuando empecé a trabajar con NestJS, la estructura de carpetas por defecto me parecía suficiente. Con el tiempo y proyectos más complejos, me di cuenta de que mezclar lógica de negocio con detalles de infraestructura termina generando código difícil de testear, difícil de cambiar y difícil de entender.

La arquitectura hexagonal (también llamada Ports & Adapters) resolvió ese problema para mí. No es una bala de plata, pero cuando se aplica con criterio hace que el código tenga una estructura predecible y que los cambios de infraestructura no rompan el dominio.

## La idea central

El núcleo del sistema es el **dominio**: las entidades, las reglas de negocio y los casos de uso. Este núcleo no sabe nada del mundo exterior: no conoce NestJS, no conoce PostgreSQL, no conoce HTTP.

Todo lo que el dominio necesita del exterior lo define a través de **puertos** (interfaces). Los **adaptadores** son las implementaciones concretas de esos puertos: un repositorio de Postgres, un cliente HTTP, un productor de eventos.

## Cómo organizo las carpetas

```
src/
  modules/
    users/
      domain/
        user.entity.ts
        user.repository.ts       ← puerto (interfaz)
        create-user.use-case.ts
      application/
        create-user.handler.ts
        user.dto.ts
      infrastructure/
        persistence/
          typeorm-user.repository.ts  ← adaptador
        http/
          user.controller.ts
          user.module.ts
```

El `domain/` no importa nada de NestJS ni de librerías externas. El `infrastructure/` es donde viven los decoradores de NestJS, los módulos, los controladores y las implementaciones de base de datos.

## Los puertos como interfaces de TypeScript

Un puerto es simplemente una interfaz que el caso de uso necesita:

```typescript
// domain/user.repository.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

El caso de uso recibe esta interfaz por inyección de dependencias, sin saber cómo está implementada:

```typescript
// domain/create-user.use-case.ts
export class CreateUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(data: CreateUserDto): Promise<User> {
    const user = User.create(data);
    await this.users.save(user);
    return user;
  }
}
```

## Conectar el dominio con NestJS

NestJS tiene un sistema de inyección de dependencias muy potente. El truco es registrar el adaptador bajo el token de la interfaz:

```typescript
// infrastructure/http/user.module.ts
@Module({
  providers: [
    CreateUserUseCase,
    {
      provide: UserRepository,        // token = la interfaz
      useClass: TypeOrmUserRepository // implementación concreta
    }
  ],
  controllers: [UserController],
})
export class UserModule {}
```

Así el caso de uso recibe la implementación real en runtime, pero en los tests puedo inyectar un mock sin tocar nada del dominio.

## Por qué vale la pena

El beneficio más concreto es el **testing**. Los casos de uso son clases simples sin decoradores, sin providers de NestJS, sin base de datos. Un test unitario se escribe en segundos:

```typescript
it('should create a user', async () => {
  const repo = new InMemoryUserRepository();
  const useCase = new CreateUserUseCase(repo);
  const user = await useCase.execute({ name: 'Javier', email: 'hi@arzidev.dev' });
  expect(repo.users).toHaveLength(1);
});
```

El segundo beneficio es la **intercambiabilidad**. Si mañana quiero migrar de TypeORM a Drizzle, solo escribo un nuevo adaptador que implemente `UserRepository`. El dominio no cambia una sola línea.

## Cuándo no aplicarla

No todo proyecto necesita arquitectura hexagonal. Para un CRUD simple o un servicio pequeño con poca lógica de negocio, esta estructura añade complejidad sin beneficio real.

La aplico cuando el proyecto tiene:
- Lógica de negocio no trivial que necesita estar aislada y testeada.
- Múltiples fuentes o destinos de datos (bases de datos, APIs externas, colas de mensajes).
- Expectativa de crecimiento o cambios en la infraestructura a mediano plazo.

En esos contextos, la inversión inicial en estructura se recupera rápidamente.
