---
title: "Conectando el modelo de IA: Structured Outputs y resolución automática de discusiones"
description: "Llegó el momento de darle cerebro a nuestro bot. Usando GPT-4o y Structured Outputs (JSON Schema), logramos que la IA analice el diff, cree nuevas discusiones y cierre las que el dev ya corrigió."
pubDate: 2026-07-22
tags: ["ai", "openai", "python", "fastapi", "code-review", "gitlab"]
categories: ["AI"]
series: "Ai Code Reviewer"
seriesPart: 8
draft: false
---

# Conectando el modelo de IA: Structured Outputs y resolución automática de discusiones

Durante los primeros siete capítulos construimos toda la fontanería del proyecto:

1. Recibir y validar los Webhooks de GitLab.
2. Consultar la API del Merge Request y parsear los diffs.
3. Mapear las líneas modificadas exactas.
4. Vencer el error 400 y entender cómo publicar *Discussions* con la posición y los SHAs correctos.

Teníamos la tubería lista, pero faltaba lo más importante: **el cerebro del sistema.**

Hasta ahora publicábamos comentarios estáticos. En este capítulo integramos **GPT-4o** con **Structured Outputs** para analizar el código de forma determinista y gestionar el ciclo de vida completo de las observaciones.

---

## El verdadero reto: datos 100% predecibles

Pedirle a una IA *"revisa este diff"* en texto libre es una trampa. 

Si el modelo responde con prosa (*"En la línea 15 deberías validar si es None..."*), el backend tendría que hacer malabares con expresiones regulares para adivinar el archivo, la línea y la categoría del problema.

Necesitábamos garantizado un **JSON estricto y tipado**. 

Para esto utilicé la funcionalidad nativa de **Structured Outputs (JSON Schema con `strict: True`)** del SDK de OpenAI. De esta manera, la API no devuelve texto libre, sino que fuerza al LLM a respetar un esquema rígido que nuestro backend parsea directamente con `json.loads()`.

---

## Dos responsabilidades clave

Un buen Code Reviewer en la vida real no solo busca problemas nuevos: también reconoce cuando un desarrollador ya corrigió una observación previa.

Por eso, estructuré la respuesta de la IA en dos listas principales:

1. **`resolved_discussions`**: Identifica hilos de discusión abiertos que el desarrollador **ya solucionó** en este nuevo push para marcarlos como resueltos.
2. **`issues`**: Detecta **nuevos problemas** exclusivamente en las líneas añadidas (`ADDED_LINE_NUMBER=N`).

---

## La implementación en Python y el System Prompt completo

Mostrar el System Prompt completo es vital porque representa prácticamente el **80% de la lógica de negocio** de la IA. Aquí no hay magia negra: hay instrucciones claras sobre qué buscar, qué ignorar y qué estructura devolver.

Así quedó el módulo encargado de invocar a GPT-4o con el cliente asíncrono `AsyncOpenAI`:

```python
import os
import json
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def invoke(prompt: str) -> dict:
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": """
Eres un Principal Backend Engineer y experto en ciberseguridad. Tu tarea es hacer Code Review de un Merge Request en GitLab comparando las discusiones existentes contra el nuevo diff.

---

### 🎯 TUS RESPONSABILIDADES:

1. EVALUAR DISCUSIONES EXISTENTES (Resoluciones):
- Revisa la lista de discusiones abiertas (donde "resolved": false y "resolvable": true).
- Compara el código actual en el diff contra el problema reportado en la discusión.
- Si el desarrollador AGREGÓ código que corrige el problema (ej: agregó validaciones de null, try/catch, etc.), debes marcar esa discusión como RESUELTA.

2. GENERAR NUEVAS DISCUSIONES:
- Analiza únicamente las líneas añadidas del diff (marcadas con ADDED_LINE_NUMBER=N).
- Si encuentras un problema nuevo en una línea que NO tiene una discusión existente asociada, genera una nueva discusión.

---

### 🛑 QUÉ BUSCAR Y QUÉ IGNORAR:

BUSCA ÚNICAMENTE:
- Bugs
- Vulnerabilidades de seguridad / Hardcoded Secrets
- Manejo incorrecto de errores / Excepciones genéricas
- Posibles NullPointer o valores undefined (MISSING_NULL_CHECK)
- Memory leaks
- Concurrencia / Race conditions
- Rendimiento / Consultas ineficientes (N+1, Blocking I/O)
- Código innecesario
- Violaciones severas de SOLID / Clean Architecture

NO COMENTES SOBRE:
- Formato, estilo o indentación.
- Nombres de variables o preferencias personales.

---

### 📦 ESTRUCTURA DE LA RESPUESTA:

Debes responder OBLIGATORIAMENTE con la siguiente estructura JSON conteniendo dos listas:

1. "resolved_discussions": Lista de discusiones que fueron SOLUCIONADAS en el diff actual.
2. "new_discussions": Lista de NUEVOS problemas encontrados.

Si no hay discusiones resueltas ni errores nuevos, devuelve ambas listas vacías: 
{"resolved_discussions": [], "issues": []}
"""
            },
            {"role": "user", "content": prompt},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "review_response",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "resolved_discussions": {
                            "type": "array",
                            "description": "Lista de IDs de discusiones anteriores que ya fueron corregidas en este diff.",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "discussion_id": {"type": "string"},
                                    "note_id": {"type": "string"},
                                    "reason": {"type": "string"}
                                },
                                "required": ["discussion_id", "note_id", "reason"],
                                "additionalProperties": False
                            }
                        },
                        "issues": {
                            "type": "array",
                            "description": "Lista de nuevos problemas detectados en las líneas añadidas.",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "rule_id": {"type": "string"},
                                    "file_path": {"type": "string"},
                                    "line_number": {"type": "integer"},
                                    "code_snippet": {"type": "string"},
                                    "explanation": {"type": "string"},
                                    "title": {"type": "string"}
                                },
                                "required": [
                                    "rule_id",
                                    "file_path",
                                    "line_number",
                                    "code_snippet",
                                    "explanation",
                                    "title"
                                ],
                                "additionalProperties": False
                            }
                        }
                    },
                    "required": ["resolved_discussions", "issues"],
                    "additionalProperties": False
                }
            }
        }
    )

    return json.loads(response.choices[0].message.content)
```

