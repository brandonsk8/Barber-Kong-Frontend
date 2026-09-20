import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from './Spinner.jsx';

// roles: array opcional de roles permitidos ('admin' | 'barbero' | 'cliente').
// Si se omite, solo exige estar autenticado.
export default function ProtectedRoute({ roles, children }) {
  const { user, ready, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!ready) return <Spinner />;

  if (!isAuthenticated) {
    return <Navigate to="/ingresar" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
