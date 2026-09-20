import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNav from '../../components/PublicNav.jsx';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import { serviciosApi } from '../../api/servicios.api.js';
import { barberosApi } from '../../api/barberos.api.js';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_ABIERTOS = [0, 1, 2, 3, 4]; // domingo a jueves, según PLAN_FASE2.md

function initials(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function Landing() {
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [serviciosRes, barberosRes] = await Promise.allSettled([
          serviciosApi.listActive(),
          barberosApi.listActive(),
        ]);
        if (cancelled) return;
        if (serviciosRes.status === 'fulfilled') setServicios(serviciosRes.value || []);
        else setError('No se pudo cargar el catálogo de servicios.');
        if (barberosRes.status === 'fulfilled') setBarberos(barberosRes.value || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PublicNav />

      <div className="hero">
        <p className="eyebrow">Xela · Desde 2023</p>
        <h1>
          Tu turno, <em>sin esperar</em> en la fila
        </h1>
        <p>
          Agendá tu corte o arreglo de barba en menos de un minuto. Elegí barbero, servicio
          y horario — nosotros nos encargamos del resto.
        </p>
        <div className="hero-ctas">
          <Link className="btn btn-gold" to="/agendar">
            Agendar una cita
          </Link>
          <a className="btn btn-outline" href="#servicios">
            Ver servicios
          </a>
        </div>
      </div>
      <div className="stripe-divider" />

      <section className="section" id="servicios">
        <div className="section-head">
          <p className="eyebrow">Servicios</p>
          <h2>Lo que hacemos mejor</h2>
          <p>Precios oficiales del menú de Barber Kong, visibles antes de agendar.</p>
        </div>

        {loading && <Spinner />}
        {!loading && error && <Alert type="error">{error}</Alert>}
        {!loading && !error && (
          <div className="services-grid">
            {servicios.map((s) => (
              <div className="service-card" key={s.id}>
                <h3>{s.nombre}</h3>
                <div className="meta">{s.duracion_minutos} min</div>
                <div className="price">Q{Number(s.precio).toFixed(0)}</div>
              </div>
            ))}
            {servicios.length === 0 && (
              <p className="empty-state">Todavía no hay servicios publicados.</p>
            )}
          </div>
        )}
      </section>

      <section className="section" style={{ background: 'var(--bg-alt)', maxWidth: 'none' }} id="equipo">
        <div className="section-head">
          <p className="eyebrow">Equipo</p>
          <h2>Nuestros barberos</h2>
        </div>
        <div className="team-grid" style={{ maxWidth: 1120, margin: '0 auto' }}>
          {barberos.map((b) => (
            <div className="team-card" key={b.id}>
              <div className="avatar">{initials(b.nombre)}</div>
              <h3>{b.nombre}</h3>
              <p>{b.especialidad || 'Barbero'}</p>
            </div>
          ))}
          {barberos.length === 0 && (
            <p className="empty-state">El equipo de barberos aún no está publicado.</p>
          )}
        </div>
      </section>

      <section className="section" id="horario">
        <div className="section-head">
          <p className="eyebrow">Horario</p>
          <h2>Cuándo atendemos</h2>
          <p>Domingo a jueves. Viernes y sábado no se agendan citas por alta afluencia sin cita previa.</p>
        </div>
        <div className="schedule-wrap">
          <div className="schedule-days">
            {DIAS.map((d, i) => (
              <div className={`day-pill ${DIAS_ABIERTOS.includes(i) ? 'open' : ''}`} key={d}>
                {d}
              </div>
            ))}
          </div>
          <div className="schedule-info">
            <div>
              <strong>9:00 a.m. – 7:00 p.m.</strong> horario de atención
            </div>
            <div>
              <strong>1:00 p.m. – 2:00 p.m.</strong> receso de almuerzo (sin citas)
            </div>
            <div>Viernes y sábado: solo atención por orden de llegada</div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        © {new Date().getFullYear()} Barber Kong — Xela, Guatemala · Sistema de gestión, Seminario de Sistemas 1
      </footer>
    </div>
  );
}
