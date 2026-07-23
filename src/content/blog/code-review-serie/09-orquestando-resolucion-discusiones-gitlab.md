---
title: "Cerrando el ciclo: Orquestando la resolución automática de discusiones en GitLab"
description: "Ensamble final de nuestro backend. Conectamos la respuesta estructurada de GPT-4o con las llamadas a la API de GitLab para crear nuevas observaciones y cerrar hilos resueltos sin intervención humana."
pubDate: 2026-07-23
tags: ["python", "fastapi", "gitlab", "ai", "openai", "code-review"]
categories: ["Backend"]
series: "Ai Code Reviewer"
seriesPart: 9
draft: false
---

# Cerrando el ciclo: Orquestando la resolución automática de discusiones en GitLab

Llegamos al momento de la verdad. En el capítulo anterior ([Parte 8](/blog/ai-code-reviewer-parte-8)) logramos que **GPT-4o** nos devuelva un JSON estricto y tipado con dos listas cruciales:

1. `issues`: Los nuevos problemas detectados en el diff.
2. `resolved_discussions`: Los hilos de conversación previos que el desarrollador ya corrigió en su nuevo commit.

Teníamos el análisis de la IA y las funciones que se comunican con la API de GitLab. Ahora solo faltaba **el orquestador**: la pieza de código que ejecuta la acción correcta para cada elemento devuelto por el modelo.

---

## El bucle de ejecución: De la IA a GitLab

El flujo de orquestación en el backend sigue una secuencia muy sencilla pero potente:

1. **Invocación:** Se envía el prompt con el diff formateado y las discusiones abiertas a `invoke_llm(prompt)`.
2. **Creación:** Iteramos sobre `issues` y llamamos a `send_discussion()` enviando el `file_path`, la `line_number` y las `diff_refs` para ubicar el comentario exactamente en el cambio de código.
3. **Resolución:** Iteramos sobre `resolved_discussions`, extraemos el `discussion_id` y ejecutamos `resolve_discussion()` para marcar el hilo como resuelto mediante un `PUT` a la API de GitLab.

---

## La implementación del Orquestador

Así se ve la lógica central en el servicio de revisión:

```python
# 1. Obtenemos la respuesta estructurada de GPT-4o
invoke_llm_response = await invoke_llm(prompt)

# 2. Publicamos las nuevas observaciones encontradas por la IA
issues = invoke_llm_response.get("issues", [])
for issue in issues:
    await send_discussion(
        project_id,
        iid,
        issue["explanation"],
        diff_refs,
        issue["file_path"],
        line=issue["line_number"]
    )

# 3. Cerramos automáticamente los hilos que el dev ya corrigió
for resolved_discussion in invoke_llm_response.get("resolved_discussions", []):
    discussion_id = resolved_discussion.get("discussion_id")
    if discussion_id:
        await resolve_discussion(project_id, iid, discussion_id)
```

---

## ¿Por qué este enfoque simplifica todo?

1. **Procesamiento Asíncrono puro:** Usar `await` en cada llamada evita bloquear el loop de eventos de FastAPI, lo que permite que el backend pueda procesar múltiples webhooks de Merge Requests simultáneamente.
2. **Desacoplamiento:** El orquestador no sabe cómo funciona el prompt de OpenAI ni conoce los detalles de autenticación con los headers de GitLab. Solo coordina datos de entrada y salida.
3. **Manejo defensivo con `.get()`:** Si en algún caso la IA no detecta problemas ni correcciones, `.get("issues", [])` y `.get("resolved_discussions", [])` retornan listas vacías de forma segura, evitando errores tipo `KeyError`.

---

## El resultado en tiempo real

Ver esto en acción dentro del Merge Request es donde el esfuerzo cobra sentido:

- **En el Push #1:** El desarrollador sube código con un fallo de seguridad. El bot corre en segundos y deja una *Discussion* fijada en la línea exacta.
- **En el Push #2:** El desarrollador aplica el fix y hace `git push`.
- **En segundo plano:** Nuestro webhook recibe el evento, le envía a GPT-4o el nuevo diff + el hilo previo, la IA identifica que la sugerencia fue implementada y el orquestador llama a GitLab para marcar la conversación con un check verde de **"Resolved"**.

---

## Próximos pasos

Ya tenemos un **Code Reviewer automatizado funcional de principio a fin**: recibe webhooks, analiza diffs con GPT-4o, crea observaciones en las líneas correctas y resuelve hilos viejos.

Sin embargo, para que esta solución sea verdaderamente resistente en un entorno de producción enterprise, necesitamos hablar de **seguridad, manejo de errores y resiliencia**.

En el **capítulo final (Parte 10)** cubriremos:
- Verificación de firmas para asegurar que solo recibimos Webhooks válidos de GitLab.
- Manejo de Rate Limits tanto de la API de OpenAI como de GitLab.
- Ideas para extender el bot con paneles de métricas o despliegue en Docker/GCP.
