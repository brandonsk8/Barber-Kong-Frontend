// La creación de este módulo (alta/edición/baja de barberos, UC-22/23/24) queda a
// criterio del dueño de EP-01 según PLAN_FASE2.md: puede vivir dentro de auth/ o en
// su propia carpeta modules/barberos/. Se asume acá la carpeta propia porque el
// cliente necesita listar barberos activos públicamente (paso "Barbero" del booking,
// sin login) igual que /api/servicios.
//
//   GET    /api/barberos            (público) -> lista de barberos activos
//   GET    /api/barberos/admin      (admin) -> lista completa, incluye inactivos
//   GET    /api/barberos/:id        (público) -> barbero + su horario semanal (`horario`)
//   GET    /api/barberos/:id/horario (público)
//   GET    /api/barberos/:id/disponibilidad?fecha=YYYY-MM-DD
//                                   -> { ocupadas, trabaja, bloques, ausente }
//   POST   /api/barberos            (admin) acepta `horario` opcional
//   PUT    /api/barberos/:id        (admin) `horario`, si viene, reemplaza el semanal
//   DELETE /api/barberos/:id        (admin)
//   GET/POST /api/barberos/:id/ausencias, DELETE /:id/ausencias/:ausenciaId
//                                   (admin o el propio barbero) días en que no atiende
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
  listAusencias: (id) => api.get(`/barberos/${id}/ausencias`),
  crearAusencia: (id, data) => api.post(`/barberos/${id}/ausencias`, data),
  quitarAusencia: (id, ausenciaId) => api.delete(`/barberos/${id}/ausencias/${ausenciaId}`),
};
