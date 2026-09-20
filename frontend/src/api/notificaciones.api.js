// EP-07 — src/modules/notificaciones está en stub. Solo lista/marca como leídas las
// notificaciones del usuario autenticado (tabla `notificaciones` de schema.sql); el
// envío de correos ya vive en el backend (src/services/notification.service.js).
//
//   GET /api/notificaciones            -> mis notificaciones
//   PUT /api/notificaciones/:id/leida  -> marcar como leída
import { api } from './client.js';

export const notificacionesApi = {
  list: () => api.get('/notificaciones'),
  marcarLeida: (id) => api.put(`/notificaciones/${id}/leida`),
};
