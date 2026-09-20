import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import { citasApi } from '../../api/citas.api.js';
import { ApiClientError } from '../../api/client.js';
import { toISODate } from '../../utils/date.js';

const ESTADO_PILL = {
  confirmada: 'ok',
  atendida: 'ok',
  pendiente: 'wait',
  cancelada: 'cancel',
};

export default function AdminCitas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const hoy = toISODate(new Date());
      const res = await citasApi.listarPorRango({ desde: hoy, hasta: hoy });
      setCitas(res || []);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar las citas de hoy.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancelar(id) {
    if (!window.confirm('¿Cancelar esta cita?')) return;
    setBusyId(id);
    try {
      await citasApi.cancelar(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cancelar la cita.');
    } finally {
      setBusyId(null);
    }
  }

  const totalHoy = citas.length;
  const ingresosHoy = citas
    .filter((c) => c.estado !== 'cancelada')
    .reduce((sum, c) => sum + Number(c.precio || c.servicio?.precio || 0), 0);
  const barberosActivos = new Set(citas.map((c) => c.barbero_id)).size;

  return (
    <div>
      <div className="admin-top">
        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>
            Administración
          </p>
          <h2 style={{ fontSize: 24 }}>Citas de hoy</h2>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="num">{totalHoy}</div>
          <div className="lbl">Citas hoy</div>
        </div>
        <div className="kpi-card">
          <div className="num">Q{ingresosHoy.toFixed(0)}</div>
          <div className="lbl">Ingresos estimados hoy</div>
        </div>
        <div className="kpi-card">
          <div className="num">{barberosActivos}</div>
          <div className="lbl">Barberos con agenda</div>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Barbero</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id}>
                  <td>{c.hora_inicio?.slice(0, 5)}</td>
                  <td>{c.cliente_nombre || c.cliente?.nombre || 'Walk-in'}</td>
                  <td>{c.servicio_nombre || c.servicio?.nombre}</td>
                  <td>{c.barbero_nombre || c.barbero?.nombre}</td>
                  <td>
                    <span className={`status-pill ${ESTADO_PILL[c.estado] || 'wait'}`}>{c.estado}</span>
                  </td>
                  <td className="row-actions">
                    {['pendiente', 'confirmada'].includes(c.estado) && (
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        onClick={() => handleCancelar(c.id)}
                      >
                        {busyId === c.id ? 'Cancelando…' : 'Cancelar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {citas.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No hay citas registradas para hoy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
