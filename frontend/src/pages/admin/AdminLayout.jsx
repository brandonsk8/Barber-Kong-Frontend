import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const LINKS = [
  { to: '/admin/citas', label: 'Citas' },
  { to: '/admin/clientes', label: 'Clientes' },
  { to: '/admin/servicios', label: 'Servicios' },
  { to: '/admin/inventario', label: 'Inventario' },
  { to: '/admin/reportes', label: 'Reportes' },
  { to: '/seguridad', label: 'Seguridad' },
];

export default function AdminLayout() {
  const { logout } = useAuth();

  return (
    <div className="admin-shell">
      <div className="admin-sidebar">
        <span className="logo">
          Barber <span style={{ color: 'var(--gold)' }}>Kong</span>
        </span>
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
        <button
          className="side-link"
          type="button"
          style={{ border: 'none', width: '100%', textAlign: 'left', background: 'none', cursor: 'pointer' }}
          onClick={logout}
        >
          Salir
        </button>
      </div>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
