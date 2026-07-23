---
title: "El primer paso: hacer que GitLab me avise cuando ocurre un Merge Request"
description: "Antes de utilizar modelos de IA, era necesario resolver un problema de backend básico: integrar Webhooks en FastAPI para capturar eventos de GitLab en tiempo real."
pubDate: 2026-07-24
tags: ["gitlab", "webhook", "fastapi", "python", "ngrok"]
categories: ["AI"]
series: "Ai Code Reviewer"
seriesPart: 3
draft: false
---

# El primer paso: hacer que GitLab me avise cuando ocurre un Merge Request

Después de preparar el entorno de desarrollo llegó el momento de escribir la primera funcionalidad del proyecto.

Y curiosamente, **no tenía nada que ver con Inteligencia Artificial.**

Antes de pensar en *prompts*, modelos de lenguaje o agentes, había un problema de backend fundamental que resolver:

> **¿Cómo se entera mi microservicio de que un desarrollador creó o actualizó un Merge Request?**

Si el sistema no sabe que ocurrió un cambio en tiempo real, nunca podrá analizar el código. Así que ese fue el verdadero punto de partida.

---

## Diseñando el flujo de eventos

Antes de escribir código, me gusta dibujar el flujo para tener claridad sobre las responsabilidades de cada componente:

```text
Developer
    │ (Git Push)
    ▼
GitLab Repository
    │ (Evento: MR Creado / Actualizado)
    ▼
GitLab Webhook Engine
    │ (HTTP POST Request)
    ▼
Tunneling (ngrok / Entorno Local)
    │
    ▼
FastAPI App (Recepción & Validación)
```

No tendría sentido que mi aplicación consulte constantemente la API de GitLab mediante *polling* preguntando si hay cambios. Eso consumiría recursos innecesarios y añadiría latencia.

GitLab ya ofrece una solución óptima para esto: **los Webhooks**.

---

## La metáfora del Webhook

La forma más sencilla de entender un Webhook es pensar en una llamada telefónica o una notificación.

En lugar de llamar a una tienda cada cinco minutos a preguntar: *¿Ya llegó el paquete?*, simplemente les dejas tu número telefónico. Cuando el paquete llega, ellos te llaman a ti.

En términos de ingeniería de software, esa "llamada" es una **petición HTTP POST** que envía un *payload* en formato JSON con la información exacta del evento ocurrido.

---

## Configuración en GitLab y el reto del entorno local

El primer paso fue configurar el Webhook en el repositorio de GitLab indicando:

- La URL donde estaría escuchando mi API.
- El evento específico que me interesaba (*Merge Request events*).
- Un token secreto para autenticar las peticiones entrantes.

Sin embargo, surgió el primer obstáculo clásico del desarrollo local: **mi aplicación se ejecutaba en `http://localhost:8000`**.

GitLab está en la nube y no puede enviar peticiones a direcciones locales. Para solucionar esto sin necesidad de desplegar en un servidor remoto en esta fase previa, utilicé **ngrok**.

Con un solo comando expones un puerto local mediante un túnel seguro HTTPS con URL pública:

`ngrok http 8000`

---

## La primera prueba de integración

Con la URL pública configurada en GitLab, creé un Merge Request de prueba para validar la conexión.

Al presionar *Save changes*, la consola de FastAPI registró una petición `POST 200 OK`. 

El *payload* recibido era un JSON extenso con decenas de atributos: autores, IDs del proyecto, estados del MR, referencias a *commits*, entre otros.

En ese punto no era necesario procesar cada campo. Lo crucial era verificar que el canal de comunicación bidireccional entre GitLab y mi aplicación en Python funcionaba correctamente.

---

## ¿Qué viene ahora?

Recibir la notificación del evento es solo el disparador (*trigger*).

El webhook avisa que algo cambió, pero no incluye directamente el **diff** (el código modificado línea por línea) que requiere la IA para analizar el contexto.

En el próximo artículo exploraremos cómo autenticarnos contra la **API REST de GitLab** desde FastAPI para extraer el diff específico de un Merge Request.
