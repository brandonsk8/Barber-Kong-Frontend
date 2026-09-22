// EP-03 (dueño: Miguel) — implementado. La tabla `clientes` de schema.sql.
//
//   GET    /api/clientes?search=&estado=  (admin) -> lista/filtro. estado=activos
//                                          (default) | inactivos | todos
//   GET    /api/clientes/:id              (admin) -> detalle
//   GET    /api/clientes/:id/historial    (admin) -> citas del cliente (UC-10)
//   POST   /api/clientes                  (admin) -> alta walk-in sin cuenta
//   PUT    /api/clientes/:id              (admin)
//   PUT    /api/clientes/:id/activar      (admin) -> reactivar (UC-11)
//   DELETE /api/clientes/:id              (admin) -> baja lógica
//
// BK-24 (HU-15): originalmente GET /api/clientes solo devolvía activos y no admitía
// ver los inactivos, así que "activar" no tenía forma de alcanzarse desde ninguna
// pantalla aunque el endpoint ya existiera. Se agregó ?estado= (análogo a
// GET /barberos/admin) para poder listar a quién reactivar.
import { api } from './client.js';

export const clientesApi = {
  list: (search = '', estado = '') => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (estado) params.set('estado', estado);
    const qs = params.toString();
    return api.get(`/clientes${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => api.get(`/clientes/${id}`),
  historial: (id) => api.get(`/clientes/${id}/historial`),
  create: (data) => api.post('/clientes', data),
  update: (id, data) => api.put(`/clientes/${id}`, data),
  activate: (id) => api.put(`/clientes/${id}/activar`),
  deactivate: (id) => api.delete(`/clientes/${id}`),
};
