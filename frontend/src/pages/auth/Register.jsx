import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Alert from '../../components/Alert.jsx';
import { ApiClientError } from '../../api/client.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await register(form);
      setSuccess('Cuenta creada. Ahora podés ingresar con tu correo y contraseña.');
      setTimeout(() => navigate('/ingresar'), 1500);
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
          <Link className="auth-tab" to="/ingresar">
            Ingresar
          </Link>
          <span className="auth-tab active">Crear cuenta</span>
        </div>

        <Alert type="error">{error}</Alert>
        <Alert type="success">{success}</Alert>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              type="text"
              placeholder="Tu nombre"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
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
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              type="tel"
              placeholder="5512-3456"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button className="btn btn-gold btn-block" type="submit" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
