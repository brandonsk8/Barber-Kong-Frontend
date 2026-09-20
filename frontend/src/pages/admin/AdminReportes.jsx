import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import { reportesApi } from '../../api/reportes.api.js';
import { ApiClientError } from '../../api/client.js';
import { toISODate } from '../../utils/date.js';

function primerDiaDelMes() {
  const d = new Date();
  d.setDate(1);
  return toISODate(d);
}

export default function AdminReportes() {
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await reportesApi.ingresosPorBarbero({
          desde: primerDiaDelMes(),
          hasta: toISODate(new Date()),
        });
        if (!cancelled) setIngresos(res || []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : 'No se pudo cargar el reporte de ingresos por barbero.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxIngreso = Math.max(1, ...ingresos.map((i) => Number(i.total || 0)));

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
        <div className="report-card">
          <h3>Citas por rango de fechas</h3>
          <p>Atendidas, canceladas y reprogramadas en el período seleccionado.</p>
          <button className="btn btn-outline" type="button" disabled>
            Exportar PDF / Excel
          </button>
        </div>
        <div className="report-card">
          <h3>Ingresos por barbero</h3>
          <p>Ingresos estimados según servicios completados por cada barbero.</p>
          <button className="btn btn-outline" type="button" disabled>
            Exportar PDF / Excel
          </button>
        </div>
        <div className="report-card">
          <h3>Consumo de insumos</h3>
          <p>Insumos descontados del inventario por período.</p>
          <button className="btn btn-outline" type="button" disabled>
            Exportar PDF / Excel
          </button>
        </div>
      </div>

      <p className="picker-title" style={{ fontSize: 16 }}>
        Ingresos por barbero — este mes
      </p>

      {loading && <Spinner />}
      {!loading && error && <Alert type="error">{error}</Alert>}
      {!loading && !error && (
        <div className="bar-chart">
          {ingresos.map((i) => (
            <div className="bar-row" key={i.barbero_id || i.barbero}>
              <span className="bar-label">{i.barbero_nombre || i.barbero}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(Number(i.total || 0) / maxIngreso) * 100}%` }}
                />
              </div>
              <span className="bar-value">Q{Number(i.total || 0).toFixed(0)}</span>
            </div>
          ))}
          {ingresos.length === 0 && (
            <p className="empty-state">Todavía no hay datos de ingresos este mes.</p>
          )}
        </div>
      )}
    </div>
  );
}
