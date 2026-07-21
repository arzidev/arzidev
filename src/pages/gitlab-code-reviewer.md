---
layout: ../layouts/Layout.astro
title: "Code Reviewer automático con GitLab Webhooks"
description: "Cómo construí un sistema de revisión de código automática usando GitLab webhooks, la API de OpenAI y Supabase, que analiza diffs y publica los hallazgos directamente como discusiones en los merge requests."
pubDate: 2026-07-21
tags: ["GitLab", "OpenAI", "Supabase", "PostgreSQL", "TypeScript", "Webhooks", "AI"]
---

# Code Reviewer automático con GitLab Webhooks

Una de las partes más costosas en tiempo dentro de cualquier equipo de desarrollo es la revisión de código. No porque sea innecesaria, sino porque requiere contexto, concentración y disponibilidad. Me pregunté si podía automatizar al menos una primera pasada: detectar problemas evidentes, malas prácticas o inconsistencias antes de que un humano se siente a revisar.

El resultado es un servicio que escucha los webhooks de GitLab, toma el diff de cada merge request, lo envía a un modelo de lenguaje y publica los hallazgos directamente como discusiones en el MR.

## Cómo funciona

El flujo es relativamente sencillo desde afuera, pero tiene varios detalles importantes en la implementación:

1. **GitLab envía un webhook** cada vez que se abre o actualiza un merge request.
2. El servicio extrae el **diff del MR** usando la API de GitLab.
3. El diff se envía a **OpenAI** con un prompt que instruye al modelo a actuar como un revisor de código senior.
4. Los issues encontrados por el modelo se transforman en **discusiones en el MR**, asociadas a la línea exacta del diff cuando es posible.
5. Cada issue también se **persiste en Supabase** (PostgreSQL) junto con el identificador del MR, el archivo, la línea y el estado de resolución.

## Stack

- **NestJS** como framework principal del servicio.
- **GitLab Webhooks API** para recibir eventos de merge requests.
- **GitLab REST API** para obtener el diff y crear discusiones.
- **OpenAI API** (`gpt-4o`) para el análisis del código.
- **Supabase** (PostgreSQL) para persistir los issues y su estado.

## El prompt de revisión

El prompt es la pieza más crítica del sistema. Un prompt mal diseñado produce demasiado ruido, comentarios obvios o falsos positivos que terminan siendo ignorados por el equipo.

El enfoque que tomé fue instruir al modelo para que se comporte como un revisor con contexto limitado: solo ve el diff, no el repositorio completo. Por eso el prompt le indica explícitamente que solo comente sobre lo que puede ver, que evite suposiciones sobre código que no está en el diff y que priorice issues reales sobre estilo.

La respuesta del modelo se pide en JSON estructurado, con campos como `file`, `line`, `severity` y `message`, lo que facilita el mapeo a la API de discusiones de GitLab.

## Guardar y rastrear issues

Cada issue retornado por el modelo se guarda en una tabla `review_issues` en Supabase con al menos:

- `mr_id` — identificador del merge request en GitLab.
- `file` y `line` — ubicación del issue.
- `message` — descripción del problema.
- `severity` — nivel de criticidad (`info`, `warning`, `error`).
- `discussion_id` — ID de la discusión creada en GitLab.
- `resolved` — si el issue ha sido marcado como resuelto.

Persistir los issues permite cruzar información entre el estado de la discusión en GitLab y la base de datos, que es exactamente lo que estoy trabajando ahora.

## Lo que estoy trabajando: validar si los issues se resolvieron

El siguiente paso lógico es cerrar el ciclo: saber si los problemas reportados fueron efectivamente atendidos.

GitLab permite consultar el estado de una discusión (si fue resuelta o no). La idea es implementar un job periódico que itere sobre los issues abiertos en la base de datos, consulte el estado de la discusión correspondiente en GitLab a través de su API, y actualice el campo `resolved` según lo que devuelva.

Esto abre la puerta a métricas útiles: cuántos issues se generaron por MR, qué porcentaje se resolvió, cuáles fueron los archivos con más problemas recurrentes, etc.

## Próximos pasos

- Finalizar la lógica de sincronización de estado de discusiones.
- Evaluar si vale la pena re-revisar el diff una vez que el MR tenga commits adicionales.
- Explorar el uso de embeddings para detectar si un issue nuevo es similar a uno que ya fue ignorado anteriormente.
