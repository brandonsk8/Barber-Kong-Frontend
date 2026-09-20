import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import Modal from '../../components/Modal.jsx';
import { serviciosApi } from '../../api/servicios.api.js';
import { ApiClientError } from '../../api/client.js';

const EMPTY_FORM = { nombre: '', duracion_minutos: '', precio: '' };

export default function AdminServicios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await serviciosApi.listActive();
      setServicios(res || []);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los servicios.');
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

  function openEdit(servicio) {
    setEditing(servicio);
    setForm({
      nombre: servicio.nombre,
      duracion_minutos: servicio.duracion_minutos,
      precio: servicio.precio,
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = {
      nombre: form.nombre,
      duracion_minutos: Number(form.duracion_minutos),
      precio: Number(form.precio),
    };
    try {
      if (editing) await serviciosApi.update(editing.id, payload);
      else await serviciosApi.create(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'No se pudo guardar el servicio.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id) {
    try {
      await serviciosApi.deactivate(id);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo desactivar el servicio.');
    }
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>
            Administración
          </p>
          <h2 style={{ fontSize: 24 }}>Servicios</h2>
        </div>
        <button className="btn btn-gold" type="button" onClick={openCreate}>
          + Nuevo servicio
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
                <th>Servicio</th>
                <th>Duración</th>
                <th>Precio</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((s) => (
                <tr key={s.id}>
                  <td>{s.nombre}</td>
                  <td>{s.duracion_minutos} min</td>
                  <td>Q{Number(s.precio).toFixed(0)}</td>
                  <td>
                    <span className={`status-pill ${s.is_active ? 'ok' : 'cancel'}`}>
                      {s.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button type="button" onClick={() => openEdit(s)}>
                      Editar
                    </button>
                    {s.is_active && (
                      <button type="button" onClick={() => handleDeactivate(s.id)}>
                        Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {servicios.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No hay servicios registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Editar servicio' : 'Nuevo servicio'} onClose={() => setModalOpen(false)}>
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
              <label htmlFor="duracion">Duración (minutos)</label>
              <input
                id="duracion"
                type="number"
                min="1"
                required
                value={form.duracion_minutos}
                onChange={(e) => setForm({ ...form, duracion_minutos: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="precio">Precio (Q)</label>
              <input
                id="precio"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
              />
            </div>
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
