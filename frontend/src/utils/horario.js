// Horario semanal de un barbero para el formulario de Administración. En el formulario es
// una lista plana de bloques { dia_semana, hora_inicio, hora_fin } (igual que lo manda y
// lo devuelve la API); un día puede tener varios bloques y uno sin bloques = no atiende.

// Lo que el backend usa por defecto al crear un barbero: domingo a jueves, 9:00-19:00.
export function horarioPorDefecto() {
  return [0, 1, 2, 3, 4].map((dia) => ({ dia_semana: dia, hora_inicio: '09:00', hora_fin: '19:00' }));
}

export function bloqueNuevo(dia, bloquesDelDia = []) {
  // Si el día ya tiene bloques, el nuevo arranca donde termina el último (ej. tarde).
  const ultimoFin = bloquesDelDia.map((b) => b.hora_fin).sort().pop();
  return { dia_semana: dia, hora_inicio: ultimoFin || '09:00', hora_fin: '19:00' };
}

// Espejo en el cliente de lo que valida barberos.service.js (feedback inmediato; el backend
// sigue siendo quien decide). Devuelve { 0: 'mensaje', ... } con el índice del bloque con
// error, más `general` si el problema no es de un bloque en particular.
export function validarHorario(horario) {
  const errores = {};
  if (horario.length === 0) {
    return { general: 'Agrega al menos un bloque de atención.' };
  }

  horario.forEach((b, i) => {
    if (!b.hora_inicio || !b.hora_fin) errores[i] = 'Indica la hora de inicio y la de fin.';
    else if (b.hora_fin <= b.hora_inicio) errores[i] = 'La hora de fin debe ser posterior a la de inicio.';
  });

  [0, 1, 2, 3, 4, 5, 6].forEach((dia) => {
    const delDia = horario
      .map((b, i) => ({ ...b, i }))
      .filter((b) => b.dia_semana === dia && !errores[b.i])
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    for (let k = 1; k < delDia.length; k += 1) {
      if (delDia[k].hora_inicio < delDia[k - 1].hora_fin) {
        errores[delDia[k].i] = 'Este bloque se traslapa con otro del mismo día.';
      }
    }
  });

  return errores;
}
