# Configuración del Entorno Local

## Prerrequisitos

- [Python](https://www.python.org/downloads/) (versión 3.13 o superior)
- [Node.js](https://nodejs.org/) (versión 18 o superior)

## Inicialización

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

## Configurar la BD

- La base de datos del proyecto está alojada en Render. Para conectarse se necesitan credenciales
  que siguen la estructura del [.env.example](./.env.example). Solo debes crear una copia de dicho
  archivo con el nombre `.env`, y llenar los campos con los valores apropiados.
