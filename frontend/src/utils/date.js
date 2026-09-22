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
