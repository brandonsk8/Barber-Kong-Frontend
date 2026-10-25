import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import PublicNav from '../../components/PublicNav.jsx';
import Spinner from '../../components/Spinner.jsx';
import Alert from '../../components/Alert.jsx';
import { serviciosApi } from '../../api/servicios.api.js';
import { barberosApi } from '../../api/barberos.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import corte1 from '../../assets/gallery/corte-1.jpg';
import corte2 from '../../assets/gallery/corte-2.jpg';
import corte3 from '../../assets/gallery/corte-3.jpg';
import corte4 from '../../assets/gallery/corte-4.jpg';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_ABIERTOS = [0, 1, 2, 3, 4]; // domingo a jueves, según PLAN_FASE2.md

const GALERIA = [
  { src: corte1, alt: 'Corte texturizado con fade — Barber Kongs' },
  { src: corte2, alt: 'Diseño en rulos con fade bajo — Barber Kongs' },
  { src: corte3, alt: 'Buzz fade clásico — Barber Kongs' },
  { src: corte4, alt: 'Mullet con fade — Barber Kongs' },
];

// Hace aparecer cada sección (y sus tarjetas, con cascada por CSS) cuando entra en
// pantalla al hacer scroll. Un solo observer para todas las secciones marcadas
// con [data-reveal]; se desconecta cada una apenas se revela — no vuelve a animar.
function useScrollReveal() {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const targets = root.querySelectorAll('[data-reveal]');
    if (!window.IntersectionObserver) {
      targets.forEach((el) => el.classList.add('in-view'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return rootRef;
}

function initials(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function Landing() {
  const { user, isAuthenticated } = useAuth();
  const revealRoot = useScrollReveal();
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

  // Un barbero o admin logueado no tiene por qué ver la landing pública (p. ej. al
  // hacer clic en el logo) — se les manda directo a su panel. El cliente sí puede
  // seguir viendo la landing (le sirve para revisar servicios/barberos otra vez).
  // Va después de todos los hooks para no romper las reglas de hooks de React.
  if (isAuthenticated && user.role === 'admin') return <Navigate to="/admin" replace />;
  if (isAuthenticated && user.role === 'barbero') return <Navigate to="/barbero/agenda" replace />;

  return (
    <div ref={revealRoot}>
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

      <section className="section" id="servicios" data-reveal>
        <div className="section-head">
          <p className="eyebrow">Servicios</p>
          <h2>Lo que hacemos mejor</h2>
          <p>Precios oficiales del menú de Barber Kongs, visibles antes de agendar.</p>
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

      <section className="section" style={{ background: 'var(--bg-alt)', maxWidth: 'none' }} id="galeria" data-reveal>
        <div className="section-head">
          <p className="eyebrow">Galería</p>
          <h2>Cortes que hablan por sí solos</h2>
          <p>Una muestra del trabajo de Allan, pieza por pieza.</p>
        </div>
        <div className="gallery-grid" style={{ maxWidth: 1120, margin: '0 auto' }}>
          {GALERIA.map((foto) => (
            <div className="gallery-item" key={foto.src}>
              <img src={foto.src} alt={foto.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="equipo" data-reveal>
        <div className="section-head">
          <p className="eyebrow">Equipo</p>
          <h2>Nuestros barberos</h2>
        </div>
        <div className="team-grid">
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

      <section className="section" id="horario" data-reveal>
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
        © {new Date().getFullYear()} Barber Kongs — La Esperanza, Quetzaltenango, Guatemala
      </footer>
    </div>
  );
}
