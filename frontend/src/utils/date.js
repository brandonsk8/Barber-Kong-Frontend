const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_ABIERTOS = [0, 1, 2, 3, 4]; // domingo a jueves

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

// Próximos `count` días a partir de hoy, marcando cuáles están dentro del horario
// de atención de la barbería (dom-jue, según PLAN_FASE2.md).
export function upcomingDays(count = 7) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      iso: toISODate(d),
      dow: DOW[d.getDay()],
      dayNumber: d.getDate(),
      open: DIAS_ABIERTOS.includes(d.getDay()),
    });
  }
  return days;
}

// BK-32 (HU-10) — los 7 días (dom-sáb) de la semana que contiene `iso`, marcando
// cuáles están dentro del horario de atención, para la vista semanal del barbero.
export function weekDaysFor(iso) {
  const base = new Date(`${iso}T00:00:00`);
  const sunday = new Date(base);
  sunday.setDate(base.getDate() - base.getDay());
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    days.push({
      date: d,
      iso: toISODate(d),
      dow: DOW[d.getDay()],
      dayNumber: d.getDate(),
      open: DIAS_ABIERTOS.includes(d.getDay()),
    });
  }
  return days;
}

// Franjas horarias de 9:00 a 19:00 con receso de 13:00 a 14:00, cada 1 hora, para
// mostrar el picker cuando el backend todavía no expone /disponibilidad. Cuando ese
// endpoint exista, sus horas ocupadas deben cruzarse con esta lista.
export function defaultTimeSlots() {
  const slots = [];
  for (let h = 9; h < 19; h += 1) {
    const isLunch = h === 13;
    slots.push({
      value: `${String(h).padStart(2, '0')}:00`,
      label: h > 12 ? `${h - 12}:00 p.m.` : `${h}:00 a.m.`,
      blocked: isLunch,
    });
  }
  return slots;
}

export function formatFechaLarga(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' });
}

export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// "Hoy" en la zona horaria del navegador (AAAA-MM-DD). toISODate usa UTC, que de noche en
// Guatemala ya es "mañana"; para validar fechas que el usuario elige hay que usar esta.
export function hoyLocalISO() {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

const ALMUERZO_INICIO = 13 * 60; // receso de almuerzo de la barbería: 13:00 a 14:00
const ALMUERZO_FIN = 14 * 60;

function aMinutos(hhmm) {
  const [h, m] = String(hhmm).slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

function deMinutos(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

function etiquetaHora(min) {
  const h = Math.floor(min / 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min % 60).padStart(2, '0')} ${h >= 12 ? 'p.m.' : 'a.m.'}`;
}

// Horas de inicio que se pueden ofrecer en un día según los bloques de atención del
// barbero (los que devuelve /disponibilidad): una cada hora dentro de cada bloque y solo
// si el servicio (`duracionMin`) termina antes de que el bloque cierre. `ocupadas` son
// las marcas horarias ("HH:00") que el backend reporta con cita; una franja se bloquea si
// toca alguna. El receso de almuerzo sigue siendo una regla global de la barbería.
export function slotsDeBloques(bloques, duracionMin, ocupadas = []) {
  const marcas = ocupadas.map(aMinutos);
  const slots = [];
  (bloques || []).forEach((b) => {
    const fin = aMinutos(b.hora_fin);
    for (let t = aMinutos(b.hora_inicio); t + duracionMin <= fin; t += 60) {
      const almuerzo = t < ALMUERZO_FIN && t + duracionMin > ALMUERZO_INICIO;
      const ocupada = marcas.some((m) => m < t + duracionMin && m + 60 > t);
      slots.push({ value: deMinutos(t), label: etiquetaHora(t), blocked: almuerzo || ocupada });
    }
  });
  return slots;
}
