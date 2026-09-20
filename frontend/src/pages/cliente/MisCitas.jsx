import { useEffect, useState } from 'react';
import PublicNav from '../../components/PublicNav.jsx';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import { citasApi } from '../../api/citas.api.js';
import { ApiClientError } from '../../api/client.js';
import { formatFechaLarga } from '../../utils/date.js';

const TAG_LABEL = {
  confirmada: 'Confirmada',
  pendiente: 'Pendiente',
  cancelada: 'Cancelada',
  atendida: 'Atendida',
};

function CitaRow({ cita, onCancelar }) {
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
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => onCancelar(cita.id)}>
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

export default function MisCitas({ embedded = false, refreshToken }) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        citas.map((c) => <CitaRow cita={c} key={c.id} onCancelar={handleCancelar} />)}
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
