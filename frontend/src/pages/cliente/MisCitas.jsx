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

function ReprogramarModal({ cita, onClose, onDone }) {
  const dias = useMemo(() => upcomingDays(7), []);
  const horas = useMemo(() => defaultTimeSlots(), []);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [ocupadas, setOcupadas] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fecha) {
      setOcupadas([]);
      return;
    }
    let cancelled = false;
    barberosApi
      .getDisponibilidad(cita.barbero_id, fecha)
      .then((res) => {
        if (!cancelled) setOcupadas(res?.ocupadas || []);
      })
      .catch(() => {
        if (!cancelled) setOcupadas([]);
      });
    return () => {
      cancelled = true;
    };
  }, [cita.barbero_id, fecha]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await citasApi.reprogramar(cita.id, { fecha, hora_inicio: hora });
      onDone();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo reprogramar la cita.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Reprogramar cita" onClose={onClose}>
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
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
          <button className="btn btn-gold" type="submit" disabled={!fecha || !hora || saving}>
            {saving ? 'Guardando…' : 'Confirmar cambio'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function MisCitas({ embedded = false, refreshToken }) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reprogramarTarget, setReprogramarTarget] = useState(null);

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
          <CitaRow cita={c} key={c.id} onCancelar={handleCancelar} onReprogramar={setReprogramarTarget} />
        ))}
    </div>
  );

  return (
    <>
      {embedded ? (
        content
      ) : (
        <div>
          <PublicNav />
          <div className="booking-wrap">{content}</div>
        </div>
      )}
      {reprogramarTarget && (
        <ReprogramarModal
          cita={reprogramarTarget}
          onClose={() => setReprogramarTarget(null)}
          onDone={() => {
            setReprogramarTarget(null);
            load();
          }}
        />
      )}
    </>
  );
}
