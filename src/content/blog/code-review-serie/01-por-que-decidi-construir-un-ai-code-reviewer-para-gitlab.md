---
title: "Por qué decidí construir un AI Code Reviewer para GitLab"
description: "Inicio de una serie donde documentaré el desarrollo de un AI Code Reviewer para GitLab mientras aprendo Python e Inteligencia Artificial desde la perspectiva de un desarrollador Backend."
pubDate: 2026-07-21
tags: ["gitlab", "python", "ai", "fastapi", "backend"]
categories: ["AI"]
series: "Ai Code Reviewer"
seriesPart: 1
draft: false
---

# Por qué decidí construir un AI Code Reviewer para GitLab

Durante los últimos años he trabajado principalmente desarrollando aplicaciones backend, APIs y microservicios con **Node.js**. Diseñar arquitecturas sólidas y llevar sistemas a producción ha sido mi día a día.

Sin embargo, desde hace tiempo tenía una inquietud clara: **quería aprender Python**.

No buscaba aprender solo la sintaxis o seguir un curso guiado de principio a fin. Quería utilizar Python para construir una solución real, enfrentándome a los retos de diseño, rendimiento e integración que surgen al crear software de verdad.

Al mismo tiempo, la Inteligencia Artificial ha dejado de ser una novedad para convertirse en parte clave del flujo de trabajo de cualquier desarrollador. Modelos capaces de generar código, explicar funciones o revisar cambios llegaron para quedarse.

Así que uní ambos objetivos en una sola pregunta:

> *¿Y si aprovecho el objetivo de dominar Python e IA creando una herramienta útil para mi flujo de trabajo diario?*

Así nació este proyecto.

---

## Adiós a los proyectos de juguete

Podría haber hecho una lista de tareas, un CRUD o un chatbot genérico. Son proyectos válidos para soltar la mano, pero no me mantienen motivado a largo plazo. 

Necesitaba resolver un dolor real. Algo que me obligara a leer documentación oficial, probar enfoques de arquitectura, equivocarme y entender el *porqué* de cada decisión.

Ahí apareció la idea: **Crear un AI Code Reviewer para GitLab.**

---

## El problema: Automatizar lo repetitivo en los Merge Requests

En cualquier equipo de desarrollo, abrir un Merge Request (MR) implica que otro desarrollador debe detener su trabajo para revisarlo. Muchas veces, esa revisión se pierde en detalles repetitivos que no aportan al diseño general:

- Validaciones de entrada faltantes.
- Nombres de variables poco descriptivos.
- Código duplicado o funciones demasiado complejas.
- Pequeños detalles de rendimiento o estilo.

> **Aclaración importante:** No pretendo que una IA reemplace el criterio humano. Las mejores revisiones siguen siendo las de un compañero que entiende el contexto del negocio. 

Sin embargo, **una primera capa de revisión automatizada** puede limpiar el código de errores comunes *antes* de que llegue a ojos humanos, haciendo que las revisiones de equipo se enfoquen en lo que realmente importa: la arquitectura y la lógica de negocio.

---

## Lo que voy a construir (Fase 1)

El objetivo es desarrollar un microservicio que se integre directamente con el ciclo de vida de GitLab:

1. **Capturar eventos:** Recibir notificaciones mediante Webhooks al crear o actualizar un Merge Request.
2. **Filtrar cambios:** Obtener únicamente el *diff* (código modificado).
3. **Analizar con LLM:** Enviar los cambios a un modelo de lenguaje estructurando prompts precisos.
4. **Feedback directo:** Publicar comentarios automáticamente sobre las líneas específicas de código en GitLab.

Prefiero la filosofía de **iterar rápido**: construir una primera versión funcional y sencilla antes de sobre-diseñar el sistema.

```text
GitLab (MR Event)
       │
       ▼
Webhook → FastAPI (Python)
       │
       ▼
Obtener Diff del Merge Request
       │
       ▼
Modelo de Lenguaje (Análisis de código)
       │
       ▼
GitLab API (Comentarios en la línea exacta)
```
---

## La motivación real: Construir conocimiento en público

El *AI Code Reviewer* es la excusa perfecta. Lo que realmente me interesa es profundizar y documentar temas como:

* **Core & Backend:** Python, FastAPI, typing, asincronía y consumo eficiente de las APIs de GitLab.
* **Inteligencia Artificial Aplicada:** Prompt Engineering para análisis de código, estructuración de salidas (JSON), LangChain y técnicas de RAG (*Retrieval-Augmented Generation*).

Quiero documentar este proyecto en público porque normalmente encontramos dos tipos de contenido: tutoriales donde todo sale perfecto al primer intento, o proyectos terminados sin rastro del proceso.

Falta el medio: **las decisiones de diseño, los refactorings, los errores de producción y las ideas que sonaban bien en papel pero fallaron en la práctica.**

---

## ¿Qué viene ahora?

En los próximos artículos iré desglosando el avance paso a paso: desde la configuración del entorno con FastAPI y la recepción de Webhooks, hasta la manipulación de diffs de Git y la integración con modelos de IA.

Si te interesa **Python**, el **desarrollo Backend** o cómo aplicar **Inteligencia Artificial** en flujos reales de CI/CD, te invito a seguir esta serie.
