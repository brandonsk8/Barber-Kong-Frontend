import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import Modal from '../../components/Modal.jsx';
import { citasApi } from '../../api/citas.api.js';
import { serviciosApi } from '../../api/servicios.api.js';
import { barberosApi } from '../../api/barberos.api.js';
import { ApiClientError } from '../../api/client.js';
import { toISODate, defaultTimeSlots } from '../../utils/date.js';

const ESTADO_PILL = {
  confirmada: 'ok',
  atendida: 'ok',
  pendiente: 'wait',
  cancelada: 'cancel',
};

// BK-33 (HU-11) — registrar atención inmediata de un cliente sin cita previa. El
// backend ya expone POST /api/citas/walkin; esta es la única pantalla que lo consume.
const WALKIN_EMPTY = { servicio_id: '', barbero_id: '', hora_inicio: '', nombre_cliente: '' };

function WalkinModal({ onClose, onCreated }) {
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [loadingOpts, setLoadingOpts] = useState(true);
  const [form, setForm] = useState(WALKIN_EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const horas = defaultTimeSlots().filter((h) => !h.blocked);

  useEffect(() => {
    async function loadOpts() {
      setLoadingOpts(true);
      try {
        const [s, b] = await Promise.all([serviciosApi.listActive(), barberosApi.listActive()]);
        setServicios(s || []);
        setBarberos(b || []);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar servicios/barberos.');
      } finally {
        setLoadingOpts(false);
      }
    }
    loadOpts();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await citasApi.crearWalkin({
        servicio_id: form.servicio_id,
        barbero_id: form.barbero_id,
        fecha: toISODate(new Date()),
        hora_inicio: form.hora_inicio,
        ...(form.nombre_cliente ? { nombre_cliente: form.nombre_cliente } : {}),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo registrar el walk-in.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Registrar walk-in" onClose={onClose}>
      {error && <Alert type="error">{error}</Alert>}
      {loadingOpts ? (
        <Spinner />
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="servicio_id">Servicio</label>
            <select
              id="servicio_id"
              required
              value={form.servicio_id}
              onChange={(e) => setForm({ ...form, servicio_id: e.target.value })}
            >
              <option value="">Elegí un servicio…</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} (Q{Number(s.precio).toFixed(0)})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="barbero_id">Barbero</label>
            <select
              id="barbero_id"
              required
              value={form.barbero_id}
              onChange={(e) => setForm({ ...form, barbero_id: e.target.value })}
            >
              <option value="">Elegí un barbero…</option>
              {barberos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="hora_inicio">Hora</label>
            <select
              id="hora_inicio"
              required
              value={form.hora_inicio}
              onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
            >
              <option value="">Elegí una hora…</option>
              {horas.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="nombre_cliente">Nombre del cliente (opcional)</label>
            <input
              id="nombre_cliente"
              placeholder='Si no lo indicás, queda como "Walk-in"'
              value={form.nombre_cliente}
              onChange={(e) => setForm({ ...form, nombre_cliente: e.target.value })}
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-gold" type="submit" disabled={saving}>
              {saving ? 'Registrando…' : 'Registrar'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function AdminCitas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [walkinOpen, setWalkinOpen] = useState(false);

  async function load() {
    setLoading(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // HU-09 (UC-06) — el administrador también puede cancelar una cita activa, no solo
  // el cliente dueño de la cita (eso ya lo cubre MisCitas.jsx).
  async function handleCancelar(id) {
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
        <button className="btn btn-gold" type="button" onClick={() => setWalkinOpen(true)}>
          + Walk-in
        </button>
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
                      <button type="button" disabled={busyId === c.id} onClick={() => handleCancelar(c.id)}>
                        {busyId === c.id ? 'Guardando…' : 'Cancelar'}
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

      {walkinOpen && (
        <WalkinModal
          onClose={() => setWalkinOpen(false)}
          onCreated={() => {
            setWalkinOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
