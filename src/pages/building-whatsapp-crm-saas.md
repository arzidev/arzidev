---
layout: ../layouts/Layout.astro
title: "WhatsApp CRM SaaS"
description: "Plataforma multi-tenant para gestionar conversaciones de WhatsApp, agentes y métricas en tiempo real."
pubDate: 2026-07-20
tags: ["NestJS", "Node.js", "TypeScript", "GCP", "Microservices", "WhatsApp", "SaaS"]
---

# WhatsApp CRM SaaS

> **Estado:** 🚧 En desarrollo

Plataforma CRM diseñada para empresas que utilizan WhatsApp como principal canal de atención al cliente. El proyecto busca ofrecer una solución moderna, escalable y preparada para crecer, facilitando la gestión de conversaciones, agentes, métricas y futuras automatizaciones.

---

## Objetivo

El objetivo es construir un CRM que permita administrar múltiples organizaciones desde una misma plataforma, manteniendo un buen nivel de aislamiento entre clientes y una arquitectura preparada para evolucionar conforme aumenten las necesidades del producto.

Además de resolver un problema real, este proyecto me sirve como laboratorio para experimentar con arquitectura de software, integración de APIs, procesamiento de eventos y capacidades de inteligencia artificial.

---

## Funcionalidades actuales

Actualmente el proyecto incluye:

- Gestión de múltiples organizaciones (multi-tenant).
- Integración con WhatsApp Cloud API.
- Gestión de contactos.
- Gestión de conversaciones.
- Asignación de agentes.
- Autenticación mediante Supabase Auth.
- Actualizaciones en tiempo real mediante WebSockets.
- Bus de eventos interno para desacoplar módulos.
- Métricas de atención y productividad.

---

## Stack tecnológico

| Área | Tecnologías |
|------|-------------|
| **Backend** | Node.js · NestJS · TypeScript |
| **Frontend** | Vue.js |
| **Arquitectura** | Clean Architecture · Hexagonal Architecture · Event Bus · Adapter Pattern |
| **Base de datos** | PostgreSQL (Supabase) |
| **Autenticación** | Supabase Auth |
| **Mensajería** | WhatsApp Cloud API |
| **Tiempo real** | WebSockets |
| **Infraestructura** | Render |

---

## Arquitectura

```text
                 Frontend (Vue.js)
                        │
                 REST API + WebSockets
                        │
                  NestJS Backend
                        │
      ┌─────────────────┼─────────────────┐
      │                 │                 │
 Conversations     Contacts        WhatsApp Adapter
      │                 │                 │
      └─────────────────┼─────────────────┘
                        │
                 Internal Event Bus
                        │
             PostgreSQL (Supabase)
```

---

## Estado actual

Actualmente la plataforma permite gestionar conversaciones de WhatsApp en tiempo real, asignar agentes, administrar contactos y generar métricas básicas de operación.

El proyecto continúa evolucionando con el objetivo de incorporar automatizaciones, inteligencia artificial y nuevas capacidades orientadas a mejorar la productividad de los equipos de atención.

---

## Próximos pasos

- Automatización de flujos de trabajo.
- Envío de mensajes mediante plantillas de WhatsApp.
- Respuestas asistidas por inteligencia artificial.
- Notas internas por conversación.
- Etiquetas y clasificación de conversaciones.
- API pública para integraciones.
- Dashboard con métricas avanzadas.
- Soporte para múltiples proveedores de mensajería.

---