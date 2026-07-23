---
title: "Del Webhook al código: obteniendo el diff de un Merge Request"
description: "Recibir el Webhook era solo el primer paso. Ahora tocaba consultar la API de GitLab para extraer únicamente el código que había cambiado."
pubDate: 2026-07-18
tags: ["gitlab", "api", "diff", "python", "fastapi"]
categories: ["AI"]
series: "Ai Code Reviewer"
seriesPart: 4
draft: false
---

# Del Webhook al código: obteniendo el diff de un Merge Request

En el artículo anterior logré que GitLab enviara un Webhook cada vez que se creaba o actualizaba un Merge Request.

Fue un gran avance, pero con un detalle fundamental:

> **El Webhook no incluye el código modificado.**

El *payload* del Webhook contiene datos sobre el repositorio, el autor o las ramas, pero no trae el *diff* que requiere la IA para analizar el cambio.

Tocaba dar el siguiente paso en la integración con la API de GitLab.

---

## El Webhook solo me dice dónde buscar

Cuando imprimí el payload del evento por primera vez, encontré datos clave. Sin embargo, no venían en la raíz del JSON, sino anidados dentro de la estructura que envía GitLab.

Para extraerlos en Python, el código era tan directo como esto:

### Extraemos los identificadores necesarios del payload del Webhook

```python
project_id = payload.get("project", {}).get("id")
merge_request_iid = payload.get("object_attributes", {}).get("iid")
```

Con solo esas dos variables (`project_id` e `merge_request_iid`), ya tenía las "coordenadas" exactas del Merge Request dentro de la plataforma.

Ahí entendí el diseño tras el evento: **el Webhook no entrega toda la información, solo avisa que ocurrió un cambio.** Es responsabilidad de nuestro microservicio tomar esos IDs y consultar la API REST de GitLab para traer los detalles faltantes.

---

## Diseñando la llamada a la API

Con el `project_id` y el `merge_request_iid` capturados, el flujo quedó estructurado así:

```text
Webhook (Trigger)
    │
    ▼
Extraer `project_id` & `merge_request_iid`
    │
    ▼
Petición a GitLab REST API (Endpoints de Changes / Diffs)
    │
    ▼
Diff crudo del Merge Request (Payload para el LLM)
```

### Llamar endpoint para obtener el diff
```python
import httpx

apiUrl = f"https://gitlab.com/api/v4/projects/{project_id}/merge_requests/{merge_request_iid}/changes"
headers = {
        "PRIVATE-TOKEN": GITLAB_TOKEN  # Replace with your GitLab private token
    }
async with httpx.AsyncClient(timeout=30.0) as client:
   response = await client.get(apiUrl, headers=headers)
   mr_data = response.json()
```
---

## ¿Por qué analizar el diff y no todo el archivo?

Procesar solo el código modificado responde a tres razones de ingeniería:

1. **Optimización de contexto:** Los modelos de lenguaje tienen ventanas de contexto limitadas. Enviar archivos completos de miles de líneas desperdicia espacio útil.
2. **Control de costos:** La API del LLM cobra por token. Analizar únicamente lo modificado reduce el costo de la petición.
3. **Precisión:** Enfocar la revisión en los cambios actuales evita que la IA genere observaciones sobre código antiguo que no es parte de la tarea en revisión.

---

## La primera respuesta de la API de GitLab

Al consultar el endpoint de cambios del MR, la API respondió con un JSON que contiene un listado de archivos con estructuras como esta:

- Nombre y ruta del archivo (`old_path` / `new_path`).
- Tipo de cambio (creado, modificado, eliminado).
- El bloque de texto con el **diff** correspondiente.

Al imprimir ese campo `diff`, apareció la estructura real del control de versiones:

@@ -12,7 +12,10 @@

-console.log("Hola")
+console.log("Hola mundo")

---

## Entendiendo la anatomía de un Git Diff

Para quien no lo ha manipulado manualmente a nivel de código, un *diff* parece un formato indescifrable:

- ¿Qué significan las secciones entre `@@`?
- ¿Cómo mapear los números de línea antiguos versus los nuevos?
- ¿Cómo saber exactamente en qué número de línea publicar el comentario en la interfaz de GitLab?

Antes de construir cualquier *prompt* para el modelo de IA, **necesitaba entender el formato unificado de Git (Unified Diff)** para parsear e interpretar las líneas modificadas.

---

## ¿Qué viene ahora?

El flujo de integración ya está conectado:
1. Recepción del Webhook.
2. Consulta a la API de GitLab.
3. Extracción del *diff* crudo.

El siguiente paso técnico será construir un **parser para el Git Diff** en Python. Necesitaremos mapear los símbolos `+`, `-` y los encabezados `@@` a objetos que la IA pueda interpretar para hacer observaciones en la línea exacta del código.
