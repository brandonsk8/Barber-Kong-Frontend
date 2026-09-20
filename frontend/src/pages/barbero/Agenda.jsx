import { useEffect, useMemo, useState } from 'react';
import PublicNav from '../../components/PublicNav.jsx';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { citasApi } from '../../api/citas.api.js';
import { ApiClientError } from '../../api/client.js';
import { toISODate, defaultTimeSlots } from '../../utils/date.js';

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

export default function Agenda() {
  const { user } = useAuth();
  const [fecha, setFecha] = useState(() => toISODate(new Date()));
  const hoy = useMemo(() => toISODate(new Date()), []);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const horas = useMemo(() => defaultTimeSlots(), []);
  const porHora = useMemo(() => {
    const map = {};
    citas.forEach((c) => {
      map[c.hora_inicio?.slice(0, 5)] = c;
    });
    return map;
  }, [citas]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      // El JWT trae user.barberoId (id de la fila `barberos`, no el de `users`) para
      // que este filtro siempre apunte al registro correcto.
      const res = await citasApi.agendaDelDia(user.barberoId || user.id, fecha);
      setCitas(res || []);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'No se pudo cargar la agenda de ese día.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

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
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 12px' }}>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => setFecha((f) => addDays(f, -1))}
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
            {new Date(`${fecha}T00:00:00`).toLocaleDateString('es-GT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            {fecha === hoy && ' (hoy)'}
          </p>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => setFecha((f) => addDays(f, 1))}
          >
            Siguiente →
          </button>
        </div>

        {loading && <Spinner />}
        {!loading && error && <Alert type="error">{error}</Alert>}

        {!loading && (
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
      </div>
    </div>
  );
}
