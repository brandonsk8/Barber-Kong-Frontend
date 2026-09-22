// EP-06 — contrato confirmado 1:1 contra el backend real (src/modules/reportes). Un
// único caso de uso (UC-18): tipo de reporte y formato de exportación son parámetros
// de la misma ruta, no rutas separadas. La respuesta siempre es el archivo binario
// (PDF o Excel), nunca JSON — no hay una vista de datos aparte de la exportación.
//
//   GET /api/reportes?tipo=citas|ingresos|insumos&formato=pdf|excel&desde=&hasta=
import { api } from './client.js';

export const reportesApi = {
  descargar: ({ tipo, formato, desde, hasta }) =>
    api.download(`/reportes?${new URLSearchParams({ tipo, formato, desde, hasta })}`),
};
