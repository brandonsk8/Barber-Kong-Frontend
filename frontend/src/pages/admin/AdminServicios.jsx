import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import Modal from '../../components/Modal.jsx';
import { serviciosApi } from '../../api/servicios.api.js';
import { inventarioApi } from '../../api/inventario.api.js';
import { ApiClientError } from '../../api/client.js';

const EMPTY_FORM = { nombre: '', duracion_minutos: '', precio: '' };

// HU-17 — modal para asociar insumos (receta de consumo) a un servicio.
function InsumosModal({ servicio, onClose }) {
  const [asociados, setAsociados] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [insumoId, setInsumoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [insumosRes, catalogoRes] = await Promise.all([
        serviciosApi.listInsumos(servicio.id),
        inventarioApi.list(),
      ]);
      setAsociados(insumosRes || []);
      setCatalogo(catalogoRes || []);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los insumos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicio.id]);

  async function handleAsociar(e) {
    e.preventDefault();
    if (!insumoId || !cantidad) return;
    setSaving(true);
    setError('');
    try {
      await serviciosApi.asociarInsumo(servicio.id, {
        insumo_id: insumoId,
        cantidad_consumida: Number(cantidad),
      });
      setInsumoId('');
      setCantidad('');
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo asociar el insumo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleQuitar(insumoIdToRemove) {
    setBusyId(insumoIdToRemove);
    setError('');
    try {
      await serviciosApi.quitarInsumo(servicio.id, insumoIdToRemove);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo quitar el insumo.');
    } finally {
      setBusyId(null);
    }
  }

  const disponibles = catalogo.filter((c) => !asociados.some((a) => a.insumo_id === c.id));

  return (
    <Modal title={`Insumos de "${servicio.nombre}"`} onClose={onClose}>
      {error && <Alert type="error">{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <table className="data-table" style={{ marginBottom: 16 }}>
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Cantidad por servicio</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {asociados.map((a) => (
                <tr key={a.insumo_id}>
                  <td>{a.nombre || a.insumo_nombre}</td>
                  <td>{a.cantidad_consumida}</td>
                  <td className="row-actions">
                    <button
                      type="button"
                      disabled={busyId === a.insumo_id}
                      onClick={() => handleQuitar(a.insumo_id)}
                    >
                      {busyId === a.insumo_id ? 'Quitando…' : 'Quitar'}
                    </button>
                  </td>
                </tr>
              ))}
              {asociados.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty-state">
                    Este servicio todavía no tiene insumos asociados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <form onSubmit={handleAsociar} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: 1, margin: 0 }}>
              <label htmlFor="insumo">Insumo</label>
              <select id="insumo" required value={insumoId} onChange={(e) => setInsumoId(e.target.value)}>
                <option value="">Elegí un insumo…</option>
                {disponibles.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ width: 120, margin: 0 }}>
              <label htmlFor="cantidad">Cantidad</label>
              <input
                id="cantidad"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>
            <button className="btn btn-gold" type="submit" disabled={saving || disponibles.length === 0}>
              {saving ? 'Agregando…' : 'Agregar'}
            </button>
          </form>
          {disponibles.length === 0 && catalogo.length > 0 && (
            <p className="empty-state" style={{ marginTop: 8 }}>
              Ya asociaste todos los insumos del catálogo a este servicio.
            </p>
          )}
          {catalogo.length === 0 && (
            <p className="empty-state" style={{ marginTop: 8 }}>
              No hay insumos registrados en el inventario todavía.
            </p>
          )}
        </>
      )}
    </Modal>
  );
}

export default function AdminServicios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [insumosServicio, setInsumosServicio] = useState(null);

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
                    <button type="button" onClick={() => setInsumosServicio(s)}>
                      Insumos
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

      {insumosServicio && (
        <InsumosModal servicio={insumosServicio} onClose={() => setInsumosServicio(null)} />
      )}
    </div>
  );
}
