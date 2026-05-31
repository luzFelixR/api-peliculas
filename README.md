# 🎬 API de Películas con Autenticación JWT

Esta es una API RESTful construida con **Node.js** y **Express** que permite gestionar un catálogo de películas. El proyecto incluye un sistema de registro e inicio de sesión de usuarios, asegurando las rutas de la API mediante **JSON Web Tokens (JWT)**.

## 🚀 Tecnologías Utilizadas

* **Backend:** Node.js, Express.js
* **Base de Datos:** PostgreSQL (para producción en Render) / SQLite (para desarrollo local)
* **ORM:** Sequelize
* **Seguridad:** JWT (JsonWebToken) para autenticación, bcryptjs para el hash de contraseñas.

## ⚙️ Características Principales

* **Autenticación de Usuarios:** Registro seguro de usuarios con encriptación de contraseñas e inicio de sesión que genera un token JWT válido por 2 horas.
* **Operaciones CRUD:** Crear, leer, actualizar y eliminar películas de la base de datos.
* **Rutas Protegidas:** Solo los usuarios autenticados (que envíen un token válido) pueden acceder a la información de las películas o modificarla.
* **Despliegue en la Nube:** Código adaptado para ser alojado fácilmente en servicios como Render.com.

## 🛠️ Instalación y Uso Local

1. Clona este repositorio:
   ```bash
   git clone [https://github.com/luzFelixR/api-peliculas.git](https://github.com/luzFelixR/api-peliculas.git)