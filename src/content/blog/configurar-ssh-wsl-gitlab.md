---
title: "Cómo configurar llaves SSH en WSL2 para GitLab (Paso a Paso)"
description: "Guía rápida y paso a paso para generar, configurar y autenticar tus SSH keys desde Windows Subsystem for Linux (WSL) hacia GitLab de forma segura."
pubDate: 2026-07-21
tags: ["GitLab", "WSL", "SSH", "Linux", "DevOps"]
categories: ["DevOps"]
---

Si desarrollas en Windows utilizando WSL2 (Ubuntu, Debian, etc.), uno de los primeros obstáculos al configurar tu entorno es la autenticación con tu proveedor de Git. Usar HTTPS e ingresar credenciales o tokens en cada git push o git pull resulta incómodo e ineficiente.

La solución limpia y estándar en la industria es usar llaves SSH. En esta guía te muestro cómo configurarlas en menos de 5 minutos directamente desde la terminal de tu WSL hacia GitLab.

## 1. Abrir la terminal de WSL

Asegúrate de ejecutar tus comandos dentro de la distribución de Linux en WSL y no en el PowerShell de Windows.

```bash
#Verifica que estés en tu home directory de Linux
cd ~
```

## 2. Generar un nuevo par de llaves SSH

Utilizaremos el algoritmo ED25519, que actualmente es la recomendación estándar por ser más seguro y rápido que RSA.

Ejecuta el siguiente comando (reemplaza con tu correo registrado en GitLab):

```bash
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"
```
Ruta del archivo: Presiona Enter para guardar la llave en la ubicación por defecto (~/.ssh/id_ed25519).

Passphrase (Opcional): Puedes ingresar una frase de paso para mayor seguridad o presionar Enter dos veces para dejarla sin clave.

## 3. Iniciar el agente SSH y añadir la llave
Para que tu entorno en WSL administre la llave de forma automática, inicia el ssh-agent:

```bash
eval "$(ssh-agent -s)"
```

A continuación, añade tu clave privada al agente:

```bash
ssh-add ~/.ssh/id_ed25519
```

## 4. Copiar la llave pública
Para registrar la llave en GitLab, necesitas copiar el contenido de tu llave pública (id_ed25519.pub).

Muestra el contenido en consola con cat:

```bash
cat ~/.ssh/id_ed25519.pub
```

## 5. Registrar la llave en GitLab

1. Inicia sesión en GitLab.
2. Haz clic en tu foto de perfil (esquina superior derecha/izquierda según la interfaz) y ve a Preferences / Preferencias.
3. En el menú lateral, selecciona SSH Keys.
4. Haz clic en Add new key.
5. Pega tu llave pública en el campo Key.
6. Asígnale un Title descriptivo (ej: WSL-Ubuntu-Laptop).
7. Selecciona una fecha de expiración si lo requiere tu política y haz clic en Add key.
