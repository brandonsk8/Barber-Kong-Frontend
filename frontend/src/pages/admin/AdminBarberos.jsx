// HU-04/HU-05/HU-06 (UC-22/23/24) — alta, edición y baja de barberos. El backend ya
// exponía este CRUD completo desde EP-01, pero no tenía pantalla propia en el
// frontend (Booking.jsx y AdminCitas.jsx solo lo consumían en modo lectura para
// llenar selects). Mismo patrón que AdminClientes.jsx.
import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import Modal from '../../components/Modal.jsx';
import { barberosApi } from '../../api/barberos.api.js';
import { ApiClientError } from '../../api/client.js';

const EMPTY_FORM = { nombre: '', especialidad: '', email: '', password: '' };

export default function AdminBarberos() {
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await barberosApi.listAll();
      setBarberos(res || []);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los barberos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(barbero) {
    setEditing(barbero);
    setForm({ nombre: barbero.nombre, especialidad: barbero.especialidad || '', email: '', password: '' });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        // UC-23: solo nombre y especialidad son editables (el correo/contraseña de
        // acceso se gestionan por separado, no forman parte de este formulario).
        await barberosApi.update(editing.id, { nombre: form.nombre, especialidad: form.especialidad });
      } else {
        await barberosApi.create(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'No se pudo guardar el barbero.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(barbero) {
    if (!window.confirm(`¿Desactivar a ${barbero.nombre}? No se le podrán asignar nuevas citas.`)) return;
    setBusyId(barbero.id);
    try {
      await barberosApi.deactivate(barbero.id);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo desactivar al barbero.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>
            Administración
          </p>
          <h2 style={{ fontSize: 24 }}>Barberos</h2>
        </div>
        <button className="btn btn-gold" type="button" onClick={openCreate}>
          + Nuevo barbero
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <Spinner />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Especialidad</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {barberos.map((b) => (
                <tr key={b.id}>
                  <td>{b.nombre}</td>
                  <td>{b.especialidad || '—'}</td>
                  <td>
                    <span className={`tag ${b.is_active ? 'confirmada' : 'cancelada'}`}>
                      {b.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button type="button" onClick={() => openEdit(b)}>
                      Editar
                    </button>
                    {b.is_active && (
                      <button
                        type="button"
                        disabled={busyId === b.id}
                        onClick={() => handleDeactivate(b)}
                      >
                        {busyId === b.id ? 'Guardando…' : 'Desactivar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {barberos.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-state">
                    No hay barberos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Editar barbero' : 'Nuevo barbero'} onClose={() => setModalOpen(false)}>
          {formError && <Alert type="error">{formError}</Alert>}
          <form onSubmit={handleSave}>
            <div className="field">
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="especialidad">Especialidad</label>
              <input
                id="especialidad"
                value={form.especialidad}
                onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
              />
            </div>
            {!editing && (
              <>
                <div className="field">
                  <label htmlFor="email">Correo (para iniciar sesión)</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="password">Contraseña inicial</label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="modal-actions">
              <button className="btn btn-ghost" type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-gold" type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
