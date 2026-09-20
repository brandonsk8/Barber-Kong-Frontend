// Módulo YA implementado en el backend (src/modules/servicios) — este es el único
// contrato confirmado 1:1 contra el código real, el resto de archivos *.api.js son
// el contrato "esperado" según PLAN_FASE2.md mientras Brandon/Miguel terminan sus épicas.
import { api } from './client.js';

export const serviciosApi = {
  listActive: () => api.get('/servicios', { auth: false }),
  getById: (id) => api.get(`/servicios/${id}`, { auth: false }),
  create: (data) => api.post('/servicios', data),
  update: (id, data) => api.put(`/servicios/${id}`, data),
  deactivate: (id) => api.delete(`/servicios/${id}`),
};
