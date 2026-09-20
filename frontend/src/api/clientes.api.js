// EP-03 — contrato confirmado 1:1 contra el backend real (src/modules/clientes).
//
//   GET    /api/clientes?search=       (admin) -> lista/filtro
//   GET    /api/clientes/:id           (admin) -> detalle
//   GET    /api/clientes/:id/historial (admin) -> citas del cliente (UC-10)
//   POST   /api/clientes               (admin) -> alta walk-in sin cuenta
//   PUT    /api/clientes/:id           (admin)
//   PUT    /api/clientes/:id/activar   (admin) -> reactivar
//   DELETE /api/clientes/:id           (admin) -> baja lógica
import { api } from './client.js';

export const clientesApi = {
  list: (search = '') => api.get(`/clientes${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getById: (id) => api.get(`/clientes/${id}`),
  historial: (id) => api.get(`/clientes/${id}/historial`),
  create: (data) => api.post('/clientes', data),
  update: (id, data) => api.put(`/clientes/${id}`, data),
  activate: (id) => api.put(`/clientes/${id}/activar`),
  deactivate: (id) => api.delete(`/clientes/${id}`),
};
