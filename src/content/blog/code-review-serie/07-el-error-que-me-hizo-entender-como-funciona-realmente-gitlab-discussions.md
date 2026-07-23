---
title: "El error que me hizo entender cómo funciona realmente GitLab Discussions"
description: "Todo parecía estar listo para publicar comentarios en un Merge Request... hasta que la API de GitLab respondió con un error 400 que me obligó a entender a fondo la estructura de position y line_code."
pubDate: 2026-07-21
tags: ["gitlab", "discussions", "api", "python", "fastapi"]
categories: ["AI"]
series: "Ai Code Reviewer"
seriesPart: 7
draft: false
---

# El error que me hizo entender cómo funciona realmente GitLab Discussions

Después de varios días de trabajo sentía que ya tenía todas las piezas.

Mi aplicación recibía el Webhook.  
Obtenía el Merge Request.  
Consultaba el diff.  
Calculaba correctamente las líneas modificadas.  
E incluso el entorno para el modelo de IA ya estaba preparado.  

Solo faltaba una cosa: **publicar el comentario directamente en GitLab.**

Pensé que sería la parte más sencilla del proyecto. Estaba completamente equivocado.

---

## El primer intento

Preparé la petición a la API de *Discussions*, construí el objeto de posición preliminar, envié el comentario y esperé la respuesta.

El servidor respondió inmediatamente con un error de cliente:

```text
400 Bad Request

line_code can't be blank
position is incomplete
```

No entendía qué estaba pasando. Según mi lectura inicial de los parámetros, estaba enviando el mensaje y la línea del archivo.

Sin embargo, GitLab seguía rechazando la petición una y otra vez.

---

## Cuando la documentación no es suficiente

Lo primero que hice fue revisar nuevamente la documentación oficial de la API REST de GitLab para el endpoint de *Discussions*:

`POST /projects/:id/merge_requests/:merge_request_iid/discussions`

Comparé cada campo, verifiqué los nombres y revisé el tipo de dato. Todo parecía en orden a simple vista.

Eso fue lo más frustrante: cuando el error dice que falta un campo o que es inválido, pero estás seguro de haberlo enviado, el problema suele estar en la **jerarquía y relación de los datos de versión**.

---

## El problema no era el comentario

Después de imprimir el payload completo, descubrí algo clave.

El mensaje del comentario estaba bien.  
El archivo especificado era el correcto.  
El Merge Request también.  

El verdadero problema estaba en el objeto **`position`** y en cómo GitLab vincula un comentario con un *commit* específico.

GitLab no identifica una línea en un Merge Request únicamente por su número (por ejemplo, "línea 25"). Necesita conocer las referencias cruzadas del control de versiones:

- `base_sha`: El commit base sobre el que se creó la rama.
- `start_sha`: El commit de inicio del rango del diff.
- `head_sha`: El commit más reciente de la rama del Merge Request.
- `position_type`: `"text"` (para revisiones de código).
- `new_path` / `old_path`: La ruta del archivo.
- `new_line`: La línea exacta calculada por nuestro parser.

Sin la combinación exacta de estos atributos, GitLab no puede garantizar que el comentario se posicione en el diff correcto y arroja el ambiguo error `line_code can't be blank`.

---

## Ahí entendí mi error

Durante los artículos anteriores me había concentrado únicamente en calcular el número de línea modificado dentro del archivo. Pensaba que ese era el problema difícil.

En realidad, solo era la mitad del trabajo.

La otra mitad consistía en extraer las referencias de los *shas* del Merge Request y construir el payload `position` con la estructura jerárquica exacta que la API de GitLab exige.

Ahí fue donde el parser de diffs que construimos en el capítulo anterior tomó verdadero sentido: sin la trazabilidad precisa entre el archivo viejo y el nuevo, era imposible enviarle a GitLab la posición correcta.

---

## Construyendo la estructura de `position`

Una vez que entendí la documentación, la llamada en Python con `httpx` quedó así. El truco principal estuvo en estructurar el diccionario `position` con los hashes del commit (`diff_refs`):

```python
import httpx

api_url = f"[https://gitlab.com/api/v4/projects/](https://gitlab.com/api/v4/projects/){project_id}/merge_requests/{merge_request_iid}/discussions"

headers = {
    "PRIVATE-TOKEN": GITLAB_TOKEN
}

payload = {
    "body": message,
    "position": {
        "position_type": "text",
        "old_path": file_path,
        "new_path": file_path,
        "new_line": line,
        "base_sha": diff_refs.get("base_sha"),
        "head_sha": diff_refs.get("head_sha"),
        "start_sha": diff_refs.get("start_sha"),
    }
}

async with httpx.AsyncClient(timeout=30.0) as client:
    response = await client.post(api_url, headers=headers, json=payload)
```

Notarás que `new_line` recibe el número de línea que calculamos con nuestro parser en el capítulo anterior, mientras que `base_sha`, `head_sha` y `start_sha` le dan a GitLab el punto exacto de comparación en el historial de Git.

---

## Una pequeña victoria

Después de ajustar el código para adjuntar los *hashes* del commit junto con la posición calculada, ejecuté nuevamente la prueba.

La consola arrojó una respuesta exitosa `201 Created`.

Actualicé la pestaña del Merge Request en el navegador y ahí estaba: **el primer comentario publicado automáticamente en la línea exacta del código modificado.**

Puede parecer un detalle pequeño dentro de una aplicación enorme, pero ver a tu backend interactuar con la plataforma de desarrollo e insertar una nota en el lugar exacto hace que todo el esfuerzo valga la pena.

---

## Mirando hacia atrás

Curiosamente, este error de la API terminó siendo una ventaja.

Me obligó a entender cómo GitLab representa internamente el estado de un *diff* y cómo gestiona las discusiones en hilos. Si la petición hubiera funcionado al primer intento sin objeciones, probablemente no habría profundizado en la arquitectura interna del control de versiones.

---

## Lo que viene

Hasta este punto el pipeline de integración está 100% operativo:

1. GitLab notifica el evento vía Webhook.
2. FastAPI extrae los metadatos y consulta el diff.
3. El algoritmo calcula los desplazamientos de línea.
4. El backend construye el payload `position` y publica la observación.

Ahora sí llegamos al núcleo por el cual nació este proyecto.

Hasta ahora los comentarios eran estáticos para validar el pipeline. En el siguiente capítulo comenzaremos a **integrar el modelo de lenguaje (LLM)** para que analice el diff y genere las observaciones de código de forma automática.
