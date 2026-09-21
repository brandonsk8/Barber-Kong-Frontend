// HU-22 (UC-18) — reescrita para hablar con el backend real de Miguel: un solo
// endpoint parametrizado por tipo/formato/rango que devuelve el archivo directamente
// (no hay una versión JSON para graficar en pantalla, así que esta pantalla es un
// selector de filtros + botón de descarga por cada tipo de reporte).
import { useState } from 'react';
import Alert from '../../components/Alert.jsx';
import { reportesApi } from '../../api/reportes.api.js';
import { ApiClientError } from '../../api/client.js';
import { toISODate } from '../../utils/date.js';

function primerDiaDelMes() {
  const d = new Date();
  d.setDate(1);
  return toISODate(d);
}

const REPORTES = [
  {
    tipo: 'citas',
    titulo: 'Citas por rango de fechas',
    descripcion: 'Atendidas, canceladas y reprogramadas en el período seleccionado.',
  },
  {
    tipo: 'ingresos',
    titulo: 'Ingresos por servicio y por barbero',
    descripcion: 'Ingresos estimados (citas atendidas) agrupados por servicio y por barbero.',
  },
  {
    tipo: 'insumos',
    titulo: 'Consumo de insumos',
    descripcion: 'Insumos descontados del inventario por período.',
  },
];

function ReporteCard({ tipo, titulo, descripcion }) {
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(toISODate(new Date()));
  const [formato, setFormato] = useState(null); // 'pdf' | 'excel' mientras descarga
  const [error, setError] = useState('');

  async function handleExportar(fmt) {
    setError('');
    setFormato(fmt);
    try {
      await reportesApi.descargar({ tipo, formato: fmt, desde, hasta });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo generar el reporte.');
    } finally {
      setFormato(null);
    }
  }

  return (
    <div className="report-card">
      <h3>{titulo}</h3>
      <p>{descripcion}</p>

      {error && <Alert type="error">{error}</Alert>}

      <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
        <div className="field" style={{ margin: 0 }}>
          <label style={{ fontSize: 12 }}>Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label style={{ fontSize: 12 }}>Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-outline"
          type="button"
          disabled={!!formato || desde > hasta}
          onClick={() => handleExportar('pdf')}
        >
          {formato === 'pdf' ? 'Generando…' : 'Exportar PDF'}
        </button>
        <button
          className="btn btn-outline"
          type="button"
          disabled={!!formato || desde > hasta}
          onClick={() => handleExportar('excel')}
        >
          {formato === 'excel' ? 'Generando…' : 'Exportar Excel'}
        </button>
      </div>
      {desde > hasta && (
        <p className="field-hint" style={{ color: 'var(--gold)' }}>
          La fecha "desde" no puede ser posterior a "hasta".
        </p>
      )}
    </div>
  );
}

export default function AdminReportes() {
  return (
    <div>
      <div className="admin-top">
        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>
            Administración
          </p>
          <h2 style={{ fontSize: 24 }}>Reportes</h2>
        </div>
      </div>

      <div className="report-grid">
        {REPORTES.map((r) => (
          <ReporteCard key={r.tipo} {...r} />
        ))}
      </div>
    </div>
  );
}
