---
title: "Preparando el entorno: por qué elegí Python para este proyecto"
description: "Antes de escribir una sola línea del AI Code Reviewer, tomé una decisión clave: salir de Node.js/NestJS y construir el proyecto en Python. Aquí explico mis razones y cómo preparé el entorno."
pubDate: 2026-07-16
tags: ["python", "fastapi", "backend", "developer-experience"]
categories: ["AI"]
series: "Ai Code Reviewer"
seriesPart: 2
draft: false
---

# Preparando el entorno: por qué elegí Python para este proyecto

En el artículo anterior compartí la idea general de construir un **AI Code Reviewer para GitLab**.

Pero antes de escribir una sola línea de código, tuve que resolver una decisión fundamental de arquitectura y stack:

**¿Con qué lenguaje e infraestructura iba a construirlo?**

La respuesta más obvia y rápida habría sido elegir **Node.js**. 

Al ser el entorno en el que trabajo a diario diseñando APIs y microservicios, me habría permitido tener un producto mínimo viable (MVP) en un par de días. Sin embargo, este proyecto no nació para buscar la ruta más corta, sino para generar **aprendizaje real**.

---

## La comodidad no era el objetivo

Si el único fin fuera lanzar una herramienta lo antes posible, me habría quedado en mi zona de confort.

Pero para aprender de verdad necesitaba ponerme a prueba con un stack distinto. Por eso decidí desarrollar el microservicio completamente en **Python**.

No porque Python sea "superior" a Node.js o JavaScript, ni porque sea el único lenguaje válido para Inteligencia Artificial. Simplemente porque es la tecnología que quiero integrar formalmente a mi perfil como desarrollador Backend.

---

## ¿Por qué Python para este proyecto?

Hay tres razones principales detrás de esta decisión:

1. **Ecosistema nativo de IA:** La mayoría de modelos de lenguaje, SDKs oficiales y librerías emergentes nacen y se optimizan primero en Python.
2. **Documentación y Comunidad:** Es el estándar *de facto* para tooling de Inteligencia Artificial, lo que facilita encontrar patrones y arquitecturas de referencia.
3. **Cambio de paradigma backend:** Venir de un entorno estructurado como **NestJS** (con TypeScript, inyección de dependencias y decoradores) y pasar a Python con **FastAPI** te obliga a repensar cómo estructurar un proyecto de forma limpia pero liviana.

---

## De Node.js a Python: Empezar con mentalidad de principiante

Mi experiencia práctica se ha centrado en el ecosistema de JavaScript/TypeScript:

- Node.js, Express y NestJS.
- Arquitectura de microservicios e integraciones.
- Docker, CI/CD y bases de datos relacionales/NoSQL.

En Python estoy construyendo los cimientos. Eso significa que probablemente escribiré código que dentro de tres o seis meses querré refactorizar por completo.

**Y ese es exactamente el objetivo de documentar esta serie.** Quiero mirar atrás en un tiempo y analizar cómo evolucionó la arquitectura a medida que fui dominando el lenguaje.

---

## El Setup del Entorno de Desarrollo

Para la primera fase mantuve el entorno lo más simple y cercano al estándar de la industria posible, evitando añadir sobre-ingeniería antes de tiempo:

* **Python 3.13:** Usando las últimas características y optimizaciones del lenguaje.
* **Entornos virtuales (`venv`):** Aislamiento limpio de dependencias por proyecto.
* **FastAPI + Uvicorn:** Framework asíncrono de alto rendimiento, ideal para exponer endpoints Webhook con tipado estático (`Pydantic`).
* **Tooling básico:** Visual Studio Code, Git.

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

## Primera decisión de arquitectura: Aún no usaremos LangChain

Tratándose de un proyecto de IA, lo habitual sería instalar `langchain` o frameworks de agentes desde el primer comando. 

Decidí **no hacerlo** en esta etapa.

Prefiero entender primero el flujo a bajo nivel:
* ¿Cómo estructurar las llamadas HTTP directas hacia las APIs de los LLMs?
* ¿Cómo manipular los payloads y controlar la latencia de respuesta?
* ¿Cómo redactar *system prompts* efectivos sin abstracciones en medio?

Cuando el dominio del problema crezca o necesitemos memoria/RAG, incorporaremos esas herramientas. No antes.

---

## El siguiente paso

Con el entorno configurado y FastAPI corriendo, es hora de pasar a la práctica.

En el próximo artículo comenzaremos con el primer componente funcional: **configurar y validar los Webhooks de GitLab en FastAPI** para reaccionar en tiempo real cada vez que se abra o actualice un Merge Request.
