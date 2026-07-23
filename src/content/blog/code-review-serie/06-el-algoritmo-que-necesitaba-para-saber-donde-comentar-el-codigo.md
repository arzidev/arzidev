---
title: "El algoritmo que necesitaba para saber dónde comentar el código"
description: "Entender el formato de un Git Diff fue solo el principio. Ahora tenía que descubrir exactamente en qué línea debía publicar cada comentario."
pubDate: 2026-07-20
tags: ["git", "gitlab", "diff", "algoritmo", "python"]
categories: ["AI"]
series: "Ai Code Reviewer"
seriesPart: 6
draft: false
---

# El algoritmo que necesitaba para saber dónde comentar el código

Después de entender cómo funciona un Git Diff pensé que ya tenía prácticamente todo listo.

Mi aplicación recibía el Webhook.  
Consultaba la API de GitLab.  
Obtenía el diff.  
Y el modelo de IA podía analizar el código.  

Parecía que el siguiente paso era simplemente publicar los comentarios.

Pero había un detalle que todavía no había considerado:

> **¿Cómo sabe GitLab exactamente en qué línea quiero comentar?**

---

## No basta con conocer el archivo

Al principio imaginé que la API funcionaría de forma directa:

```text
Archivo
   │
   ▼
Línea 24
   │
   ▼
Comentario
```

Algo bastante sencillo.

Pero no. GitLab necesita mucha más información del contexto del cambio. Y para obtenerla, primero debía calcular correctamente las posiciones de cada línea modificada dentro del archivo.

---

## El problema de los desplazamientos

Supongamos este cambio dentro de un archivo:

```diff
@@ -20,4 +20,5 @@

 const user = getUser();

-console.log(user.name);
+console.log(user.fullName);

 saveUser(user);
```

Para un desarrollador resulta evidente: la línea agregada es `console.log(user.fullName);`.

Sin embargo, mi backend no puede asumir a ciegas que esa línea corresponde exactamente al número 21. Las líneas anteriores pudieron haber cambiado, eliminado, o incluso podían existir varios bloques de cambios (*hunks*) dentro del mismo archivo.

Necesitaba recorrer el diff línea por línea y simular el estado del archivo.

---

## Pensando el algoritmo

Antes de escribir código, abrí una libreta y dibujé el problema.

Cada bloque del diff indica en qué línea del archivo original (`old_line`) y del nuevo (`new_line`) comienza el cambio. A partir de ese punto de partida, solo tenía que avanzar los contadores dependiendo del tipo de línea.

La lógica base quedó así:

```text
Si la línea empieza con " " (contexto sin cambio):
  └─> Avanzan ambos contadores (old_line + 1, new_line + 1)

Si empieza con "-" (línea eliminada):
  └─> Avanza solo el archivo original (old_line + 1)

Si empieza con "+" (línea agregada):
  └─> Avanza solo el archivo nuevo (new_line + 1)
```

Cuando lo vi escrito en papel parecía bastante sencillo. Implementarlo y gestionar todos los casos borde fue otra historia.

---

## Recorriendo el diff

La solución consistió en parsear el diff en el orden estricto en que aparece.

Cada línea modifica el estado de los punteros:
- Las líneas de contexto mantienen sincronizados ambos contadores.
- Las eliminadas avanzan únicamente el contador del archivo original.
- Las agregadas avanzan únicamente el contador del archivo nuevo.

Con este recorrido construí una estructura de datos tipo mapa con todas las líneas modificadas:

| Tipo | Línea anterior | Línea nueva |
|:---:|:--------------:|:-----------:|
| `+` | — | 21 |
| `+` | — | 22 |
| `-` | 24 | — |
| `+` | — | 25 |

Esa matriz de posiciones sería la base para indicarle a la IA exactamente dónde señalar sus observaciones.

---

## La primera victoria

Cuando imprimí las posiciones calculadas hice una prueba sencilla: comparé los números generados por el script con las líneas del Merge Request abierto en la interfaz web de GitLab.

**Coincidían perfectamente.**

Por primera vez, la aplicación sabía exactamente dónde se encontraba cada cambio dentro del nuevo estado del archivo. Era un paso pequeño, pero crucial.

---

## Lo que todavía no sabía

Aunque ya podía calcular las líneas modificadas, aún existía un problema.

GitLab no acepta únicamente un número de línea suelto al publicar un comentario. Requiere un objeto payload llamado **`position`** con referencias cruzadas sobre los *hashes* de los commits y el tipo de cambio.

Fue ahí donde apareció el siguiente obstáculo técnico. Un error que terminé viendo en consola demasiadas veces:

```text
400 Bad Request - line_code can't be blank
```

Ese mensaje me obligó a sumergirme de lleno en la documentación interna de la API de *Discussions* de GitLab.

Pero esa historia de cómo armar la estructura del payload `position` merece su propio artículo.
