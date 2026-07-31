// Predicción de asistencia. La diferencia entre CONTAR y PREVER.
//
// El motor de balance (balance.ts) cuenta a quien ha dicho "sí". Eso hace que el
// lunes todas las clases salgan en verde y la alerta salte el jueves a las 20:00,
// cuando ya no hay margen. Aquí estimamos cuánta gente vendrá DE VERDAD usando el
// historial de "pasar lista", para poder avisar con días de antelación.
//
// El modelo es deliberadamente simple y explicable (nada de caja negra): para
// cada alumno miramos, de las veces que estuvo en su misma situación ("dijo que
// venía", "no contestó", "dijo que no"), cuántas apareció. Cuando de alguien
// tenemos pocos datos, su tasa se mezcla con la media de la academia, para que
// dos casos sueltos no manden. Eso es todo.

import type { Asistencia, Rol } from "./types";
import type { BalanceResult, EstadoBalance } from "./balance";

/** Situación del alumno antes de la clase. */
export type EstadoPrevio = "si" | "no" | "sin";

/**
 * Punto de partida cuando la academia todavía no tiene historial. Son valores
 * conservadores: quien dice que viene suele venir, quien calla viene la mitad de
 * las veces, y quien dice que no casi nunca aparece.
 */
export const PROBABILIDAD_INICIAL: Record<EstadoPrevio, number> = {
  si: 0.85,
  sin: 0.45,
  no: 0.05,
};

/**
 * Cuánto pesa la media frente a los datos propios del alumno. Con K=3, hacen
 * falta ~3 clases suyas para que su comportamiento empiece a mandar sobre la
 * media. Evita que "vino 1 de 1" se lea como "viene el 100% de las veces".
 */
const K = 3;

export interface Historial {
  /** Registros con lista pasada (asistio !== null). */
  registros: Asistencia[];
}

/** Estado previo de un alumno a partir de su respuesta (si la hubo). */
export function estadoPrevio(estado: "si" | "no" | "quiza" | null): EstadoPrevio {
  if (estado === "si") return "si";
  if (estado === "no") return "no";
  return "sin"; // "quizá" y "sin respuesta" se tratan igual: no lo sabemos
}

function tasa(registros: Asistencia[]): { vino: number; total: number } {
  return {
    vino: registros.filter((r) => r.asistio === true).length,
    total: registros.length,
  };
}

/**
 * Probabilidad de que un alumno aparezca, dado lo que respondió.
 * Mezcla su historial con el de la academia (media suavizada).
 */
export function probabilidadDeVenir(
  alumnoId: string,
  previo: EstadoPrevio,
  historial: Historial,
): number {
  const conLista = historial.registros.filter((r) => r.asistio !== null);

  const mismoEstado = conLista.filter(
    (r) => estadoPrevio(r.estado) === previo,
  );

  // Media de la academia SIN contar a este alumno. Si se incluyera, con un solo
  // registro se estaría comparando consigo mismo y "vino 1 de 1" saldría como
  // 100% de probabilidad, que es justo lo que queremos evitar.
  const g = tasa(mismoEstado.filter((r) => r.alumnoId !== alumnoId));
  // La media también se suaviza: en una academia recién estrenada, cuatro
  // registros no bastan para fijar una tasa.
  const media = (g.vino + K * PROBABILIDAD_INICIAL[previo]) / (g.total + K);

  // Y ahora los datos propios del alumno, suavizados hacia esa media.
  const s = tasa(mismoEstado.filter((r) => r.alumnoId === alumnoId));
  const p = (s.vino + K * media) / (s.total + K);
  return Math.min(1, Math.max(0, p));
}

export interface Candidato {
  alumnoId: string;
  rol: Rol;
  previo: EstadoPrevio;
}

export interface Prevision extends BalanceResult {
  /** Gente esperada, en decimal (antes de redondear). */
  esperados: number;
  /** Cuántos registros de lista sostienen la estimación. */
  muestras: number;
  /** Qué fiarse de esto: con pocos datos, poco. */
  confianza: "alta" | "media" | "baja";
}

/**
 * Estima el balance de una sesión antes de que ocurra.
 * Reparte los "ambos" al lado que va quedando en minoría, igual que el motor de
 * balance, pero pesando a cada persona por su probabilidad de aparecer.
 */
export function preverBalance(
  candidatos: Candidato[],
  historial: Historial,
  tolerancia: number,
): Prevision {
  let leaders = 0;
  let followers = 0;
  const flexibles: number[] = [];

  for (const c of candidatos) {
    const p = probabilidadDeVenir(c.alumnoId, c.previo, historial);
    if (c.rol === "leader") leaders += p;
    else if (c.rol === "follower") followers += p;
    else flexibles.push(p);
  }

  const leadersFijos = leaders;
  const followersFijos = followers;

  // Los más probables primero: son los que de verdad van a decidir el reparto.
  flexibles.sort((a, b) => b - a);
  for (const p of flexibles) {
    if (leaders <= followers) leaders += p;
    else followers += p;
  }

  const esperados = leaders + followers;
  const L = Math.round(leaders);
  const F = Math.round(followers);
  const gap = Math.abs(L - F);

  let estado: EstadoBalance = "ok";
  if (gap > tolerancia * 2) estado = "alert";
  else if (gap > tolerancia) estado = "warn";

  const muestras = historial.registros.filter((r) => r.asistio !== null).length;
  const confianza: Prevision["confianza"] =
    muestras >= 30 ? "alta" : muestras >= 10 ? "media" : "baja";

  return {
    leadersFijos: Math.round(leadersFijos),
    followersFijos: Math.round(followersFijos),
    ambos: flexibles.length,
    leaders: L,
    followers: F,
    total: L + F,
    gap,
    estado,
    faltan:
      gap > tolerancia
        ? {
            rol: L > F ? "follower" : "leader",
            cantidad: gap,
          }
        : null,
    esperados,
    muestras,
    confianza,
  };
}
