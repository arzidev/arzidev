---
layout: ../../layouts/Layout.astro
title: "Creando un CRM de WhatsApp SaaS"
description: "Cómo estoy construyendo una plataforma multi-tenant para gestionar conversaciones de WhatsApp, agentes y automatizaciones desde cero, documentando todo el proceso."
pubDate: 2026-07-20
tags: ["NestJS", "Node.js", "TypeScript", "GCP", "Microservices", "WhatsApp", "SaaS"]
---

# Creando un CRM de WhatsApp SaaS

Durante los últimos meses he estado desarrollando un **CRM SaaS para WhatsApp** como proyecto paralelo.

Más que crear otro CRM, mi objetivo ha sido construir un producto real que me permita enfrentar desafíos de ingeniería similares a los que aparecen en aplicaciones utilizadas en producción: arquitectura multitenant, procesamiento de webhooks, comunicación basada en eventos, actualizaciones en tiempo real e integración con servicios externos.

Hasta ahora toda mi energía había estado enfocada en desarrollar el producto, por lo que dejé de lado la documentación. Con este blog quiero empezar a compartir el recorrido, las decisiones técnicas que voy tomando y las lecciones aprendidas a medida que el proyecto evoluciona.

## ¿Por qué estoy construyendo este proyecto?

WhatsApp se ha convertido en el principal canal de comunicación para miles de empresas en Latinoamérica. Sin embargo, muchas de las soluciones existentes son costosas, difíciles de adaptar a las necesidades de cada negocio o limitan las posibilidades de integración y automatización.

Mi objetivo es construir una plataforma que ofrezca una experiencia moderna para gestionar conversaciones de WhatsApp, permitiendo administrar múltiples organizaciones, agentes, conversaciones y métricas desde un único sistema.

Al mismo tiempo, este proyecto es una oportunidad para poner en práctica principios de arquitectura de software, diseñar una solución preparada para crecer e incorporar capacidades de inteligencia artificial que aporten valor a los usuarios.

Cada funcionalidad que implemente será documentada en este blog. Compartiré las decisiones de diseño, los retos encontrados y las soluciones adoptadas, mostrando cómo el proyecto evoluciona desde un MVP hasta una plataforma lista para producción.


## Objetivos del proyecto

La plataforma se está construyendo con un enfoque que prioriza la simplicidad, la mantenibilidad y la posibilidad de evolucionar conforme crezcan las necesidades del producto.

Los principios que guían el desarrollo son:

- Arquitectura multitenant para soportar múltiples organizaciones.
- Arquitectura modular basada en NestJS.
- Comunicación desacoplada mediante un bus de eventos interno.
- Código limpio aplicando SOLID y Clean Architecture.
- Diseño orientado a facilitar futuras integraciones con inteligencia artificial

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


## Estado actual

Actualmente el proyecto cuenta con:

- Integración con WhatsApp Cloud API.
- Gestión de contactos.
- Gestión de conversaciones.
- Arquitectura multitenant.
- Autenticación y autorización.
- Bus de eventos interno para desacoplar módulos.
- Despliegue en Render.


### Arquitectura y decisiones técnicas

Aunque el proyecto comenzó como una idea para aprender y experimentar, rápidamente evolucionó hacia una aplicación pensada para un entorno de producción.

En lugar de adoptar una arquitectura de microservicios desde el principio, decidí construir un **monolito modular con NestJS**, priorizando la simplicidad y la velocidad de desarrollo. Los módulos permanecen desacoplados mediante un bus de eventos interno, lo que facilitará su evolución en el futuro si el producto lo requiere.

### Multi-tenancy

La aplicación utiliza **Supabase** con **PostgreSQL** como base de datos principal.

Cada organización dispone de su propio esquema (schema) dentro de PostgreSQL, permitiendo un buen nivel de aislamiento sin la complejidad operativa de administrar múltiples bases de datos.

### Autenticación

La autenticación está basada en **Supabase Auth**, utilizando JWT para identificar a cada usuario y resolver automáticamente el tenant al que pertenece antes de procesar cada solicitud.

### Integración con WhatsApp

La comunicación con WhatsApp se realiza mediante un **patrón Adapter**, lo que desacopla la lógica de negocio del proveedor de mensajería.

Actualmente la plataforma integra **Meta WhatsApp Cloud API**, pero la arquitectura permite incorporar otros proveedores sin modificar el resto del sistema.

### Bus de eventos

Los distintos módulos se comunican mediante un bus de eventos interno.

Por ejemplo, cuando llega un mensaje desde WhatsApp, el módulo encargado del webhook publica un evento que puede ser consumido por otros módulos como conversaciones, estadísticas o automatizaciones.

Este enfoque reduce el acoplamiento entre módulos y simplifica la incorporación de nuevas funcionalidades.

### Comunicación en tiempo real

Para mantener sincronizada la interfaz de usuario se utilizan **WebSockets**.

Cada vez que ocurre un evento importante —como la llegada de un nuevo mensaje, un cambio de estado o una asignación de agente— el frontend recibe la actualización en tiempo real sin necesidad de realizar consultas constantes al servidor.

### Confiabilidad

Los webhooks implementan mecanismos de **idempotencia** para evitar el procesamiento duplicado de eventos.

Además, cada payload recibido se almacena en su formato original, preparando el camino para un sistema de reintentos que permita reprocesar eventos en caso de fallos temporales.

Esta funcionalidad aún se encuentra en desarrollo.

### Frontend

La interfaz de usuario está desarrollada con **Vue**, consumiendo la API del backend y recibiendo actualizaciones en tiempo real mediante WebSockets.

### Métricas

El sistema ya genera algunas métricas operativas que ayudan a medir el desempeño de los agentes, entre ellas:

- Tiempo promedio de primera respuesta.
- Tiempo promedio de atención.
- Conversaciones por agente.
- Conversaciones por estado.
- Estadísticas generales de operación.

### Modelo de conversaciones

Las conversaciones se administran mediante **sesiones de atención**, respetando la ventana de 24 horas establecida por WhatsApp.

Una vez finalizada esa ventana, la conversación deberá continuar mediante plantillas oficiales, funcionalidad que actualmente se encuentra en desarrollo.