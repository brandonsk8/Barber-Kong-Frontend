---
name: nueva-pantalla
description: Crear una pantalla nueva del frontend (admin, barbero o cliente) siguiendo el patrón de frontend/src/pages/admin/AdminServicios.jsx — llamada por api/client.js, estados de carga/error, Modal para crear/editar, validación en el cliente y ruta protegida por rol.
---

# Nueva pantalla del frontend

Plantilla obligatoria: `frontend/src/pages/admin/AdminServicios.jsx`. Leerla completa
antes de escribir una pantalla nueva desde cero.

## Estructura

```
frontend/src/api/<modulo>.api.js      Funciones que llaman a api.get/post/put/patch/delete
                                       de frontend/src/api/client.js. Nunca fetch/axios suelto.
frontend/src/pages/<area>/<Pantalla>.jsx
                                       <area> = admin | barbero | cliente | account | public
```

## Patrón del componente

1. Estados: `loading`, `error`, los datos de la lista/detalle; aparte, los del formulario
   (`modalOpen`, `editing`, `form`, `saving`, `formError`) — no mezclar el `error` de la
   lista con el de guardar.
2. `load()` que llama al `*.api.js`, maneja `try/catch` y usa `err instanceof
   ApiClientError ? err.message : '<mensaje propio en español>'`; se llama desde
   `useEffect(() => { load(); }, [...])`.
3. Crear/editar en un `Modal` (`frontend/src/components/Modal.jsx`), nunca navegando a
   otra pantalla para un formulario corto.
4. **Validación en el cliente espejo del `*.schema.js` del endpoint en el backend**:
   mismos campos requeridos, mismos formatos (número, fecha, `uuid`, longitud) — es
   feedback inmediato, no sustituye la validación real que ya hace el backend.
5. Acción destructiva o irreversible (desactivar, cancelar, borrar) → confirmación antes
   de llamar al endpoint (`Modal` de confirmación o `window.confirm` solo si no hay
   tiempo de construir uno — preferir `Modal`).
6. Mensajes al usuario con `Alert` (`frontend/src/components/Alert.jsx`), siempre en
   español. Acciones en curso con `Spinner` (`frontend/src/components/Spinner.jsx`).
7. Estilos: solo clases/variables ya definidas en `frontend/src/index.css`. Si falta un
   estilo, se agrega ahí, no inline en el componente.

## Ruta y protección por rol

Registrar la pantalla en `frontend/src/App.jsx` envuelta en
`<ProtectedRoute roles={['admin' | 'barbero' | 'cliente']}>` (o sin `roles` si cualquier
usuario autenticado puede verla, como `/cuenta`). El rol mostrado/ocultado en el cliente
es solo UX — la ruta del backend detrás ya debe tener su propio `requireRole`.

## Al terminar

1. `npm run lint` y `npm run build` sobre el repo.
2. Probar la pantalla a mano contra el backend local, con una cuenta demo del rol
   correspondiente (ver `resources/db/seed.sql` del backend) y con un rol sin permiso
   (debe quedar bloqueada por `ProtectedRoute` y por el backend).
3. Pasar la skill `revisar-frontend` sobre el diff.
4. Si el cambio toca varias pantallas o el layout, pasar también `revisar-ui`.
