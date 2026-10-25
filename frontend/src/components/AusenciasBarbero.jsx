import { useEffect, useState } from 'react';
import Spinner from './Spinner.jsx';
import Alert from './Alert.jsx';
import { barberosApi } from '../api/barberos.api.js';
import { ApiClientError } from '../api/client.js';
import { formatFechaLarga, hoyLocalISO } from '../utils/date.js';

// Días completos en que un barbero no estará disponible. Los usa el propio barbero (su
// Agenda) y el administrador (Barberos > Ausencias); el backend verifica que sea SU agenda.
// Mientras un día esté marcado, no se le pueden agendar citas.
export default function AusenciasBarbero({ barberoId }) {
  const [ausencias, setAusencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [fecha, setFecha] = useState('');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const hoy = hoyLocalISO();

  async function load() {
    setLoading(true);
    try {
      setAusencias((await barberosApi.listAusencias(barberoId)) || []);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los días sin disponibilidad.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberoId]);

  async function handleAgregar(e) {
    e.preventDefault();
    setError('');
    setExito('');
    if (!fecha) return setError('Elige el día en que no estarás disponible.');
    if (fecha < hoy) return setError('No puedes marcar un día que ya pasó.');

    setSaving(true);
    try {
      await barberosApi.crearAusencia(barberoId, { fecha, ...(motivo.trim() && { motivo: motivo.trim() }) });
      setExito(`Listo: el ${formatFechaLarga(fecha)} quedó marcado como no disponible.`);
      setFecha('');
      setMotivo('');
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo marcar el día.');
    } finally {
      setSaving(false);
    }
  }

  async function handleQuitar(ausencia) {
    setError('');
    setExito('');
    setBusyId(ausencia.id);
    try {
      await barberosApi.quitarAusencia(barberoId, ausencia.id);
      setConfirmId(null);
      setExito('Listo: ese día vuelve a estar disponible para agendar.');
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo quitar el día.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="ausencias">
      {error && <Alert type="error">{error}</Alert>}
      {exito && <Alert type="success">{exito}</Alert>}

      <form className="ausencias-form" onSubmit={handleAgregar}>
        <div className="field">
          <label htmlFor={`aus-fecha-${barberoId}`}>Día</label>
          <input
            id={`aus-fecha-${barberoId}`}
            type="date"
            min={hoy}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`aus-motivo-${barberoId}`}>Motivo (opcional)</label>
          <input
            id={`aus-motivo-${barberoId}`}
            maxLength={255}
            placeholder="Trámite, vacaciones…"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>
        <button className="btn btn-gold" type="submit" disabled={saving}>
          {saving ? 'Guardando…' : 'Marcar como no disponible'}
        </button>
      </form>

      {loading ? (
        <Spinner />
      ) : ausencias.length === 0 ? (
        <p className="empty-state">No hay días marcados como no disponibles.</p>
      ) : (
        <ul className="ausencias-lista">
          {ausencias.map((a) => (
            <li className="ausencia-item" key={a.id}>
              <div>
                <strong>{formatFechaLarga(a.fecha)}</strong>
                {a.motivo && <span className="ausencia-motivo">{a.motivo}</span>}
              </div>
              {confirmId === a.id ? (
                <div className="ausencia-confirmar">
                  <span>¿Volver a habilitar este día?</span>
                  <button
                    className="btn btn-gold btn-sm"
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => handleQuitar(a)}
                  >
                    {busyId === a.id ? 'Guardando…' : 'Sí, quitar'}
                  </button>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setConfirmId(null)}>
                    No
                  </button>
                </div>
              ) : (
                <button className="btn btn-outline btn-sm" type="button" onClick={() => setConfirmId(a.id)}>
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
