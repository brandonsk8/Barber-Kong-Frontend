// EP-06 (Sprint 3 / cierre de Fase 2) — src/modules/reportes está en stub. Contrato
// asumido según PLAN_FASE2.md (citas por rango, ingresos por barbero, consumo de
// insumos, exportación PDF/Excel).
//
//   GET /api/reportes/citas?desde=&hasta=              -> resumen + detalle
//   GET /api/reportes/ingresos-por-barbero?desde=&hasta=
//   GET /api/reportes/consumo-insumos?desde=&hasta=
//   GET /api/reportes/citas.pdf | .xlsx  (descarga)     -> igual para los otros dos
import { api } from './client.js';

const qs = (params) => new URLSearchParams(params).toString();

export const reportesApi = {
  citasPorRango: (params) => api.get(`/reportes/citas?${qs(params)}`),
  ingresosPorBarbero: (params) => api.get(`/reportes/ingresos-por-barbero?${qs(params)}`),
  consumoInsumos: (params) => api.get(`/reportes/consumo-insumos?${qs(params)}`),
};