---

## Tres detalles clave de esta estrategia

1. **Marcado explícito con `ADDED_LINE_NUMBER=N`**: Para evitar que la IA invente números de línea o comente en código no modificado, le entregamos el diff formateado previamente con etiquetas explícitas por línea.
2. **`strict: True` en OpenAI**: Garantiza que si la IA intenta agregar un atributo fuera del Schema o cambiar un tipo de dato, la API de OpenAI forzará la corrección internamente antes de responder.
3. **Filtro de estilo**: En el prompt dejamos claro que **no queremos linters de formato** (espacios, indentación o renombrado de variables). El bot solo reacciona ante errores arquitectónicos, fallos de seguridad o bugs reales.

---

> 💡 **Lecciones aprendidas y oportunidades de mejora para producción:**
> 
> Aunque este enfoque resuelve de forma brillante el MVP, implementar esto a escala real en un entorno enterprise tiene algunos *trade-offs* a considerar:
> 
> * **Gestión del contexto y costos (Tokens):** Enviar el diff entero junto a todas las discusiones abiertas en cada nuevo commit funciona bien para MRs pequeños o medianos. En PRs masivos (15+ archivos), esto puede disparar el consumo de tokens. Una mejora natural es filtrar previamente y enviarle a la IA **únicamente los hilos del archivo que sufrió modificaciones**.
> * **Acoplamiento del System Prompt:** Dejar una cadena gigante de texto dentro de la función en Python sirve para prototipar rápido. En producción conviene desacoplar los prompts a archivos `.txt`/`.json` independientes o un gestor de prompts para versionarlos sin necesidad de hacer redespliegues del backend.
> * **Falsos positivos al resolver:** Un LLM evalúa la semántica del cambio, pero en casos raros podría marcar un problema como "resuelto" simplemente porque el desarrollador borró la línea conflictiva, no porque haya solucionado el bug.

---

## La primera prueba completa

Para probar el flujo completo:

1. Hice un push inicial con una consulta SQL concatenada sin validación.
2. El bot analizó el diff y publicó una nueva discusión en la línea correspondiente.
3. Hice un segundo push reemplazando la consulta por un query parametrizado con ORM.
4. El bot se volvió a ejecutar, comparó la discusión anterior contra el nuevo diff y devolvió la discusión dentro de `resolved_discussions`.

Ver cómo el backend leía ese JSON, cerraba la conversación vieja en GitLab y dejaba el MR limpio sin intervención humana fue el momento más gratificante de todo el desarrollo.

---

## Lo que viene

Con el JSON devuelto por GPT-4o, ahora tenemos dos tareas en el backend:

- Para los elementos en `issues`: llamar a la API de *Discussions* (usando la estructura `position` que configuramos en el capítulo 7).
- Para los elementos en `resolved_discussions`: hacer las peticiones `PUT` a GitLab para resolver los hilos automáticamente.

En el próximo capítulo ensamblaremos la lógica de orquestación completa para conectar este módulo de IA con las llamadas a la API de GitLab.
