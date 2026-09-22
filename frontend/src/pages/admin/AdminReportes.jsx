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
  { tipo: 'citas', titulo: 'Citas por rango de fechas', detalle: 'Atendidas, canceladas y reprogramadas en el período.' },
  { tipo: 'ingresos', titulo: 'Ingresos', detalle: 'Ingresos estimados por servicio y por barbero.' },
  { tipo: 'insumos', titulo: 'Consumo de insumos', detalle: 'Insumos descontados del inventario por período.' },
];

function descargarBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AdminReportes() {
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(toISODate(new Date()));
  const [pendiente, setPendiente] = useState(null); // `${tipo}-${formato}` en curso
  const [error, setError] = useState('');

  async function handleDescargar(tipo, formato) {
    setError('');
    setPendiente(`${tipo}-${formato}`);
    try {
      const { blob, filename } = await reportesApi.descargar({ tipo, formato, desde, hasta });
      descargarBlob(blob, filename);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo generar el reporte.');
    } finally {
      setPendiente(null);
    }
  }

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

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 20 }}>
        <div className="field">
          <label htmlFor="desde">Desde</label>
          <input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="hasta">Hasta</label>
          <input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="report-grid">
        {REPORTES.map((r) => (
          <div className="report-card" key={r.tipo}>
            <h3>{r.titulo}</h3>
            <p>{r.detalle}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-outline"
                type="button"
                disabled={pendiente === `${r.tipo}-pdf`}
                onClick={() => handleDescargar(r.tipo, 'pdf')}
              >
                {pendiente === `${r.tipo}-pdf` ? 'Generando…' : 'PDF'}
              </button>
              <button
                className="btn btn-outline"
                type="button"
                disabled={pendiente === `${r.tipo}-excel`}
                onClick={() => handleDescargar(r.tipo, 'excel')}
              >
                {pendiente === `${r.tipo}-excel` ? 'Generando…' : 'Excel'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
