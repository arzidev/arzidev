---
layout: ../layouts/Layout.astro
title: "GitLab AI Reviewer"
description: "Asistente de revisión automática de Merge Requests utilizando GitLab Webhooks y modelos de inteligencia artificial."
pubDate: 2026-07-21
tags: ["GitLab", "OpenAI", "Supabase", "PostgreSQL", "TypeScript", "Webhooks", "AI"]
---

# GitLab AI Reviewer

> **Estado:** 🚧 Prototipo

Asistente de revisión automática de código que analiza los cambios de un Merge Request utilizando modelos de inteligencia artificial y publica sugerencias directamente como discusiones en GitLab.

---

## Objetivo

El objetivo del proyecto es reducir el tiempo invertido en revisiones de código repetitivas, proporcionando una primera revisión automática antes de la intervención de un desarrollador.

La plataforma busca identificar posibles errores, malas prácticas y oportunidades de mejora sin reemplazar la revisión humana, sino complementándola.

---

## Funcionalidades

Actualmente el proyecto permite:

- Recepción de eventos mediante GitLab Webhooks.
- Obtención automática del diff de un Merge Request.
- Análisis del código utilizando modelos de lenguaje.
- Publicación de sugerencias como discusiones en GitLab.
- Persistencia de los hallazgos para su seguimiento.

---

## Stack tecnológico

| Área | Tecnologías |
|------|-------------|
| **Backend** | Python · FastAPI |
| **AI** | OpenAI API |
| **Integraciones** | GitLab Webhooks · GitLab REST API |
| **Base de datos** | Supabase · PostgreSQL |
| **Infraestructura** | Docker |

---

## Arquitectura

```text
GitLab
   │
Merge Request
   │
Webhook
   │
GitLab AI Reviewer
   │
───────────────┬────────────────
               │
         OpenAI API
               │
        Análisis del diff
               │
     GitLab Discussions
               │
        Supabase/PostgreSQL
```

---

## Estado actual

Actualmente el sistema es capaz de:

- Analizar automáticamente los cambios de un Merge Request.
- Generar observaciones utilizando un modelo de IA.
- Publicar comentarios directamente sobre el Merge Request.
- Registrar cada hallazgo para futuras consultas y métricas.

---

## Próximos pasos

- Sincronizar el estado de las discusiones con GitLab.
- Revisión incremental cuando el Merge Request reciba nuevos commits.
- Soporte para múltiples proveedores de modelos de IA.
- Métricas sobre calidad del código y evolución de los repositorios.
- Configuración de reglas de revisión por proyecto.

---