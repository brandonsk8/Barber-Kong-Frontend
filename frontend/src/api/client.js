// Cliente HTTP central. Todo el resto de src/api/*.api.js pasa por acá para que
// el manejo de base URL, token JWT y errores esté en un solo lugar.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const TOKEN_KEY = 'barberkong_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Error uniforme para toda la app: siempre trae message listo para mostrar al usuario,
// y status por si algún caller necesita reaccionar distinto (401 -> logout, etc.)
export class ApiClientError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const finalHeaders = { ...headers };
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiClientError(
      'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.',
      0,
      err
    );
  }

  // Los stubs de módulos aún no implementados devuelven 404 con un mensaje tipo
  // "Citas: pendiente de implementar (EP-02)." — lo mostramos tal cual porque es
  // información útil mientras el backend se termina de construir.
  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!res.ok) {
    const message = payload?.message || `Error ${res.status} al comunicarse con el servidor.`;
    throw new ApiClientError(message, res.status, payload);
  }

  return payload;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
