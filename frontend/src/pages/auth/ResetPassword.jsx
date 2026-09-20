import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Alert from '../../components/Alert.jsx';
import { ApiClientError } from '../../api/client.js';
import { authApi } from '../../api/auth.api.js';

// Se asume que el enlace enviado por correo trae el token como query param:
// /restablecer?token=xxxxx (ver password_reset_tokens en schema.sql).
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      navigate('/ingresar');
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else setError('Ocurrió un error inesperado. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="app-shell centered">
        <div className="auth-card">
          <Alert type="error">El enlace no es válido o ya expiró.</Alert>
          <Link className="btn btn-outline btn-block" to="/recuperar">
            Solicitar uno nuevo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell centered">
      <div className="auth-card">
        <p className="eyebrow">Restablecer contraseña</p>
        <h2 style={{ fontSize: 22, marginBottom: 20 }}>Elegí tu nueva contraseña</h2>

        <Alert type="error">{error}</Alert>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="password">Nueva contraseña</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirmar contraseña</label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button className="btn btn-gold btn-block" type="submit" disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
