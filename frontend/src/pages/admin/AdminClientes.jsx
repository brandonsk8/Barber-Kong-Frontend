import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import Modal from '../../components/Modal.jsx';
import { clientesApi } from '../../api/clientes.api.js';
import { ApiClientError } from '../../api/client.js';

const EMPTY_FORM = { nombre: '', telefono: '', correo: '' };

export default function AdminClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await clientesApi.list(search);
      setClientes(res || []);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(cliente) {
    setEditing(cliente);
    setForm({ nombre: cliente.nombre, telefono: cliente.telefono || '', correo: cliente.correo || '' });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) await clientesApi.update(editing.id, form);
      else await clientesApi.create(form);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'No se pudo guardar el cliente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>
            Administración
          </p>
          <h2 style={{ fontSize: 24 }}>Clientes</h2>
        </div>
        <button className="btn btn-gold" type="button" onClick={openCreate}>
          + Nuevo cliente
        </button>
      </div>

      <div className="field" style={{ maxWidth: 320 }}>
        <input
          placeholder="Buscar por nombre o teléfono…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
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
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Citas totales</th>
                <th>Última visita</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td>{c.telefono || '—'}</td>
                  <td>{c.correo || '—'}</td>
                  <td>{c.citas_totales ?? '—'}</td>
                  <td>{c.ultima_visita || '—'}</td>
                  <td className="row-actions">
                    <button type="button" onClick={() => openEdit(c)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No hay clientes registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Editar cliente' : 'Nuevo cliente'} onClose={() => setModalOpen(false)}>
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
              <label htmlFor="telefono">Teléfono</label>
              <input
                id="telefono"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="correo">Correo</label>
              <input
                id="correo"
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
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
