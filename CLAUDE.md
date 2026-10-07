# CLAUDE.md — barber-kong-frontend

Contexto y reglas de trabajo para asistentes de IA en este repositorio.

## Qué es este proyecto

SPA en React 19 + Vite del Sistema de Gestión para Barber Kong, una barbería en Xela
(Quetzaltenango, Guatemala). Proyecto de Seminario de Sistemas 1 (CUNOC). Consume la API
del repo hermano `brandonsk8/Barber-Kong` (backend). El código de la app vive en
[frontend/](./frontend) (no en la raíz del repo).

Routing con `react-router-dom`; roles (`admin`, `barbero`, `cliente`) protegidos por
`ProtectedRoute` (`frontend/src/components/ProtectedRoute.jsx`). Estado de sesión en
`AuthContext` (`frontend/src/context/AuthContext.jsx`) — no hay otro manejador de estado
global.

## Comandos (dentro de `frontend/`)

- `npm run dev` — desarrollo con recarga automática (`http://localhost:5173`)
- `npm run build` — build de producción con Vite
- `npm run lint` — `oxlint`
- `npm run preview` — sirve el build de producción localmente

No hay una suite de pruebas automatizada en este repo. Verificar los cambios corriendo
`npm run dev` contra el backend local y probando la pantalla a mano (login con la cuenta
demo del rol correspondiente) antes de dar por terminado un fix o una funcionalidad.

## REGLAS DURAS (no negociables)

1. **Toda llamada HTTP pasa por `frontend/src/api/client.js`** (`api.get/post/put/patch/
   delete/download`). Nunca `fetch`/`axios` sueltos en un componente o en un
   `*.api.js` — así el manejo de `BASE_URL`, el token JWT y los errores quedan en un
   solo lugar.
2. **El frontend oculta, el backend decide.** Ocultar un botón o una ruta según el rol
   es UX, no seguridad: la validación real del rol ya vive en el backend
   (`requireRole`). Nunca asumir que ocultar algo en el cliente es suficiente.
3. **Errores al usuario, siempre en español y con `Alert`**
   (`frontend/src/components/Alert.jsx`). Nunca un `alert()` nativo del navegador ni un
   mensaje en inglés sin traducir — usar `err.message` de `ApiClientError`
   (`client.js`) cuando venga del backend, o un mensaje propio si no.
4. **Estilos solo con las clases/variables de `frontend/src/index.css`.** Nada de estilos
   inline nuevos ni colores/tamaños sueltos — si falta algo, se agrega una clase o
   variable ahí, no se improvisa en el componente.
5. **Nada secreto en variables `VITE_*`.** Todo lo que empieza con `VITE_` queda
   embebido en el bundle y es público en el navegador (ver `VITE_API_URL` en
   `frontend/.env.example`) — nunca una clave o secreto real ahí.

## Patrón de una pantalla (admin)

Plantilla de referencia: `frontend/src/pages/admin/AdminServicios.jsx`. Toda pantalla
nueva de administración sigue esta forma:

- Función propia en `frontend/src/api/<modulo>.api.js` que llama a `client.js`.
- Estados `loading` / `error` / datos, cargados en un `load()` llamado desde
  `useEffect`.
- Crear/editar en un `Modal` (`frontend/src/components/Modal.jsx`) con su propio
  `form`, `saving` y `formError` (no reusar el `error` de la lista).
- Validación en el cliente espejo de lo que exige el `*.schema.js` del endpoint en el
  backend (mismos campos requeridos, mismos formatos) — no sustituye la validación del
  backend, es feedback inmediato.
- Acciones destructivas o irreversibles (desactivar, cancelar) con confirmación.
- Ruta protegida en `App.jsx` con `<ProtectedRoute roles={[...]}>`.

## Anti-patrones a evitar

- `fetch`/`axios` directo en un componente, sin pasar por `api/client.js`.
- Esconder una acción en el cliente como única protección (sin `requireRole` real en el
  backend detrás).
- `alert()`/`confirm()` nativos del navegador en vez de `Alert`/`Modal`.
- Estilos inline o clases nuevas que no están en `index.css`.
- Guardar tokens, claves de API o cualquier secreto en código, `localStorage` (fuera del
  JWT de sesión) o variables `VITE_*`.

## Herramientas de IA del proyecto (skills y MCP)

Configuración compartida en el repo (en la raíz, no dentro de `frontend/` — Claude Code
carga `.claude/` y `.mcp.json` del repo en el que se abre). Cada una existe por una
necesidad concreta del proyecto, no "por tenerla".

### Skills (`.claude/skills/`)

| Skill | Para qué | Por qué existe |
|---|---|---|
| `nueva-pantalla` | Pantalla nueva | Replica el patrón de capas de `AdminServicios.jsx` (api, estados, Modal, validación en ambos lados, ruta protegida) |
| `revisar-frontend` | Revisar diff/PR | Checklist de las reglas duras antes de commitear o aprobar un PR |
| `gitflow` | Ramas, commits, PR | GitFlow del equipo: commits atómicos, nada de push/PR sin autorización (copia idéntica de la del backend) |
| `revisar-ui` | Revisar pantallas | Responsive, mensajes de feedback y accesibilidad con Playwright (copia idéntica de la del backend) |

### Servidores MCP (`.mcp.json`)

| Servidor | Para qué | Límites |
|---|---|---|
| `playwright` | Navegar el frontend en móvil/tablet/escritorio, leer consola y red | Navegador aislado (`--isolated`), solo contra `localhost` |

**Sin MCP de base de datos a propósito**: este repo nunca toca la base de datos
directamente — todo pasa por la API del backend (`Barber-Kong`), que ya tiene su propio
MCP de solo lectura para inspeccionarla.

### Permisos (`.claude/settings.json`)

`npm run lint`/`npm run build` y git de lectura permitidos sin preguntar; `git push`,
`git reset --hard`, borrar ramas y crear/mergear PRs piden confirmación; leer
`frontend/.env*` (salvo `.env.example`) está bloqueado.
