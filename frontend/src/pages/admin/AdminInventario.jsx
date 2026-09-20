import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import Modal from '../../components/Modal.jsx';
import { inventarioApi } from '../../api/inventario.api.js';
import { ApiClientError } from '../../api/client.js';

const EMPTY_FORM = { nombre: '', unidad_medida: '', cantidad_minima: '' };

export default function AdminInventario() {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [entradaTarget, setEntradaTarget] = useState(null);
  const [entradaCantidad, setEntradaCantidad] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await inventarioApi.list();
      setInsumos(res || []);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el inventario.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function isLow(insumo) {
    return (
      insumo.cantidad_minima != null &&
      Number(insumo.cantidad_disponible) < Number(insumo.cantidad_minima)
    );
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await inventarioApi.create({
        nombre: form.nombre,
        unidad_medida: form.unidad_medida,
        cantidad_minima: form.cantidad_minima ? Number(form.cantidad_minima) : null,
      });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'No se pudo guardar el insumo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleEntrada(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await inventarioApi.registrarEntrada(entradaTarget.id, Number(entradaCantidad));
      setEntradaTarget(null);
      setEntradaCantidad('');
      load();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'No se pudo registrar la entrada.');
    } finally {
      setSaving(false);
    }
  }

  const stockBajo = insumos.filter(isLow).length;

  return (
    <div>
      <div className="admin-top">
        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>
            Administración
          </p>
          <h2 style={{ fontSize: 24 }}>Inventario</h2>
        </div>
        <button className="btn btn-gold" type="button" onClick={() => setModalOpen(true)}>
          + Registrar insumo
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-card">
          <div className="num">{insumos.length}</div>
          <div className="lbl">Insumos registrados</div>
        </div>
        <div className={`kpi-card ${stockBajo > 0 ? 'alert' : ''}`}>
          <div className="num">{stockBajo}</div>
          <div className="lbl">Con stock bajo</div>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Mínimo</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((i) => (
                <tr key={i.id}>
                  <td>{i.nombre}</td>
                  <td>{i.cantidad_disponible}</td>
                  <td>{i.unidad_medida}</td>
                  <td>{i.cantidad_minima ?? '—'}</td>
                  <td>
                    <span className={`stock-pill ${isLow(i) ? 'low' : 'ok'}`}>
                      {isLow(i) ? 'Stock bajo' : 'OK'}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button type="button" onClick={() => setEntradaTarget(i)}>
                      + Entrada
                    </button>
                  </td>
                </tr>
              ))}
              {insumos.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No hay insumos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal title="Registrar insumo" onClose={() => setModalOpen(false)}>
          {formError && <Alert type="error">{formError}</Alert>}
          <form onSubmit={handleCreate}>
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
              <label htmlFor="unidad">Unidad de medida</label>
              <input
                id="unidad"
                required
                placeholder="litros, unidades, paquetes…"
                value={form.unidad_medida}
                onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="minimo">Cantidad mínima (opcional)</label>
              <input
                id="minimo"
                type="number"
                min="0"
                value={form.cantidad_minima}
                onChange={(e) => setForm({ ...form, cantidad_minima: e.target.value })}
              />
              <p className="field-hint">Si lo dejás vacío, no se genera alerta de stock bajo.</p>
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

      {entradaTarget && (
        <Modal title={`Registrar entrada — ${entradaTarget.nombre}`} onClose={() => setEntradaTarget(null)}>
          {formError && <Alert type="error">{formError}</Alert>}
          <form onSubmit={handleEntrada}>
            <div className="field">
              <label htmlFor="cantidad">Cantidad a ingresar</label>
              <input
                id="cantidad"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={entradaCantidad}
                onChange={(e) => setEntradaCantidad(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" type="button" onClick={() => setEntradaTarget(null)}>
                Cancelar
              </button>
              <button className="btn btn-gold" type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Registrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
