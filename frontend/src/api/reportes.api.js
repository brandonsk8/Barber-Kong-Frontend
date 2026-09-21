// EP-06 (Sprint 3 / cierre de Fase 2) — implementado por Miguel en el backend real.
// A diferencia del contrato que se había asumido antes (una ruta JSON por tipo de
// reporte), es un único endpoint parametrizado que devuelve directamente el archivo
// (PDF o Excel) para descargar, no datos para graficar en pantalla.
//
//   GET /api/reportes?tipo=citas|ingresos|insumos&formato=pdf|excel&desde=&hasta=
//   -> descarga el archivo generado (admin)
import { api } from './client.js';

export const reportesApi = {
  descargar: ({ tipo, formato, desde, hasta }) =>
    api.download(`/reportes?${new URLSearchParams({ tipo, formato, desde, hasta }).toString()}`),
};
