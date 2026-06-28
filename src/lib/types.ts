// Modelo de datos de Compás. Multi-academia: todo cuelga de una `Academia` (tenant).

export type Rol = "leader" | "follower" | "ambos";
export type Nivel = "principiante" | "medio" | "avanzado";
export type Sexo = "hombre" | "mujer" | "otro" | "nd";
export type Visibilidad = "privado" | "clase" | "academia";
export type EstadoAsistencia = "si" | "no" | "quiza";

/** Reglas configurables del motor de balance (con valores por defecto sensatos). */
export interface ReglasBalance {
  ratioObjetivo: number; // 0.5 = 50/50 leader/follower
  tolerancia: number; // desbalance admitido (nº de personas) antes de avisar
  avisoHorasAntes: number; // antelación del aviso de refuerzo
  cupoRefuerzos: number; // máximo de refuerzos externos por clase
  nivelesCompatibles: boolean; // ¿se puede reforzar con niveles distintos?
}

export const REGLAS_POR_DEFECTO: ReglasBalance = {
  ratioObjetivo: 0.5,
  tolerancia: 2,
  avisoHorasAntes: 3,
  cupoRefuerzos: 6,
  nivelesCompatibles: true,
};

/** Academia = tenant. Aislada del resto. */
export interface Academia {
  id: string;
  slug: string;
  nombre: string;
  emoji: string;
  color: string;
  estilos: string[];
  reglas: ReglasBalance;
  createdAt: string;
}

/** Alumno de una academia, con perfil opcional para la comunidad. */
export interface Alumno {
  id: string;
  academiaId: string;
  nombre: string;
  rol: Rol;
  nivel: Nivel;
  sexo: Sexo;
  estilos: string[];
  // Perfil opcional (opt-in, privacidad primero).
  fotoUrl: string | null;
  bio: string;
  bailandoDesde: string | null;
  instagram: string | null;
  visibilidad: Visibilidad;
  createdAt: string;
}

/** Clase recurrente (plantilla semanal). */
export interface Clase {
  id: string;
  academiaId: string;
  nombre: string;
  nivel: Nivel;
  estilo: string;
  diaSemana: number; // 0=domingo .. 6=sábado
  hora: string; // "20:00"
  sala: string;
  aforo: number | null;
  createdAt: string;
}

/** Respuesta de asistencia de un alumno a una sesión concreta (clase + fecha). */
export interface Asistencia {
  id: string;
  academiaId: string;
  claseId: string;
  alumnoId: string;
  fecha: string; // ISO yyyy-mm-dd de la sesión concreta
  estado: EstadoAsistencia;
  rolEnClase: Rol | null; // rol asignado en esta sesión (para "ambos")
  esRefuerzo: boolean;
  updatedAt: string;
}

export const NIVELES: Nivel[] = ["principiante", "medio", "avanzado"];
export const ROLES: Rol[] = ["leader", "follower", "ambos"];

export const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const ESTILOS_SUGERIDOS = [
  "Salsa",
  "Bachata",
  "Kizomba",
  "Tango",
  "Swing",
  "Zouk",
  "Lindy Hop",
  "Forró",
];
