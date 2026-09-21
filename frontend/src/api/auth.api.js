// EP-01 (dueño: Brandon) — src/modules/auth está en stub ("pendiente de implementar")
// al momento de escribir este frontend. Contrato asumido según PLAN_FASE2.md y el
// esquema de `users`/`password_reset_tokens`/`two_factor_codes` en schema.sql:
//
//   POST /api/auth/register        { email, password, nombre, telefono? }  -> { user }
//   POST /api/auth/login           { email, password }
//                                     -> { requiresTwoFactor: true, userId }  (si 2FA on)
//                                     -> { token, user }                      (si 2FA off)
//   POST /api/auth/verify-2fa      { userId, code } -> { token, user }
//   POST /api/auth/forgot-password { email } -> { message }
//   POST /api/auth/reset-password  { token, password } -> { message }
//   GET  /api/auth/me              (Bearer token) -> { user }
//   PUT  /api/auth/2fa             { enabled, password } -> { user }
//
// Si Brandon define rutas distintas al implementar EP-01, este es el único archivo
// que hay que tocar — el resto de la app llama a authApi.*, no a fetch directo.
import { api } from './client.js';

export const authApi = {
  register: (data) => api.post('/auth/register', data, { auth: false }),
  login: (credentials) => api.post('/auth/login', credentials, { auth: false }),
  verifyTwoFactor: (data) => api.post('/auth/verify-2fa', data, { auth: false }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }, { auth: false }),
  resetPassword: (data) => api.post('/auth/reset-password', data, { auth: false }),
  me: () => api.get('/auth/me'),
  updateTwoFactor: (data) => api.put('/auth/2fa', data),
};
