import { useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../../components/Alert.jsx';
import { ApiClientError } from '../../api/client.js';
import { authApi } from '../../api/auth.api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSuccess('Si el correo existe, te enviamos un enlace para restablecer tu contraseña.');
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else setError('Ocurrió un error inesperado. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell centered">
      <div className="auth-card">
        <p className="eyebrow">Recuperar contraseña</p>
        <h2 style={{ fontSize: 22, marginBottom: 20 }}>¿Olvidaste tu contraseña?</h2>

        <Alert type="error">{error}</Alert>
        <Alert type="success">{success}</Alert>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="vos@correo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="btn btn-gold btn-block" type="submit" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 18 }}>
          <Link to="/ingresar" style={{ color: 'var(--gold-bright)' }}>
            Volver a ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}
