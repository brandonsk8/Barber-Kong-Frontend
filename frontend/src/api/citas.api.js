// EP-02 (dueño: Brandon) — src/modules/citas está en stub. Contrato asumido según
// PLAN_FASE2.md (agendar/reprogramar/cancelar, agenda del barbero, walk-in, marcar
// atendida) y la tabla `citas` de schema.sql (cliente_id nulo en walk-in, estado
// pendiente/confirmada/cancelada/atendida).
//
//   POST /api/citas                 { servicio_id, barbero_id, fecha, hora_inicio } -> cita
//   GET  /api/citas/mias            (cliente autenticado) -> sus próximas citas
//   PUT  /api/citas/:id             { fecha?, hora_inicio? } -> reprogramar
//   PUT  /api/citas/:id/cancelar    -> cancelar
//   PUT  /api/citas/:id/atender     -> marcar atendida (dispara descuento de inventario)
//   POST /api/citas/walkin          { barbero_id, servicio_id, fecha, hora_inicio, nombre_cliente? }
//   GET  /api/citas?barbero_id=&fecha=   (barbero/admin) -> agenda de un día
import { api } from './client.js';

export const citasApi = {
  create: (data) => api.post('/citas', data),
  misCitas: () => api.get('/citas/mias'),
  reprogramar: (id, data) => api.put(`/citas/${id}`, data),
  cancelar: (id) => api.put(`/citas/${id}/cancelar`),
  marcarAtendida: (id) => api.put(`/citas/${id}/atender`),
  crearWalkin: (data) => api.post('/citas/walkin', data),
  agendaDelDia: (barberoId, fecha) => api.get(`/citas?barbero_id=${barberoId}&fecha=${fecha}`),
  listarPorRango: (params) => api.get(`/citas?${new URLSearchParams(params).toString()}`),
};
