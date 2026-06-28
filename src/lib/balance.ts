// Motor de balance leader/follower. El corazón de Compás.
//
// Dada la gente que asiste a una sesión (clase + fecha), calcula el equilibrio,
// asignando óptimamente a los "ambos" al rol en minoría, y dice si falta gente
// y de qué rol — para disparar refuerzos.

import type { Academia, Alumno, Asistencia, Nivel, Rol } from "./types";

export type EstadoBalance = "ok" | "warn" | "alert";

export interface BalanceResult {
  leadersFijos: number;
  followersFijos: number;
  ambos: number;
  leaders: number; // efectivos tras repartir "ambos"
  followers: number; // efectivos tras repartir "ambos"
  total: number;
  gap: number; // |leaders - followers|
  estado: EstadoBalance;
  /** Rol que falta y cuántos para equilibrar (null si está cuadrado). */
  faltan: { rol: "leader" | "follower"; cantidad: number } | null;
}

/** Reparte los "ambos" al rol que esté en minoría, uno a uno. */
export function calcularBalance(
  asistentes: { rol: Rol }[],
  tolerancia: number,
): BalanceResult {
  let leaders = 0;
  let followers = 0;
  let ambos = 0;
  for (const a of asistentes) {
    if (a.rol === "leader") leaders++;
    else if (a.rol === "follower") followers++;
    else ambos++;
  }
  const leadersFijos = leaders;
  const followersFijos = followers;

  let flex = ambos;
  while (flex > 0) {
    if (leaders <= followers) leaders++;
    else followers++;
    flex--;
  }

  const gap = Math.abs(leaders - followers);
  let estado: EstadoBalance = "ok";
  if (gap > tolerancia * 2) estado = "alert";
  else if (gap > tolerancia) estado = "warn";

  const faltan =
    gap === 0
      ? null
      : {
          rol: (leaders > followers ? "follower" : "leader") as
            | "leader"
            | "follower",
          cantidad: gap,
        };

  const total = leaders + followers;
  return {
    leadersFijos,
    followersFijos,
    ambos,
    leaders,
    followers,
    total,
    gap,
    estado,
    faltan,
  };
}

const ORDEN_NIVEL: Record<Nivel, number> = {
  principiante: 0,
  medio: 1,
  avanzado: 2,
};

/** ¿Es compatible el nivel del candidato con el de la clase? */
function nivelCompatible(
  nivelClase: Nivel,
  nivelAlumno: Nivel,
  permitirDistinto: boolean,
): boolean {
  if (permitirDistinto) {
    // Permite ±1 nivel de distancia (no juntar principiante con avanzado).
    return Math.abs(ORDEN_NIVEL[nivelClase] - ORDEN_NIVEL[nivelAlumno]) <= 1;
  }
  return nivelClase === nivelAlumno;
}

export interface Candidato {
  alumno: Alumno;
  /** Rol con el que vendría a reforzar. */
  rolRefuerzo: "leader" | "follower";
}

/**
 * Sugiere alumnos para reforzar una sesión descompensada.
 * Busca quien pueda cubrir el rol que falta, no viene ya ese día, y encaja de nivel.
 */
export function sugerirRefuerzos(
  academia: Academia,
  alumnos: Alumno[],
  nivelClase: Nivel,
  balance: BalanceResult,
  yaResponden: Set<string>,
): Candidato[] {
  if (!balance.faltan) return [];
  const rolNecesario = balance.faltan.rol;

  const candidatos: Candidato[] = [];
  for (const alumno of alumnos) {
    if (yaResponden.has(alumno.id)) continue;
    const puedeRol =
      alumno.rol === rolNecesario || alumno.rol === "ambos";
    if (!puedeRol) continue;
    if (
      !nivelCompatible(nivelClase, alumno.nivel, academia.reglas.nivelesCompatibles)
    )
      continue;
    candidatos.push({ alumno, rolRefuerzo: rolNecesario });
  }

  // Prioriza el mismo nivel y luego los "ambos" (más flexibles).
  candidatos.sort((a, b) => {
    const na = a.alumno.nivel === nivelClase ? 0 : 1;
    const nb = b.alumno.nivel === nivelClase ? 0 : 1;
    if (na !== nb) return na - nb;
    const fa = a.alumno.rol === "ambos" ? 0 : 1;
    const fb = b.alumno.rol === "ambos" ? 0 : 1;
    return fa - fb;
  });

  return candidatos.slice(0, academia.reglas.cupoRefuerzos);
}

/** Etiqueta y color para pintar el estado del balance. */
export function estiloEstado(estado: EstadoBalance): {
  label: string;
  emoji: string;
  clase: string;
} {
  switch (estado) {
    case "ok":
      return {
        label: "Equilibrada",
        emoji: "🟢",
        clase: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
      };
    case "warn":
      return {
        label: "Algo descompensada",
        emoji: "🟡",
        clase: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      };
    case "alert":
      return {
        label: "Descompensada",
        emoji: "🔴",
        clase: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
      };
  }
}

/** Pasar de un asistente con rol a su rol efectivo, repartiendo "ambos". */
export function asignarRolesEfectivos(
  asistentes: { id: string; rol: Rol }[],
): Map<string, "leader" | "follower"> {
  const fijos = asistentes.filter((a) => a.rol !== "ambos");
  let leaders = fijos.filter((a) => a.rol === "leader").length;
  let followers = fijos.filter((a) => a.rol === "follower").length;
  const out = new Map<string, "leader" | "follower">();
  for (const a of fijos) out.set(a.id, a.rol as "leader" | "follower");
  for (const a of asistentes.filter((x) => x.rol === "ambos")) {
    if (leaders <= followers) {
      out.set(a.id, "leader");
      leaders++;
    } else {
      out.set(a.id, "follower");
      followers++;
    }
  }
  return out;
}
