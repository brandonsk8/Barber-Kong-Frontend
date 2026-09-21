// HU-23 (UC-26) — centro de notificaciones in-app. No existía ninguna pantalla que
// consumiera notificacionesApi; esto la conecta como un desplegable simple en la barra
// de navegación, visible para cualquier rol autenticado.
import { useEffect, useRef, useState } from 'react';
import { notificacionesApi } from '../api/notificaciones.api.js';

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const res = await notificacionesApi.list();
      setNotificaciones(res || []);
    } catch {
      // Silencioso: una notificación que no carga no debe romper el resto de la app.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleMarcarLeida(id) {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    try {
      await notificacionesApi.marcarLeida(id);
    } catch {
      load(); // si falló, recargamos para no dejar un estado optimista incorrecto
    }
  }

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificaciones"
      >
        🔔{noLeidas > 0 ? ` ${noLeidas}` : ''}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '110%',
            width: 320,
            maxHeight: 360,
            overflowY: 'auto',
            background: 'var(--bg, #1a1a1a)',
            border: '1px solid var(--border, #333)',
            borderRadius: 8,
            padding: 8,
            zIndex: 50,
          }}
        >
          {loading && <p className="empty-state">Cargando…</p>}
          {!loading && notificaciones.length === 0 && (
            <p className="empty-state">No tenés notificaciones.</p>
          )}
          {!loading &&
            notificaciones.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '8px 6px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  opacity: n.leida ? 0.6 : 1,
                }}
              >
                <div style={{ fontWeight: n.leida ? 400 : 700, fontSize: 13 }}>{n.titulo}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{n.mensaje}</div>
                {!n.leida && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 4, padding: '2px 6px', fontSize: 11 }}
                    onClick={() => handleMarcarLeida(n.id)}
                  >
                    Marcar leída
                  </button>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
