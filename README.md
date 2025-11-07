# Proyecto Colegio Canino

Aplicación web para la gestión de un colegio canino, incluyendo clientes, mascotas, matrículas y
asistencia.

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

La forma recomendada para inicializar tu entorno de desarrollo es installando `uv` y `task` para
trabajar comodamente con Python y ejecutar tareas repetitivas usando comados simples,
respectivamente.

Los comandos varían por sistema operativo:

- Windows:

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex
winget install Task.Task
```

- Unix (Ubuntu/Debian):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
curl -1sLf 'https://dl.cloudsmith.io/public/task/task/setup.deb.sh' | sudo -E bash
apt install task
```

Posteriormente ejecuta `task setup` para instalar las dependencias del Frontend y Backend.

### Configurar la BD

- La base de datos del proyecto está alojada en Render. Para conectarse se necesitan credenciales
  que siguen la estructura del [.env.example](./.env.example). Solo debes crear una copia de dicho
  archivo con el nombre `.env`, y llenar los campos con los valores apropiados.

### Gestión de la Base de Datos

La base de datos de desarrollo es una instancia de PostgreSQL alojada en Render. Todos trabajamos
sobre esta misma base de datos para mantener la consistencia.

Conexión Directa (con DBeaver, PgAdmin, etc.) Si necesitas inspeccionar la base de datos
directamente, puedes conectarte usando un cliente de escritorio.

### Flujo de Trabajo

Crea una nueva rama: A partir de develop, crea una rama para la funcionalidad que vas a desarrollar
(ej. feature/HU-9-registro-cliente).

git switch feature/nombre-de-tu-funcionalidad

Ejecuta los servidores:

En la terminal del backend (server/ con venv activo): python manage.py runserver

En la terminal del frontend (client/): npm run dev

Ahora puedes empezar a:

Crear los modelos en server/api/models.py. Crear y aplicar las migraciones (makemigrations,
migrate). Crear serializadores y vistas para la API. Crear componentes en React para consumir la
API. Haz commits y push: Cuando termines tu funcionalidad, sube tu rama a GitHub y crea un Pull
Request para fusionarla con develop.

### Probar JWT

La forma más rápida de probar que JWT retorne tokens para un determinado usuario es con el siguiente
comando dependiendo del sistema operativo:

- Unix:

```bash
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username": "<username>", "password": "<password>"}' \
  http://localhost:8000/api/login/
```

- Windows:

```bash
curl.exe `
  -X POST `
  -H "Content-Type: application/json" `
  -d "{\"username\":\"<username>\",\"password\":\"<password>\"}" `
  "http://127.0.0.1:8000/api/login/"
```

Debes reemplazar `<username>` y `<password>` con el nombre de usuario y contraseña, respectivamente.
