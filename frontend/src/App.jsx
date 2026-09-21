import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Landing from './pages/public/Landing.jsx';
import NotFound from './pages/public/NotFound.jsx';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import VerifyTwoFactor from './pages/auth/VerifyTwoFactor.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';

import Booking from './pages/cliente/Booking.jsx';
import MisCitas from './pages/cliente/MisCitas.jsx';

import Agenda from './pages/barbero/Agenda.jsx';

import Seguridad from './pages/account/Seguridad.jsx';

import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminCitas from './pages/admin/AdminCitas.jsx';
import AdminClientes from './pages/admin/AdminClientes.jsx';
import AdminServicios from './pages/admin/AdminServicios.jsx';
import AdminInventario from './pages/admin/AdminInventario.jsx';
import AdminReportes from './pages/admin/AdminReportes.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/ingresar" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/verificar-2fa" element={<VerifyTwoFactor />} />
      <Route path="/recuperar" element={<ForgotPassword />} />
      <Route path="/restablecer" element={<ResetPassword />} />

      <Route
        path="/agendar"
        element={
          <ProtectedRoute roles={['cliente']}>
            <Booking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-citas"
        element={
          <ProtectedRoute roles={['cliente']}>
            <MisCitas />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seguridad"
        element={
          <ProtectedRoute>
            <Seguridad />
          </ProtectedRoute>
        }
      />

      <Route
        path="/barbero/agenda"
        element={
          <ProtectedRoute roles={['barbero']}>
            <Agenda />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="citas" replace />} />
        <Route path="citas" element={<AdminCitas />} />
        <Route path="clientes" element={<AdminClientes />} />
        <Route path="servicios" element={<AdminServicios />} />
        <Route path="inventario" element={<AdminInventario />} />
        <Route path="reportes" element={<AdminReportes />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
