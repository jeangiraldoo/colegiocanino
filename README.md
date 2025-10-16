# Proyecto Colegio Canino

Aplicación web para la gestión de un colegio canino, incluyendo clientes, mascotas, matrículas y asistencia.

## Stack Tecnológico

*   **Backend:** Python, Django, Django REST Framework
*   **Frontend:** React, Vite, TypeScript, Material UI
*   **Base de Datos:** PostgreSQL
*   **Alojamiento:** Render

---

## Configuración del Entorno Local

### 1. Prerrequisitos

Asegúrate de tener instalado:
*   [Python](https://www.python.org/downloads/) (versión 3.9 o superior)
*   [Node.js](https://nodejs.org/) (versión 18 o superior)

### 2. Clonar el Repositorio

git clone https://github.com/jeangiraldoo/colegiocanino.git
cd colegiocanino


### 3. Cambiar a la Rama de Desarrollo
Todo el trabajo se realiza sobre la rama develop. Nunca hagas commits directamente a main.

git checkout develop

### 4. Configurar la BD
*   La base de datos del proyecto está alojada en Render. Para conectarse se necesitan credenciales pero por motivos de seguridad no se incluyen en el codigo. 


*  Crea el archivo: Dentro de la carpeta server/, crea un archivo llamado .env.
Pega el contenido: Pega las credenciales que te proporcionaron dentro de server/.env. El archivo se verá así:

DATABASE_URL='postgres://user:password@host/database'

### 5. Configurar el Backend (Django)
Navega a la carpeta del servidor:

cd server

# Crear el entorno (solo la primera vez)
python -m venv venv

# Activar el entorno (siempre que se abra una nueva terminal)
.\venv\Scripts\activate

Instala las dependencias de Python:

pip install -r requirements.txt

Aplica las migraciones: Esto conectará con la base de datos de Render y creará las tablas iniciales.

python manage.py migrate

### 6. Configurar el Frontend (React)
Abre una nueva terminal.
Navega a la carpeta del cliente:

cd client

Instala las dependencias de Node.js:

npm install

### Gestión de la Base de Datos
La base de datos de desarrollo es una instancia de PostgreSQL alojada en Render. Todos trabajamos sobre esta misma base de datos para mantener la consistencia.

Seguridad: La conexión se maneja a través del archivo server/.env, que está excluido del repositorio por .gitignore.

Conexión Directa (con DBeaver, PgAdmin, etc.)
Si necesitas inspeccionar la base de datos directamente, puedes conectarte usando un cliente de escritorio.

### Flujo de Trabajo 
Crea una nueva rama: A partir de develop, crea una rama para la funcionalidad que vas a desarrollar (ej. feature/HU-9-registro-cliente).

git checkout -b feature/nombre-de-tu-funcionalidad

Ejecuta los servidores:

En la terminal del backend (server/ con venv activo): python manage.py runserver

En la terminal del frontend (client/): npm run dev

Ahora puedes empezar a:

Crear los modelos en server/api/models.py.
Crear y aplicar las migraciones (makemigrations, migrate).
Crear serializadores y vistas para la API.
Crear componentes en React para consumir la API.
Haz commits y push: Cuando termines tu funcionalidad, sube tu rama a GitHub y crea un Pull Request para fusionarla con develop.