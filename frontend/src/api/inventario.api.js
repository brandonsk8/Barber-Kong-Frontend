// EP-05 (dueño: Miguel) — src/modules/inventario está en stub. Contrato asumido según
// PLAN_FASE2.md (registrar insumo, reabastecer -> insumo_movimientos tipo 'entrada') y
// las tablas `insumos`/`insumo_movimientos` de schema.sql. El descuento automático al
// atender una cita (UC-16) lo dispara el backend solo, no hay endpoint de frontend
// para eso.
//
//   GET  /api/inventario              (admin) -> catálogo de insumos con stock actual
//   POST /api/inventario              (admin) -> nuevo insumo
//   PUT  /api/inventario/:id          (admin) -> editar insumo (nombre, mínimo, etc.)
//   POST /api/inventario/:id/entrada  (admin) { cantidad } -> reabastecimiento
import { api } from './client.js';

export const inventarioApi = {
  list: () => api.get('/inventario'),
  create: (data) => api.post('/inventario', data),
  update: (id, data) => api.put(`/inventario/${id}`, data),
  registrarEntrada: (id, cantidad) => api.post(`/inventario/${id}/entrada`, { cantidad }),
};
