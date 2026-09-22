import { useState } from 'react';
import PublicNav from '../../components/PublicNav.jsx';
import Alert from '../../components/Alert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../api/auth.api.js';
import { ApiClientError } from '../../api/client.js';

// Cualquier rol puede entrar acá (ver ProtectedRoute sin `roles` en App.jsx). Cambiar
// el 2FA es un cambio de seguridad, no un dato de perfil, así que el backend exige la
// contraseña actual para confirmarlo (auth.service.js#updateTwoFactor).
export default function Seguridad() {
  const { user, updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activo = Boolean(user?.twoFactorEnabled);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const { user: nextUser } = await authApi.updateTwoFactor({ enabled: !activo, password });
      updateUser(nextUser);
      setPassword('');
      setSuccess(
        nextUser.twoFactorEnabled
          ? 'Verificación en dos pasos activada. La próxima vez que ingreses te vamos a pedir un código por correo.'
          : 'Verificación en dos pasos desactivada.'
      );
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar la configuración.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PublicNav />
      <div className="booking-wrap">
        <p className="eyebrow" style={{ marginBottom: 4 }}>
          Mi cuenta
        </p>
        <h2 style={{ fontSize: 24, marginBottom: 20 }}>Seguridad</h2>

        <div className="summary-card" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: 24 }}>
          <div className="line">
            Verificación en dos pasos:{' '}
            <strong className={activo ? 'status-pill ok' : 'status-pill wait'}>
              {activo ? 'Activada' : 'Desactivada'}
            </strong>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '8px 0 0' }}>
            Cuando está activada, cada vez que ingreses te vamos a pedir además un código de
            6 dígitos que te enviamos por correo.
          </p>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <form onSubmit={handleSubmit} style={{ maxWidth: 360 }}>
          <div className="field">
            <label htmlFor="password">Confirmá tu contraseña actual</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-gold" type="submit" disabled={saving || !password}>
            {saving ? 'Guardando…' : activo ? 'Desactivar verificación en dos pasos' : 'Activar verificación en dos pasos'}
          </button>
        </form>
      </div>
    </div>
  );
}
