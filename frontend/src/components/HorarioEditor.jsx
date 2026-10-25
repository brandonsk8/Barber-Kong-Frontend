import { DIAS_SEMANA } from '../utils/date.js';
import { bloqueNuevo } from '../utils/horario.js';

// Editor del horario semanal de un barbero (UC-22/UC-23). Controlado: `horario` es la
// lista plana de bloques { dia_semana, hora_inicio, hora_fin } y `errores` indica por
// índice de bloque qué está mal (ver validarHorario en utils/horario.js), para señalar el
// campo con error junto a su fila. Un día sin bloques = el barbero no atiende ese día.
export default function HorarioEditor({ horario, onChange, errores = {} }) {
  function cambiarBloque(indice, cambios) {
    onChange(horario.map((b, i) => (i === indice ? { ...b, ...cambios } : b)));
  }

  function quitarBloque(indice) {
    onChange(horario.filter((_, i) => i !== indice));
  }

  function agregarBloque(dia) {
    onChange([...horario, bloqueNuevo(dia, horario.filter((b) => b.dia_semana === dia))]);
  }

  return (
    <div className="horario-editor">
      {errores.general && <p className="field-error">{errores.general}</p>}
      {DIAS_SEMANA.map((nombre, dia) => {
        const bloques = horario.map((b, i) => ({ ...b, i })).filter((b) => b.dia_semana === dia);
        return (
          <div className="horario-dia" key={nombre}>
            <div className={`horario-dia-nombre ${bloques.length ? '' : 'libre'}`}>{nombre}</div>
            <div className="horario-bloques">
              {bloques.map((b) => (
                <div key={b.i}>
                  <div className="horario-bloque">
                    <input
                      type="time"
                      required
                      aria-label={`${nombre}: hora de inicio`}
                      value={b.hora_inicio}
                      onChange={(e) => cambiarBloque(b.i, { hora_inicio: e.target.value })}
                    />
                    <span>a</span>
                    <input
                      type="time"
                      required
                      aria-label={`${nombre}: hora de fin`}
                      value={b.hora_fin}
                      onChange={(e) => cambiarBloque(b.i, { hora_fin: e.target.value })}
                    />
                    <button
                      type="button"
                      className="horario-quitar"
                      aria-label={`Quitar este bloque del ${nombre.toLowerCase()}`}
                      onClick={() => quitarBloque(b.i)}
                    >
                      ×
                    </button>
                  </div>
                  {errores[b.i] && <p className="field-error">{errores[b.i]}</p>}
                </div>
              ))}
              {bloques.length === 0 && <span className="horario-vacio">No atiende</span>}
              <button type="button" className="horario-agregar" onClick={() => agregarBloque(dia)}>
                {bloques.length ? '+ Agregar bloque' : '+ Agregar horario'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
