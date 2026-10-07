---
name: revisar-frontend
description: Revisar el diff actual (o una rama/PR) del frontend contra las reglas duras del proyecto antes de commitear o aprobar un Pull Request — HTTP solo vía client.js, roles, estados de carga/error, validación cliente/servidor, hooks, estilos y accesibilidad.
---

# Revisión del frontend contra las reglas del proyecto

Obtener el diff: `git diff develop...HEAD` (o `git diff` si no hay commits aún). Revisar
**solo lo que cambió**, archivo por archivo, y reportar cada hallazgo como
`archivo:línea — regla — problema — corrección sugerida`.

## Checklist (de CLAUDE.md)

1. **HTTP centralizado**: ninguna llamada `fetch`/`axios` fuera de
   `frontend/src/api/client.js`; todo `*.api.js` nuevo usa `api.get/post/put/patch/
   delete/download` de ahí.
2. **El frontend oculta, el backend decide**: si una acción se esconde según el rol en el
   cliente, verificar que el endpoint real detrás también tenga `requireRole` (revisar el
   PR del backend si aplica) — nunca asumir que ocultar un botón alcanza como seguridad.
3. **Secretos**: nada de credenciales, tokens o `.env*` en el diff; ninguna variable
   `VITE_*` nueva con un valor que no debería ser público (todo `VITE_*` queda expuesto en
   el navegador).
4. **Errores y feedback**: mensajes al usuario en español, con `Alert`
   (`err.message` de `ApiClientError` cuando viene del backend); nada de `alert()`/
   `confirm()` nativos; acciones en curso con `Spinner`; acciones destructivas con
   confirmación (`Modal`).
5. **Estados**: pantallas con datos async tienen `loading`/`error` propios y los separan
   de los del formulario (`saving`/`formError`); `useEffect` con dependencias correctas
   (sin loops de refetch, sin warnings de hooks).
6. **Validación en ambos lados**: el formulario valida en el cliente los mismos campos y
   formatos que exige el `*.schema.js` del endpoint en el backend — y aun así se espera
   el error real del backend si el cliente deja pasar algo.
7. **Rutas y roles**: pantalla nueva registrada en `App.jsx` con `ProtectedRoute` y el
   `roles` correcto para quién debe verla.
8. **Estilos**: solo clases/variables de `frontend/src/index.css`; sin estilos inline
   nuevos ni valores de color/espaciado sueltos; coherencia con el resto de pantallas del
   mismo rol.
9. **Accesibilidad básica**: inputs con `label` o `placeholder`, contraste legible, texto
   ≥ 14px, foco visible.
10. **Calidad**: `npm run lint` y `npm run build` pasan sin errores sobre el diff.

Al final: resumen de 1–3 líneas con veredicto (listo / cambios necesarios). No aplicar
correcciones sin que el integrante lo pida. Si el cambio toca varias pantallas o el
layout general, recomendar también pasar la skill `revisar-ui`.
