# Barber Kong — Frontend

Frontend de Fase 2, construido desde cero con React + Vite + React Router, siguiendo
el diseño de los mockups de Fase 1 (`mockups_barberia.html`) y el backend en
[Barber-Kong](https://github.com/brandonsk8/Barber-Kong).

## Levantar el entorno local

```bash
cp .env.example .env
npm install
npm run dev
```

Por defecto apunta a `http://localhost:3000/api` (backend corriendo localmente). Cambiá
`VITE_API_URL` en `.env` si tu backend corre en otro puerto o URL.

## Estructura

```
src/
  api/            Un archivo por módulo del backend (auth, citas, clientes, servicios,
                   inventario, reportes, notificaciones, barberos) + client.js con el
                   fetch central (base URL, token JWT, manejo de errores).
  context/        AuthContext — sesión, login/registro/2FA, persistida en localStorage.
  components/     PublicNav, ProtectedRoute, Modal, Alert, Spinner — piezas reusables.
  pages/
    public/        Landing (marketing) y NotFound.
    auth/          Login, Registro, Verificar 2FA, Recuperar/Restablecer contraseña.
    cliente/       Booking (wizard de 4 pasos) y Mis Citas.
    barbero/       Agenda del día.
    admin/         AdminLayout (sidebar) + Citas/Clientes/Servicios/Inventario/Reportes.
  utils/date.js   Helpers de fechas y horarios (horario dom-jue, receso 13:00-14:00).
  index.css        Todo el sistema visual (paleta dorado/marrón, tipografías Playfair
                   Display + Work Sans), adaptado 1:1 de los mockups de Fase 1.
```

## Estado del contrato de API (importante para Sprint 1-2)

Al momento de construir este frontend, del backend **solo el módulo `servicios` está
implementado** (`src/api/servicios.api.js` es 1:1 contra el código real). El resto de
módulos (`auth`, `citas`, `clientes`, `inventario`, `reportes`, `notificaciones`,
`barberos`) todavía responden 404 "pendiente de implementar" — son stubs en el backend
según `PLAN_FASE2.md`.

Para no bloquear el desarrollo del frontend, cada archivo `src/api/<módulo>.api.js`
documenta en un comentario el contrato **asumido** (rutas, verbos, forma del payload)
en base a:

- Lo descrito en `PLAN_FASE2.md` para cada épica.
- Las tablas y columnas de `resources/db/schema.sql` del backend.
- El patrón ya usado por `servicios` (rutas REST bajo `/api/<carpeta>`).

Cuando Brandon (EP-01 Auth, EP-02 Citas) y Miguel (EP-03 Clientes, EP-05 Inventario)
implementen sus módulos, **ese es el único lugar que hay que ajustar** — ninguna
pantalla llama a `fetch` directamente, todas pasan por `src/api/*.api.js`. Si una ruta
real termina siendo distinta a la asumida, solo hay que cambiar la URL en el archivo
correspondiente.

Puntos a confirmar con el dueño de cada épica al implementar:

- **Auth**: forma exacta de la respuesta de `/login` cuando el usuario tiene 2FA activo
  (`requiresTwoFactor` + `userId`, o el nombre que prefieran), y si existe `/auth/me`
  para restaurar sesión al recargar la página.
- **Barberos**: en qué módulo vive (`auth` o uno propio `barberos`) y si expone
  `/barberos/:id/disponibilidad?fecha=` para el picker de horarios del cliente.
- **Citas**: el shape exacto de la agenda del barbero (¿trae `cliente_nombre` y
  `servicio_nombre` planos, o hay que pedirlos aparte?).

Mientras tanto, todas las pantallas manejan el error 404 de los stubs mostrando el
mensaje que ya devuelve el backend (`"Citas: pendiente de implementar (EP-02)."`), así
que la app no se rompe — solo informa que esa parte todavía no está lista.

## Roles y rutas protegidas

`ProtectedRoute` filtra por rol (`cliente`, `barbero`, `admin`) usando el `user.role`
que devuelva el login. Rutas:

- `/agendar`, `/mis-citas` — solo `cliente`.
- `/barbero/agenda` — solo `barbero`.
- `/admin/*` — solo `admin`.

## Pendiente de Fase 2 (según checklist de `PLAN_FASE2.md`)

- Conectar cada pantalla al endpoint real en cuanto cada épica lo publique (ver sección
  anterior).
- Reemplazar el picker de horarios "genérico" (`utils/date.js#defaultTimeSlots`) por la
  disponibilidad real que devuelva el backend.
- Capturas de pantalla reales para el manual de usuario, reemplazando los mockups.
