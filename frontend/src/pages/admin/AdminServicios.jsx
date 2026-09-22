import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import Modal from '../../components/Modal.jsx';
import { serviciosApi } from '../../api/servicios.api.js';
import { inventarioApi } from '../../api/inventario.api.js';
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
  const [insumosTarget, setInsumosTarget] = useState(null);
  const [insumosAsociados, setInsumosAsociados] = useState([]);
  const [catalogoInsumos, setCatalogoInsumos] = useState([]);
  const [insumosLoading, setInsumosLoading] = useState(false);
  const [insumosError, setInsumosError] = useState('');
  const [nuevoInsumoId, setNuevoInsumoId] = useState('');
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [savingInsumo, setSavingInsumo] = useState(false);

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

  async function openInsumos(servicio) {
    setInsumosTarget(servicio);
    setInsumosError('');
    setNuevoInsumoId('');
    setNuevaCantidad('');
    setInsumosLoading(true);
    try {
      const [asociados, catalogo] = await Promise.all([
        serviciosApi.listInsumos(servicio.id),
        catalogoInsumos.length ? catalogoInsumos : inventarioApi.list(),
      ]);
      setInsumosAsociados(asociados || []);
      if (!catalogoInsumos.length) setCatalogoInsumos(catalogo || []);
    } catch (err) {
      setInsumosError(
        err instanceof ApiClientError ? err.message : 'No se pudo cargar la información de insumos.'
      );
    } finally {
      setInsumosLoading(false);
    }
  }

  async function reloadInsumosAsociados() {
    const res = await serviciosApi.listInsumos(insumosTarget.id);
    setInsumosAsociados(res || []);
  }

  async function handleAsociar(e) {
    e.preventDefault();
    setInsumosError('');
    setSavingInsumo(true);
    try {
      await serviciosApi.asociarInsumo(insumosTarget.id, {
        insumo_id: nuevoInsumoId,
        cantidad_consumida: Number(nuevaCantidad),
      });
      setNuevoInsumoId('');
      setNuevaCantidad('');
      await reloadInsumosAsociados();
    } catch (err) {
      setInsumosError(err instanceof ApiClientError ? err.message : 'No se pudo asociar el insumo.');
    } finally {
      setSavingInsumo(false);
    }
  }

  async function handleQuitarInsumo(insumoId) {
    setInsumosError('');
    try {
      await serviciosApi.quitarInsumo(insumosTarget.id, insumoId);
      await reloadInsumosAsociados();
    } catch (err) {
      setInsumosError(err instanceof ApiClientError ? err.message : 'No se pudo quitar el insumo.');
    }
  }

  const insumosDisponibles = catalogoInsumos.filter(
    (i) => !insumosAsociados.some((a) => a.insumo_id === i.id)
  );

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
                    <button type="button" onClick={() => openInsumos(s)}>
                      Insumos
                    </button>
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

      {insumosTarget && (
        <Modal title={`Insumos — ${insumosTarget.nombre}`} onClose={() => setInsumosTarget(null)}>
          {insumosError && <Alert type="error">{insumosError}</Alert>}
          {insumosLoading ? (
            <Spinner />
          ) : (
            <>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Consume por servicio</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {insumosAsociados.map((a) => (
                      <tr key={a.insumo_id}>
                        <td>{a.nombre}</td>
                        <td>
                          {a.cantidad_consumida} {a.unidad_medida}
                        </td>
                        <td className="row-actions">
                          <button type="button" onClick={() => handleQuitarInsumo(a.insumo_id)}>
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {insumosAsociados.length === 0 && (
                      <tr>
                        <td colSpan={3} className="empty-state">
                          Este servicio todavía no consume ningún insumo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {insumosDisponibles.length > 0 && (
                <form onSubmit={handleAsociar} style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div className="field" style={{ flex: 2 }}>
                    <label htmlFor="insumo">Insumo</label>
                    <select
                      id="insumo"
                      required
                      value={nuevoInsumoId}
                      onChange={(e) => setNuevoInsumoId(e.target.value)}
                    >
                      <option value="" disabled>
                        Elegí un insumo…
                      </option>
                      {insumosDisponibles.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nombre} ({i.unidad_medida})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label htmlFor="cantidad">Cantidad</label>
                    <input
                      id="cantidad"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={nuevaCantidad}
                      onChange={(e) => setNuevaCantidad(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-gold" type="submit" disabled={savingInsumo}>
                    {savingInsumo ? 'Agregando…' : 'Agregar'}
                  </button>
                </form>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
