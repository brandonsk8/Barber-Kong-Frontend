import { useEffect, useMemo, useState } from 'react';
import PublicNav from '../../components/PublicNav.jsx';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../../components/Modal.jsx';
import { citasApi } from '../../api/citas.api.js';
import { serviciosApi } from '../../api/servicios.api.js';
import { ApiClientError } from '../../api/client.js';
import { toISODate, defaultTimeSlots, weekDaysFor } from '../../utils/date.js';

const ESTADO_PILL = {
  confirmada: 'ok',
  atendida: 'ok',
  pendiente: 'wait',
  cancelada: 'cancel',
};

function addDays(iso, delta) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

// BK-33 (HU-11) — versión reducida del walk-in para el propio barbero: el barbero
// ya es él mismo, solo elige servicio y hora dentro del día que está viendo.
function WalkinModal({ barberoId, fecha, onClose, onCreated }) {
  const [servicios, setServicios] = useState([]);
  const [loadingOpts, setLoadingOpts] = useState(true);
  const [servicioId, setServicioId] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const horas = defaultTimeSlots().filter((h) => !h.blocked);

  useEffect(() => {
    async function loadOpts() {
      setLoadingOpts(true);
      try {
        setServicios((await serviciosApi.listActive()) || []);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los servicios.');
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
        servicio_id: servicioId,
        barbero_id: barberoId,
        fecha,
        hora_inicio: horaInicio,
        ...(nombreCliente ? { nombre_cliente: nombreCliente } : {}),
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
            <select id="servicio_id" required value={servicioId} onChange={(e) => setServicioId(e.target.value)}>
              <option value="">Elegí un servicio…</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="hora_inicio">Hora</label>
            <select id="hora_inicio" required value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)}>
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
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
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

export default function Agenda() {
  const { user } = useAuth();
  const [vista, setVista] = useState('dia'); // BK-32 (HU-10): 'dia' | 'semana'
  const [fecha, setFecha] = useState(() => toISODate(new Date()));
  const hoy = useMemo(() => toISODate(new Date()), []);
  const [citas, setCitas] = useState([]);
  const [citasSemana, setCitasSemana] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [walkinOpen, setWalkinOpen] = useState(false);

  const horas = useMemo(() => defaultTimeSlots(), []);
  const porHora = useMemo(() => {
    const map = {};
    citas.forEach((c) => {
      map[c.hora_inicio?.slice(0, 5)] = c;
    });
    return map;
  }, [citas]);

  const semana = useMemo(() => weekDaysFor(fecha), [fecha]);
  // Mapa "iso|HH:MM" -> cita, para pintar la grilla semanal en un solo recorrido.
  const porDiaYHora = useMemo(() => {
    const map = {};
    citasSemana.forEach((c) => {
      map[`${c.fecha}|${c.hora_inicio?.slice(0, 5)}`] = c;
    });
    return map;
  }, [citasSemana]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const barberoId = user.barberoId || user.id;
      if (vista === 'semana') {
        const desde = semana[0].iso;
        const hasta = semana[semana.length - 1].iso;
        const res = await citasApi.listarPorRango({ barbero_id: barberoId, desde, hasta });
        setCitasSemana(res || []);
      } else {
        // El JWT trae user.barberoId (id de la fila `barberos`, no el de `users`) para
        // que este filtro siempre apunte al registro correcto.
        const res = await citasApi.agendaDelDia(barberoId, fecha);
        setCitas(res || []);
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'No se pudo cargar la agenda.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, vista]);

  async function handleAtender(id) {
    setBusyId(id);
    try {
      await citasApi.marcarAtendida(id);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo marcar la cita como atendida.'
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PublicNav />
      <div className="barbero-shell">
        <div className="barbero-head">
          <div>
            <p className="eyebrow">Barbero</p>
            <h2 style={{ fontSize: 26 }}>Hola, {user?.nombre?.split(' ')[0] || user?.email}</h2>
          </div>
          <div className="view-toggle" style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              className={`btn btn-sm ${vista === 'dia' ? 'btn-gold' : 'btn-outline'}`}
              onClick={() => setVista('dia')}
            >
              Diaria
            </button>
            <button
              type="button"
              className={`btn btn-sm ${vista === 'semana' ? 'btn-gold' : 'btn-outline'}`}
              onClick={() => setVista('semana')}
            >
              Semanal
            </button>
          </div>
          <button className="btn btn-gold btn-sm" type="button" onClick={() => setWalkinOpen(true)}>
            + Walk-in
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 12px' }}>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => setFecha((f) => addDays(f, vista === 'semana' ? -7 : -1))}
          >
            ← Anterior
          </button>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: 14,
              textTransform: 'capitalize',
              margin: 0,
              flex: 1,
              textAlign: 'center',
            }}
          >
            {vista === 'semana' ? (
              <>
                Semana del{' '}
                {semana[0].date.toLocaleDateString('es-GT', { day: 'numeric', month: 'long' })} al{' '}
                {semana[semana.length - 1].date.toLocaleDateString('es-GT', {
                  day: 'numeric',
                  month: 'long',
                })}
              </>
            ) : (
              <>
                {new Date(`${fecha}T00:00:00`).toLocaleDateString('es-GT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
                {fecha === hoy && ' (hoy)'}
              </>
            )}
          </p>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => setFecha((f) => addDays(f, vista === 'semana' ? 7 : 1))}
          >
            Siguiente →
          </button>
        </div>

        {loading && <Spinner />}
        {!loading && error && <Alert type="error">{error}</Alert>}

        {!loading && vista === 'dia' && (
          <div className="agenda-list">
            {horas.map((h) => {
              const cita = porHora[h.value];
              if (h.blocked) {
                return (
                  <div className="agenda-row lunch" key={h.value}>
                    <div className="hour">{h.value}</div>
                    <div className="client">Receso de almuerzo</div>
                    <span />
                  </div>
                );
              }
              if (!cita) {
                return (
                  <div className="agenda-row empty" key={h.value}>
                    <div className="hour">{h.value}</div>
                    <div className="client">Sin cita agendada</div>
                    <span />
                  </div>
                );
              }
              return (
                <div className="agenda-row" key={h.value}>
                  <div className="hour">{h.value}</div>
                  <div className="client">
                    {cita.cliente_nombre || cita.cliente?.nombre || 'Walk-in'}
                    <small>{cita.servicio_nombre || cita.servicio?.nombre}</small>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`status-pill ${ESTADO_PILL[cita.estado] || 'wait'}`}>
                      {cita.estado}
                    </span>
                    {cita.estado === 'confirmada' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        disabled={busyId === cita.id}
                        onClick={() => handleAtender(cita.id)}
                      >
                        {busyId === cita.id ? 'Guardando…' : 'Marcar atendida'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BK-32 (HU-10) — vista semanal: grilla hora x día, dom-jue (horario de
            atención); vie/sáb se muestran atenuados porque no se agendan citas ahí. */}
        {!loading && vista === 'semana' && (
          <div className="table-wrap">
            <table className="data-table agenda-week-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  {semana.map((d) => (
                    <th key={d.iso} style={{ opacity: d.open ? 1 : 0.4, textAlign: 'center' }}>
                      {d.dow} {d.dayNumber}
                      {d.iso === hoy && ' (hoy)'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horas.map((h) => (
                  <tr key={h.value} style={h.blocked ? { opacity: 0.5 } : undefined}>
                    <td>{h.value}</td>
                    {semana.map((d) => {
                      if (h.blocked) {
                        return (
                          <td key={d.iso} style={{ textAlign: 'center', fontSize: 12 }}>
                            —
                          </td>
                        );
                      }
                      const cita = porDiaYHora[`${d.iso}|${h.value}`];
                      if (!d.open) {
                        return (
                          <td key={d.iso} style={{ textAlign: 'center', opacity: 0.35, fontSize: 12 }}>
                            cerrado
                          </td>
                        );
                      }
                      if (!cita) {
                        return <td key={d.iso} />;
                      }
                      return (
                        <td key={d.iso}>
                          <div style={{ fontSize: 12 }}>
                            <strong>{cita.cliente_nombre || cita.cliente?.nombre || 'Walk-in'}</strong>
                            <br />
                            <span style={{ color: 'var(--muted)' }}>
                              {cita.servicio_nombre || cita.servicio?.nombre}
                            </span>
                            <br />
                            <span className={`status-pill ${ESTADO_PILL[cita.estado] || 'wait'}`}>
                              {cita.estado}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {walkinOpen && (
        <WalkinModal
          barberoId={user.barberoId || user.id}
          fecha={vista === 'semana' ? hoy : fecha}
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
