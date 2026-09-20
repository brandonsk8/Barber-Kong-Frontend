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

export default function VerifyTwoFactor() {
  const { verifyTwoFactor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!userId) {
    return (
      <div className="app-shell centered">
        <div className="auth-card">
          <Alert type="error">
            No hay una verificación en curso. Volvé a intentar el ingreso.
          </Alert>
          <Link className="btn btn-outline btn-block" to="/ingresar">
            Volver a ingresar
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await verifyTwoFactor({ userId, code });
      navigate(homeForRole(user.role), { replace: true });
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
        <p className="eyebrow">Verificación en dos pasos</p>
        <h2 style={{ fontSize: 22, marginBottom: 20 }}>Ingresá el código</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 22 }}>
          Te enviamos un código a tu correo. Ingresalo para completar el inicio de sesión.
        </p>

        <Alert type="error">{error}</Alert>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="code">Código de verificación</label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <button className="btn btn-gold btn-block" type="submit" disabled={loading}>
            {loading ? 'Verificando…' : 'Verificar'}
          </button>
        </form>
      </div>
    </div>
  );
}
