---
title: "Entendiendo un Git Diff: el problema que no esperaba encontrar"
description: "Obtener el diff de un Merge Request fue sencillo. Entender la anatomía de un hunk header (@@ -a,b +c,d @@) para ubicar comentarios fue una historia completamente diferente."
pubDate: 2026-07-19
tags: ["git", "gitlab", "diff", "python", "backend"]
categories: ["AI"]
series: "Ai Code Reviewer"
seriesPart: 5
draft: false
---

# Entendiendo un Git Diff: el problema que no esperaba encontrar

En el artículo anterior conseguí obtener el diff de un Merge Request utilizando la API de GitLab.

Pensé que ya tenía prácticamente todo resuelto. Después de todo, el modelo de IA solo necesitaba leer el código modificado... ¿cierto?

No exactamente.

Cuando imprimí el contenido del diff por primera vez, me encontré con un bloque de texto en formato **Unified Diff** que, siendo sincero, nunca me había detenido a analizar a bajo nivel:

```text
@@ -10,7 +10,8 @@

 const user = getUser();

-console.log(user.name);
+console.log(user.fullName);
```

Hasta ese momento siempre había visto los diffs en las interfaces de GitHub o GitLab. Los entendía visualmente: sabía qué líneas se agregaban en verde y cuáles se eliminaban en rojo. 

Pero nunca había necesitado comprender el formato subyacente a nivel de parser. Y ahora mi aplicación en Python tenía que hacerlo obligatoriamente.

---

## Lo que yo veía... y lo que veía la máquina

Para mí la intención era evidente: la propiedad `name` había sido reemplazada por `fullName`.

Sin embargo, para mi backend todo era simplemente un *string* plano. 

Si quería que el AI Code Reviewer publicara un comentario directamente sobre la línea exacta en la interfaz de GitLab, primero tenía que mapear e interpretar cada fragmento del texto.

---

## Desglosando el formato: Las líneas sencillas

Las primeras líneas del cambio fueron fáciles de interpretar:

- `console.log(user.name);` → El signo `-` al inicio indica que esa línea existía antes del cambio y fue eliminada.
+ `console.log(user.fullName);` → El signo `+` representa una línea nueva que fue agregada en este Merge Request.

Hasta aquí todo parecía bastante intuitivo.

---

## El verdadero misterio: El Hunk Header

Lo que realmente me desconcertó fue este encabezado:

@@ -10,7 +10,8 @@

Durante los primeros minutos simplemente lo ignoré, pensando que era un metadato secundario sin relevancia. 

Pero estaba completamente equivocado. Esa línea (llamada oficialmente **Hunk Header**) terminó siendo la pieza más importante de todo el algoritmo.

---

## ¿Qué significa realmente `@@ -10,7 +10,8 @@`?

Al investigar la especificación del formato *Unified Diff*, entendí que ese encabezado define el rango de contexto donde ocurren las modificaciones dentro del archivo:

- **`-10,7`**: Indica el estado en el archivo original (pre-cambio). Los cambios empiezan en la línea 10 y abarca un bloque (*hunk*) de 7 líneas de contexto.
- **`+10,8`**: Indica el estado en el archivo nuevo (post-cambio). Los cambios comienzan en la línea 10, pero ahora el bloque ocupa 8 líneas debido a las adiciones.

Eso explicó por qué agregar o eliminar código desplaza los números de línea del resto del archivo, y por qué calcular la posición exacta de un comentario no era tan simple como un contador incremental (`line++`).

---

## El diff como una secuencia de transformaciones

Después de entender esa estructura, dejé de ver el diff como un bloque de texto desordenado y pasé a verlo como un conjunto de instrucciones de transformación.

Cada bloque responde a preguntas clave de ingeniería:
* ¿En qué línea exacta del archivo original/nuevo inicia el cambio?
* ¿Qué líneas forman el contexto sin modificar?
* ¿Qué líneas fueron agregadas o eliminadas?

Esa era exactamente la estructura de datos que necesitaba construir antes de consultar al modelo de IA.

---

## El siguiente reto técnico

Aunque ya entendía la anatomía del diff, aún quedaba un problema por resolver.

GitLab no permite publicar un comentario enviando un número de línea al azar; requiere la **posición relativa dentro del diff** (*old_line* vs *new_line*).

En el próximo artículo explicaré cómo construí el algoritmo en Python para calcular estas posiciones recorriendo el diff y por qué este parser terminó siendo el núcleo del AI Code Reviewer.
