import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="app-shell centered">
      <div style={{ textAlign: 'center' }}>
        <p className="eyebrow">Error 404</p>
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>Esta página no existe</h1>
        <Link className="btn btn-gold" to="/">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
