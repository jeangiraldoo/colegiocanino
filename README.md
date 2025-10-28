# Proyecto Colegio Canino

Aplicación web para la gestión de un colegio canino, incluyendo clientes, mascotas, matrículas y asistencia.

## Stack Tecnológico

- **Backend:** Python, Django, Django REST Framework
- **Frontend:** React, Vite, TypeScript, Material UI
- **Base de Datos:** PostgreSQL
- **Alojamiento:** Render

---

## Configuración del Entorno Local

### Prerrequisitos

- [Python](https://www.python.org/downloads/) (versión 3.13 o superior)
- [Node.js](https://nodejs.org/) (versión 18 o superior)

### Inicialización

Ejecuta los siguientes comandos:

```bash
git clone https://github.com/jeangiraldoo/colegiocanino.git
cd colegiocanino
git checkout develop
```

La forma recomendada para inicializar tu entorno de desarrollo es ejecutando `bootstrap.py`.
El comando varía por sistema operativo:

- Windows: `python bootstrap.py`
- Unix: `python3 bootstrap.py`

Este script llevará a cabo las siguientes acciones:

- Creará un entorno virtual `venv/`
- Instalará las dependencias de desarrollo en:
  - Backend: `venv`
  - Frontend: `client/node_modules`

Antes de correr el código es necesario activar el entorno virtual, de modo que el entorno global
de tu sistema no cause problemas. El comando también varía dependiendo del sistema operativo y
shell que uses. Se hace desde la raiz del proyecto.

- Windows: `venv\Scripts\Activate.bat`
- Unix (bash): `venv/bin/activate`
- Unix (fish): `venv/bin/activate.fish`

### Configurar la BD

- La base de datos del proyecto está alojada en Render. Para conectarse se necesitan credenciales pero por motivos de seguridad no se incluyen en el codigo.

- Crea el archivo: Dentro de la carpeta server/, crea un archivo llamado .env.
  Pega el contenido: Pega las credenciales que te proporcionaron dentro de server/.env. El archivo se verá así:

DATABASE_URL='postgres://user:password@host/database'

### Configurar el Backend (Django)

Aplica las migraciones: Esto conectará con la base de datos de Render y creará las tablas iniciales.

python manage.py migrate

### Gestión de la Base de Datos

La base de datos de desarrollo es una instancia de PostgreSQL alojada en Render. Todos trabajamos sobre esta misma base de datos para mantener la consistencia.

Seguridad: La conexión se maneja a través del archivo server/.env, que está excluido del repositorio por .gitignore.

Conexión Directa (con DBeaver, PgAdmin, etc.)
Si necesitas inspeccionar la base de datos directamente, puedes conectarte usando un cliente de escritorio.

### Flujo de Trabajo

Crea una nueva rama: A partir de develop, crea una rama para la funcionalidad que vas a desarrollar (ej. feature/HU-9-registro-cliente).

git switch feature/nombre-de-tu-funcionalidad

Ejecuta los servidores:

En la terminal del backend (server/ con venv activo): python manage.py runserver

En la terminal del frontend (client/): npm run dev

Ahora puedes empezar a:

Crear los modelos en server/api/models.py.
Crear y aplicar las migraciones (makemigrations, migrate).
Crear serializadores y vistas para la API.
Crear componentes en React para consumir la API.
Haz commits y push: Cuando termines tu funcionalidad, sube tu rama a GitHub y crea un Pull Request para fusionarla con develop.

### Probar JWT

La forma más rápida de probar que JWT retorne tokens para un determinado usuario es con el siguiente comando dependiendo
del sistema operativo:

- Unix:

```bash
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username": "<username>", "password": "<password>"}' \
  http://localhost:8000/api/login/
```

- Windows:

```
curl.exe `
  -X POST `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"<username>\",\"password\":\"<password>\"}" `
  "http://127.0.0.1:8000/api/login/"
```

Debes reemplazar `<username>` y `<password>` con el nombre de usuario y contraseña, respectivamente.
