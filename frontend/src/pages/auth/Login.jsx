import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Alert from '../../components/Alert.jsx';
import { ApiClientError } from '../../api/client.js';

function homeForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'barbero') return '/barbero/agenda';
  return '/agendar';
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(form);
      if (result.requiresTwoFactor) {
        navigate('/verificar-2fa', { state: { userId: result.userId } });
        return;
      }
      const target = location.state?.from?.pathname || homeForRole(result.user.role);
      navigate(target, { replace: true });
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
        <Link className="logo" to="/" style={{ marginBottom: 26, display: 'block' }}>
          Barber<span style={{ color: 'var(--gold)' }}>Kong</span>
        </Link>
        <div className="auth-tabs">
          <span className="auth-tab active">Ingresar</span>
          <Link className="auth-tab" to="/registro">
            Crear cuenta
          </Link>
        </div>

        <Alert type="error">{error}</Alert>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="vos@correo.com"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button className="btn btn-gold btn-block" type="submit" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 18 }}>
          ¿Olvidaste tu contraseña?{' '}
          <Link to="/recuperar" style={{ color: 'var(--gold-bright)' }}>
            Recuperarla
          </Link>
        </p>
      </div>
    </div>
  );
}
