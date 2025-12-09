# Flujo de trabajo diario

Aquí encontrarás toda la información que se considera necesaria para ser productivo en el dia a día
del proyecto, empezando por el algoritmo que todo miembro del equipo debe seguir:

1. Debes estar en la rama `develop`: `git switch develop`
1. Crea una rama a partir de `develop`: `git switch -c <name>`. Reemplaza `<name>` con el nombre de
   la rama.
1. Lleva a cabo tus cambios localmente.
1. Crea un commit.
1. Haz push de tu rama al repositorio remoto.
1. Crea una pull request desde tu rama hacia `develop`.
1. Si el sistema de integración continua falla al procesar tus cambios, revisa qué ocurrió y regresa
   al paso 3, de forma que los cambios locales que hagas arreglen los problemas causantes de la
   falla.
1. Espera a que alguien haga una code review de tu código e integre tus cambios a `develop`.
1. Regresa al paso 1.

## Ejecutar el backend/frontend

Puedes ejecutar los servidores de frontend y backend de la siguiente forma:

- Solo backend (Django): `task backend`
- Solo frontend (React): `task frontend`
- Backend y frontend: `task dev`

## Chequeos manuales

Es posible que a la hora de trabajar en el proyecto tengas la necesidad de probar algo concreto de
forma simple y rápida, por lo que a continuación se compilan algunas opciones:

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
