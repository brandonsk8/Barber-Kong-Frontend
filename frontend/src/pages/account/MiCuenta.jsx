// RF-AUT-07 — activar/desactivar la verificación en dos pasos. El backend (Miguel)
// pide la contraseña actual para confirmar el cambio, por tratarse de una
// configuración de seguridad y no un dato de perfil cualquiera.
import { useState } from 'react';
import PublicNav from '../../components/PublicNav.jsx';
import Alert from '../../components/Alert.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../api/auth.api.js';
import { ApiClientError } from '../../api/client.js';

export default function MiCuenta() {
  const { user, updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleToggle(enabled) {
    if (!password) {
      setError('Ingresá tu contraseña actual para confirmar el cambio.');
      return;
    }
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const { user: nextUser } = await authApi.updateTwoFactor({ enabled, password });
      updateUser(nextUser);
      setPassword('');
      setSuccess(enabled ? 'Verificación en dos pasos activada.' : 'Verificación en dos pasos desactivada.');
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
        <p className="picker-title">Mi cuenta</p>
        <div className="summary-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <div className="line">
            Correo: <strong>{user?.email}</strong>
          </div>
          <div className="line">
            Rol: <strong>{user?.role}</strong>
          </div>
        </div>

        <p className="picker-title" style={{ marginTop: 24 }}>
          Verificación en dos pasos (2FA)
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Cuando está activada, cada inicio de sesión pide además un código de un solo
          uso enviado a tu correo. Actualmente está{' '}
          <strong>{user?.twoFactorEnabled ? 'activada' : 'desactivada'}</strong>.
        </p>

        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <div className="field" style={{ maxWidth: 320 }}>
          <label htmlFor="password">Contraseña actual (para confirmar)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {!user?.twoFactorEnabled ? (
            <button className="btn btn-gold" type="button" disabled={saving} onClick={() => handleToggle(true)}>
              {saving ? 'Guardando…' : 'Activar 2FA'}
            </button>
          ) : (
            <button className="btn btn-outline" type="button" disabled={saving} onClick={() => handleToggle(false)}>
              {saving ? 'Guardando…' : 'Desactivar 2FA'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
