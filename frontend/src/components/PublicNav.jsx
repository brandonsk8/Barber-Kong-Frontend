import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationsBell from './NotificationsBell.jsx';

function homeForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'barbero') return '/barbero/agenda';
  return '/agendar';
}

export default function PublicNav() {
  const { user, isAuthenticated, logout } = useAuth();
  const { pathname } = useLocation();
  // Servicios / Barberos / Horario son anclas de secciones de la landing: fuera de ella
  // no llevan a ningún lado, así que solo se muestran en "/".
  const enLanding = pathname === '/';

  return (
    <div className="nav">
      <Link className="logo" to="/">
        Barber<span>Kong</span>
      </Link>
      {enLanding && (
        <div className="nav-links">
          <a href="#servicios">Servicios</a>
          <a href="#equipo">Barberos</a>
          <a href="#horario">Horario</a>
        </div>
      )}
      {isAuthenticated ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <NotificationsBell />
          <Link className="btn btn-outline btn-sm" to={homeForRole(user.role)}>
            Panel
          </Link>
          <Link className="btn btn-outline btn-sm" to="/cuenta">
            Mi cuenta
          </Link>
          <button className="btn btn-ghost btn-sm" onClick={logout} type="button">
            Salir
          </button>
        </div>
      ) : (
        <Link className="btn btn-gold" to="/agendar">
          Agendar cita
        </Link>
      )}
    </div>
  );
}
