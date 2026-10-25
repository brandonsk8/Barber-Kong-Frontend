import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNav from '../../components/PublicNav.jsx';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import { serviciosApi } from '../../api/servicios.api.js';
import { barberosApi } from '../../api/barberos.api.js';
import { citasApi } from '../../api/citas.api.js';
import { ApiClientError } from '../../api/client.js';
import { upcomingDays, slotsDeBloques, formatFechaLarga } from '../../utils/date.js';
import MisCitas from './MisCitas.jsx';

const STEPS = ['Servicio', 'Barbero', 'Fecha y hora', 'Confirmar'];

export default function Booking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  const [servicioId, setServicioId] = useState('');
  const [barberoId, setBarberoId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  // Disponibilidad real del barbero elegido para cada uno de los días mostrados:
  // { 'AAAA-MM-DD': { ocupadas, trabaja, bloques, ausente } } (según su horario y ausencias).
  const [dispDias, setDispDias] = useState({});
  const [loadingDias, setLoadingDias] = useState(false);
  const [dispError, setDispError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [citasRefreshToken, setCitasRefreshToken] = useState(0);

  const dias = useMemo(() => upcomingDays(7), []);
  const servicio = servicios.find((s) => s.id === servicioId);
  const barbero = barberos.find((b) => b.id === barberoId);
  // Horas ofrecibles del día elegido: salen de los bloques de atención del barbero y de la
  // duración del servicio (una hora solo se ofrece si el servicio termina dentro del bloque).
  const infoDia = fecha ? dispDias[fecha] : null;
  const horas = infoDia
    ? slotsDeBloques(infoDia.bloques, servicio?.duracion_minutos || 60, infoDia.ocupadas)
    : [];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingCatalog(true);
      try {
        const [s, b] = await Promise.all([serviciosApi.listActive(), barberosApi.listActive()]);
        if (!cancelled) {
          setServicios(s || []);
          setBarberos(b || []);
        }
      } catch (err) {
        if (!cancelled) {
          setCatalogError(
            err instanceof ApiClientError
              ? err.message
              : 'No se pudo cargar el catálogo de servicios y barberos.'
          );
        }
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Al elegir barbero consultamos su disponibilidad de los días mostrados (horario semanal
  // + ausencias + citas ya agendadas). Si falla, no se ofrece ningún día: es preferible a
  // dejar elegir una hora que el backend después va a rechazar.
  useEffect(() => {
    if (!barberoId) return undefined;
    let cancelled = false;
    async function loadDias() {
      setLoadingDias(true);
      setDispError('');
      try {
        const res = await Promise.all(dias.map((d) => barberosApi.getDisponibilidad(barberoId, d.iso)));
        if (!cancelled) setDispDias(Object.fromEntries(dias.map((d, i) => [d.iso, res[i]])));
      } catch (err) {
        if (!cancelled) {
          setDispDias({});
          setDispError(
            err instanceof ApiClientError ? err.message : 'No se pudo consultar la disponibilidad del barbero.'
          );
        }
      } finally {
        if (!cancelled) setLoadingDias(false);
      }
    }
    loadDias();
    return () => {
      cancelled = true;
    };
  }, [barberoId, dias]);

  function goTo(next) {
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
  }

  async function handleConfirmar() {
    setSubmitError('');
    setSubmitting(true);
    try {
      await citasApi.create({
        servicio_id: servicioId,
        barbero_id: barberoId,
        fecha,
        hora_inicio: hora,
      });
      setConfirmed(true);
      setCitasRefreshToken((n) => n + 1);
    } catch (err) {
      setSubmitError(
        err instanceof ApiClientError
          ? err.message
          : 'No se pudo agendar la cita. Intentá de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingCatalog) {
    return (
      <div>
        <PublicNav />
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PublicNav />
      <div className="booking-wrap">
        {catalogError && <Alert type="error">{catalogError}</Alert>}

        <div className="stepper">
          {STEPS.map((label, i) => (
            <div className={`step ${i < step ? 'done' : ''} ${i === step ? 'current' : ''}`} key={label}>
              <div className="step-dot">{i < step ? '✓' : i + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {confirmed ? (
          <Alert type="success">
            ¡Listo! Tu cita quedó confirmada. La vas a ver en "Mis próximas citas" y
            también en la agenda del barbero.
          </Alert>
        ) : (
          <>
            {step === 0 && (
              <>
                <p className="picker-title">Elegí un servicio</p>
                <div className="option-grid">
                  {servicios.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`option-card ${servicioId === s.id ? 'selected' : ''}`}
                      onClick={() => setServicioId(s.id)}
                    >
                      <h4>{s.nombre}</h4>
                      <div className="meta">{s.duracion_minutos} min</div>
                      <div className="price">Q{Number(s.precio).toFixed(0)}</div>
                    </button>
                  ))}
                  {servicios.length === 0 && (
                    <p className="empty-state">No hay servicios disponibles todavía.</p>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-gold"
                    type="button"
                    disabled={!servicioId}
                    onClick={() => goTo(1)}
                  >
                    Continuar
                  </button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <p className="picker-title">Elegí un barbero</p>
                <div className="option-grid">
                  {barberos.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`option-card ${barberoId === b.id ? 'selected' : ''}`}
                      onClick={() => {
                        setBarberoId(b.id);
                        setFecha('');
                        setHora('');
                      }}
                    >
                      <h4>{b.nombre}</h4>
                      <div className="meta">{b.especialidad || 'Barbero'}</div>
                    </button>
                  ))}
                  {barberos.length === 0 && (
                    <p className="empty-state">No hay barberos disponibles todavía.</p>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button className="btn btn-outline" type="button" onClick={() => goTo(0)}>
                    Atrás
                  </button>
                  <button
                    className="btn btn-gold"
                    type="button"
                    disabled={!barberoId}
                    onClick={() => goTo(2)}
                  >
                    Continuar
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="summary-card">
                  <div>
                    <div className="line">
                      Servicio: <strong>{servicio?.nombre}</strong>
                    </div>
                    <div className="line">
                      Barbero: <strong>{barbero?.nombre}</strong>
                    </div>
                  </div>
                  <div className="line" style={{ margin: 0 }}>
                    Duración: <strong>{servicio?.duracion_minutos} min</strong>
                  </div>
                </div>

                {dispError && <Alert type="error">{dispError}</Alert>}

                <p className="picker-title">Elegí fecha</p>
                {loadingDias ? (
                  <Spinner />
                ) : (
                  <>
                    <div className="day-grid">
                      {dias.map((d) => {
                        const info = dispDias[d.iso];
                        const disponible = Boolean(info?.trabaja);
                        return (
                          <button
                            key={d.iso}
                            type="button"
                            disabled={!disponible}
                            title={
                              disponible
                                ? undefined
                                : info?.ausente
                                  ? 'El barbero no estará disponible ese día'
                                  : 'El barbero no atiende ese día'
                            }
                            className={`day-cell ${disponible ? 'selectable' : 'disabled'} ${
                              fecha === d.iso ? 'selected' : ''
                            }`}
                            onClick={() => {
                              setFecha(d.iso);
                              setHora('');
                            }}
                          >
                            <span className="dow">{d.dow}</span>
                            {d.dayNumber}
                          </button>
                        );
                      })}
                    </div>
                    {!dispError && dias.some((d) => !dispDias[d.iso]?.trabaja) && (
                      <p className="field-hint">
                        Los días atenuados son días en que {barbero?.nombre} no atiende o no estará disponible.
                      </p>
                    )}
                  </>
                )}

                <p className="picker-title">Elegí hora</p>
                {!fecha && <p className="field-hint">Elegí primero una fecha.</p>}
                {fecha && horas.length === 0 && (
                  <p className="empty-state">No hay horas disponibles ese día.</p>
                )}
                {horas.length > 0 && (
                  <div className="time-grid">
                    {horas.map((h) => (
                      <button
                        key={h.value}
                        type="button"
                        disabled={h.blocked}
                        className={`time-slot ${h.blocked ? 'blocked' : 'free'} ${
                          hora === h.value ? 'selected' : ''
                        }`}
                        onClick={() => setHora(h.value)}
                      >
                        {h.label.replace(' a.m.', '').replace(' p.m.', '')}
                      </button>
                    ))}
                  </div>
                )}
                <div className="hint-row">
                  <span>
                    <span className="hint-dot" style={{ background: 'var(--gold)' }} />
                    Seleccionado
                  </span>
                  <span>
                    <span className="hint-dot" style={{ background: 'var(--muted)', opacity: 0.4 }} />
                    Almuerzo / no disponible
                  </span>
                  <span>
                    <span className="hint-dot" style={{ background: 'var(--cream)' }} />
                    Disponible
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button className="btn btn-outline" type="button" onClick={() => goTo(1)}>
                    Atrás
                  </button>
                  <button
                    className="btn btn-gold"
                    type="button"
                    disabled={!fecha || !hora}
                    onClick={() => goTo(3)}
                  >
                    Continuar a confirmación
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                {submitError && <Alert type="error">{submitError}</Alert>}
                <div className="summary-card" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div className="line">
                    Servicio: <strong>{servicio?.nombre}</strong> (Q{Number(servicio?.precio).toFixed(0)})
                  </div>
                  <div className="line">
                    Barbero: <strong>{barbero?.nombre}</strong>
                  </div>
                  <div className="line">
                    Fecha: <strong>{formatFechaLarga(fecha)}</strong>
                  </div>
                  <div className="line">
                    Hora: <strong>{hora}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button className="btn btn-outline" type="button" onClick={() => goTo(2)}>
                    Atrás
                  </button>
                  <button
                    className="btn btn-gold"
                    type="button"
                    disabled={submitting}
                    onClick={handleConfirmar}
                  >
                    {submitting ? 'Agendando…' : 'Confirmar cita'}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <MisCitas embedded refreshToken={citasRefreshToken} onBookAnother={() => navigate(0)} />
      </div>
    </div>
  );
}
