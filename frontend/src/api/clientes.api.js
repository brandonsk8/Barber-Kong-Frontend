// EP-03 (dueño: Miguel) — src/modules/clientes está en stub. Contrato asumido según
// PLAN_FASE2.md (registrar walk-in/sin cuenta, buscar/filtrar, historial, editar/
// desactivar) y la tabla `clientes` de schema.sql.
//
//   GET    /api/clientes?search=       (admin) -> lista/filtro
//   GET    /api/clientes/:id           (admin) -> detalle + historial de citas
//   POST   /api/clientes               (admin) -> alta walk-in sin cuenta
//   PUT    /api/clientes/:id           (admin)
//   DELETE /api/clientes/:id           (admin) -> baja lógica
import { api } from './client.js';

export const clientesApi = {
  list: (search = '') => api.get(`/clientes${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getById: (id) => api.get(`/clientes/${id}`),
  create: (data) => api.post('/clientes', data),
  update: (id, data) => api.put(`/clientes/${id}`, data),
  deactivate: (id) => api.delete(`/clientes/${id}`),
};
