// La creación de este módulo (alta/edición/baja de barberos, UC-22/23/24) queda a
// criterio del dueño de EP-01 según PLAN_FASE2.md: puede vivir dentro de auth/ o en
// su propia carpeta modules/barberos/. Se asume acá la carpeta propia porque el
// cliente necesita listar barberos activos públicamente (paso "Barbero" del booking,
// sin login) igual que /api/servicios.
//
//   GET    /api/barberos            (público) -> lista de barberos activos
//   GET    /api/barberos/admin      (admin) -> lista completa, incluye inactivos
//   GET    /api/barberos/:id        (público)
//   GET    /api/barberos/:id/disponibilidad?fecha=YYYY-MM-DD -> horas libres/ocupadas
//   POST   /api/barberos            (admin)
//   PUT    /api/barberos/:id        (admin)
//   DELETE /api/barberos/:id        (admin)
import { api } from './client.js';

export const barberosApi = {
  listActive: () => api.get('/barberos', { auth: false }),
  listAll: () => api.get('/barberos/admin'),
  getById: (id) => api.get(`/barberos/${id}`, { auth: false }),
  getDisponibilidad: (id, fecha) =>
    api.get(`/barberos/${id}/disponibilidad?fecha=${fecha}`, { auth: false }),
  create: (data) => api.post('/barberos', data),
  update: (id, data) => api.put(`/barberos/${id}`, data),
  deactivate: (id) => api.delete(`/barberos/${id}`),
};
