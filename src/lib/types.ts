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

/** Profesor de la academia, con los estilos que imparte. */
export interface Profesor {
  nombre: string;
  estilos: string[];
}

/** Academia = tenant. Aislada del resto. */
export interface Academia {
  id: string;
  slug: string;
  nombre: string;
  emoji: string;
  color: string;
  estilos: string[];
  reglas: ReglasBalance;
  /** Datos de contacto / perfil público de la academia. */
  ubicacion: string;
  telefono: string;
  /** Plantilla del mensaje de recordatorio de pago (admite {nombre} y {academia}). */
  recordatorioPago: string;
  /** Datos de cobro que se enseñan a quien reserva un taller. */
  bizum: string;
  iban: string;
  /** Logo (dataURL en local, URL/Storage en nube). Si falta, se usa el emoji. */
  logoUrl: string | null;
  profesores: Profesor[];
  /** Dueño (auth.users.id) en modo nube; null/ausente en modo local. */
  ownerId?: string | null;
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
  telefono: string;
  /** Email del alumno (opcional). Si lo da, puede entrar con enlace mágico. */
  email: string;
  /** Usuario de Supabase vinculado, cuando ha reclamado su ficha. */
  userId: string | null;
  /** Fecha de baja. Si tiene valor, ya no está activo (pero se conserva todo). */
  bajaAt: string | null;
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
  /** ¿Vino de verdad? null mientras no se haya pasado lista. */
  asistio: boolean | null;
  updatedAt: string;
}

/** Rol de un miembro con acceso de gestión a la academia. */
export type RolMiembro = "profesor";

/** Miembro con acceso (profesor) a una academia, invitado por el dueño por email. */
export interface Miembro {
  id: string;
  academiaId: string;
  email: string;
  rol: RolMiembro;
  createdAt: string;
}

/** Tipo de plan de cobro que ofrece una academia. */
export type TipoPlan =
  | "mensual"
  | "trimestral"
  | "semestral"
  | "anual"
  | "bono";

/** Plan de cobro (modalidad) que define una academia. */
export interface PlanPago {
  id: string;
  academiaId: string;
  nombre: string;
  tipo: TipoPlan;
  importe: number;
  clases: number | null; // solo bonos
  activo: boolean;
  createdAt: string;
}

/** Pago registrado de un alumno contra un plan. */
export interface Pago {
  id: string;
  academiaId: string;
  alumnoId: string;
  planId: string | null;
  concepto: string;
  tipo: TipoPlan;
  importe: number;
  fechaPago: string; // ISO yyyy-mm-dd
  cubreDesde: string | null;
  cubreHasta: string | null;
  clases: number | null; // solo bonos
  createdAt: string;
}

/** Taller o evento puntual que la academia publica para que se reserve. */
export interface Taller {
  id: string;
  academiaId: string;
  nombre: string;
  descripcion: string;
  /** null mientras no haya fecha cerrada. */
  fecha: string | null;
  hora: string;
  duracionMin: number | null;
  importe: number;
  /** null = sin límite de plazas. */
  plazas: number | null;
  cartelUrl: string | null;
  activo: boolean;
  createdAt: string;
}

export type MetodoPago = "bizum" | "transferencia" | "efectivo";
export type EstadoReserva = "pendiente" | "confirmada" | "cancelada";

/** Reserva de una persona para un taller (no hace falta que sea alumna). */
export interface Reserva {
  id: string;
  academiaId: string;
  tallerId: string;
  nombre: string;
  email: string;
  telefono: string;
  /** Rol con el que viene: permite ver el equilibrio del taller. */
  rol: Rol;
  metodoPago: MetodoPago;
  estado: EstadoReserva;
  notas: string;
  createdAt: string;
}

/** Ocupación de un taller sin destapar quién ha reservado. */
export interface PlazasTaller {
  reservadas: number;
  leaders: number;
  followers: number;
}

/** Registro de que se avisó a un alumno para reforzar una sesión. */
export interface AvisoRefuerzo {
  id: string;
  academiaId: string;
  claseId: string;
  alumnoId: string;
  fecha: string;
  createdAt: string;
}

/** Matrícula: vincula un alumno con una clase de su academia (puede tener varias). */
export interface Matricula {
  id: string;
  academiaId: string;
  claseId: string;
  alumnoId: string;
  createdAt: string;
}

/** Vídeo de la academia (clase, figura, evento, actuación…). */
export interface Video {
  id: string;
  academiaId: string;
  titulo: string;
  categoria: string;
  url: string;
  descripcion: string;
  createdAt: string;
}

export const CATEGORIAS_VIDEO_SUGERIDAS = [
  "Figuras",
  "Clases",
  "Eventos",
  "Actuaciones",
  "Técnica",
  "Coreografías",
];

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
