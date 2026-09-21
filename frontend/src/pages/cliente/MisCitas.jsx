import { useEffect, useMemo, useState } from 'react';
import PublicNav from '../../components/PublicNav.jsx';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import Modal from '../../components/Modal.jsx';
import { citasApi } from '../../api/citas.api.js';
import { barberosApi } from '../../api/barberos.api.js';
import { ApiClientError } from '../../api/client.js';
import { formatFechaLarga, upcomingDays, defaultTimeSlots } from '../../utils/date.js';

const TAG_LABEL = {
  confirmada: 'Confirmada',
  pendiente: 'Pendiente',
  cancelada: 'Cancelada',
  atendida: 'Atendida',
};

function CitaRow({ cita, onCancelar, onReprogramar }) {
  return (
    <div className="cita-row">
      <div>
        <strong>{cita.servicio_nombre || cita.servicio?.nombre}</strong> con{' '}
        {cita.barbero_nombre || cita.barbero?.nombre}
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>
          {formatFechaLarga(cita.fecha)} · {cita.hora_inicio}
        </div>
      </div>
      <div className="actions">
        <span className={`tag ${cita.estado}`}>{TAG_LABEL[cita.estado] || cita.estado}</span>
        {['pendiente', 'confirmada'].includes(cita.estado) && (
          <>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => onReprogramar(cita)}>
              Reprogramar
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => onCancelar(cita.id)}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// HU-08 (UC-05) — reprogramar una cita ya agendada a un nuevo horario disponible.
// El backend ya exponía PUT /api/citas/:id, pero no tenía ningún control en pantalla
// que lo llamara. Reutiliza el mismo picker de día/hora que Booking.jsx (paso 3).
function ReprogramarModal({ cita, onClose, onSaved }) {
  const [fecha, setFecha] = useState(cita.fecha);
  const [hora, setHora] = useState('');
  const [ocupadas, setOcupadas] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dias = useMemo(() => upcomingDays(7), []);
  const horas = useMemo(() => defaultTimeSlots(), []);

  useEffect(() => {
    let cancelled = false;
    async function loadDisponibilidad() {
      try {
        const res = await barberosApi.getDisponibilidad(cita.barbero_id, fecha);
        if (!cancelled) setOcupadas(res?.ocupadas || []);
      } catch {
        if (!cancelled) setOcupadas([]);
      }
    }
    if (fecha) loadDisponibilidad();
    return () => {
      cancelled = true;
    };
  }, [cita.barbero_id, fecha]);

  async function handleConfirmar() {
    setError('');
    setSaving(true);
    try {
      await citasApi.reprogramar(cita.id, { fecha, hora_inicio: hora });
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo reprogramar la cita. Intentá de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Reprogramar: ${cita.servicio_nombre || cita.servicio?.nombre}`} onClose={onClose}>
      {error && <Alert type="error">{error}</Alert>}

      <p className="picker-title">Elegí nueva fecha</p>
      <div className="day-grid">
        {dias.map((d) => (
          <button
            key={d.iso}
            type="button"
            disabled={!d.open}
            className={`day-cell ${d.open ? 'selectable' : 'disabled'} ${fecha === d.iso ? 'selected' : ''}`}
            onClick={() => {
              setFecha(d.iso);
              setHora('');
            }}
          >
            <span className="dow">{d.dow}</span>
            {d.dayNumber}
          </button>
        ))}
      </div>

      <p className="picker-title">Elegí nueva hora</p>
      <div className="time-grid">
        {horas.map((h) => {
          const blocked = h.blocked || ocupadas.includes(h.value);
          return (
            <button
              key={h.value}
              type="button"
              disabled={!fecha || blocked}
              className={`time-slot ${blocked ? 'blocked' : 'free'} ${hora === h.value ? 'selected' : ''}`}
              onClick={() => setHora(h.value)}
            >
              {h.label.replace(' a.m.', '').replace(' p.m.', '')}
            </button>
          );
        })}
      </div>

      <div className="modal-actions">
        <button className="btn btn-ghost" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn-gold" type="button" disabled={!fecha || !hora || saving} onClick={handleConfirmar}>
          {saving ? 'Guardando…' : 'Confirmar nuevo horario'}
        </button>
      </div>
    </Modal>
  );
}

export default function MisCitas({ embedded = false, refreshToken }) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reprogramando, setReprogramando] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await citasApi.misCitas();
      setCitas(res || []);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'No se pudieron cargar tus citas.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  async function handleCancelar(id) {
    try {
      await citasApi.cancelar(id);
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo cancelar la cita.'
      );
    }
  }

  const content = (
    <div className="mis-citas">
      <p className="picker-title">Mis próximas citas</p>
      {loading && <Spinner />}
      {!loading && error && <Alert type="error">{error}</Alert>}
      {!loading && !error && citas.length === 0 && (
        <p className="empty-state">Todavía no tenés citas agendadas.</p>
      )}
      {!loading &&
        !error &&
        citas.map((c) => (
          <CitaRow cita={c} key={c.id} onCancelar={handleCancelar} onReprogramar={setReprogramando} />
        ))}

      {reprogramando && (
        <ReprogramarModal
          cita={reprogramando}
          onClose={() => setReprogramando(null)}
          onSaved={() => {
            setReprogramando(null);
            load();
          }}
        />
      )}
    </div>
  );

  if (embedded) return content;

  return (
    <div>
      <PublicNav />
      <div className="booking-wrap">{content}</div>
    </div>
  );
}
