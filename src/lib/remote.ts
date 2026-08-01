// Adaptador de datos contra Supabase (modo nube multi-academia).
//
// Mapea entre las tablas (snake_case, ver supabase/migrations/0001_init.sql) y
// los tipos de la app (camelCase). Está tipado y listo para enchufar; el store
// local seguirá siendo el modo por defecto hasta migrarlo a asíncrono.

import { getSupabase } from "./supabase";
import type { AdminAcademiaResumen } from "./admin";
import type {
  Academia,
  Alumno,
  Asistencia,
  AvisoRefuerzo,
  Clase,
  EstadoAsistencia,
  Matricula,
  Miembro,
  Pago,
  PlanPago,
  ReglasBalance,
  Video,
} from "./types";

function db() {
  const s = getSupabase();
  if (!s) throw new Error("Supabase no está configurado");
  return s;
}

/**
 * Cuando RLS bloquea un UPDATE o un DELETE, Postgres NO da error: simplemente
 * no afecta a ninguna fila y la petición devuelve éxito. Eso hacía que la app
 * dijera "guardado" mientras el dato se descartaba en silencio. Pedimos las
 * filas afectadas (`.select()`) y, si no hay ninguna, lo convertimos en error
 * para que la UI pueda avisar.
 */
function exigirFilas(filas: unknown[] | null, accion: string): void {
  if (!filas || filas.length === 0) {
    throw new Error(`no tienes permiso para ${accion} (o el dato ya no existe)`);
  }
}

// ───────────────────────── Mappers ─────────────────────────

function academiaFromRow(r: Record<string, unknown>): Academia {
  return {
    id: r.id as string,
    slug: r.slug as string,
    nombre: r.nombre as string,
    emoji: r.emoji as string,
    color: r.color as string,
    estilos: (r.estilos as string[]) ?? [],
    reglas: {
      ratioObjetivo: r.ratio_objetivo as number,
      tolerancia: r.tolerancia as number,
      avisoHorasAntes: r.aviso_horas_antes as number,
      cupoRefuerzos: r.cupo_refuerzos as number,
      nivelesCompatibles: r.niveles_compatibles as boolean,
    },
    ubicacion: (r.ubicacion as string) ?? "",
    telefono: (r.telefono as string) ?? "",
    recordatorioPago: (r.recordatorio_pago as string) ?? "",
    logoUrl: (r.logo_url as string | null) ?? null,
    profesores: (r.profesores as Academia["profesores"]) ?? [],
    ownerId: (r.owner as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

function reglasToRow(reglas: ReglasBalance) {
  return {
    ratio_objetivo: reglas.ratioObjetivo,
    tolerancia: reglas.tolerancia,
    aviso_horas_antes: reglas.avisoHorasAntes,
    cupo_refuerzos: reglas.cupoRefuerzos,
    niveles_compatibles: reglas.nivelesCompatibles,
  };
}

function alumnoFromRow(r: Record<string, unknown>): Alumno {
  return {
    id: r.id as string,
    academiaId: r.academia_id as string,
    nombre: r.nombre as string,
    rol: r.rol as Alumno["rol"],
    nivel: r.nivel as Alumno["nivel"],
    sexo: r.sexo as Alumno["sexo"],
    telefono: (r.telefono as string) ?? "",
    email: (r.email as string) ?? "",
    userId: (r.user_id as string | null) ?? null,
    estilos: (r.estilos as string[]) ?? [],
    fotoUrl: (r.foto_url as string | null) ?? null,
    bio: (r.bio as string) ?? "",
    bailandoDesde: (r.bailando_desde as string | null) ?? null,
    instagram: (r.instagram as string | null) ?? null,
    visibilidad: r.visibilidad as Alumno["visibilidad"],
    createdAt: r.created_at as string,
  };
}

function claseFromRow(r: Record<string, unknown>): Clase {
  return {
    id: r.id as string,
    academiaId: r.academia_id as string,
    nombre: r.nombre as string,
    nivel: r.nivel as Clase["nivel"],
    estilo: r.estilo as string,
    diaSemana: r.dia_semana as number,
    hora: r.hora as string,
    sala: (r.sala as string) ?? "",
    aforo: (r.aforo as number | null) ?? null,
    createdAt: r.created_at as string,
  };
}

function asistenciaFromRow(r: Record<string, unknown>): Asistencia {
  return {
    id: r.id as string,
    academiaId: r.academia_id as string,
    claseId: r.clase_id as string,
    alumnoId: r.alumno_id as string,
    fecha: r.fecha as string,
    estado: r.estado as EstadoAsistencia,
    rolEnClase: (r.rol_en_clase as Asistencia["rolEnClase"]) ?? null,
    esRefuerzo: (r.es_refuerzo as boolean) ?? false,
    asistio: (r.asistio as boolean | null) ?? null,
    updatedAt: r.updated_at as string,
  };
}

// ───────────────────────── Academias ─────────────────────────

export async function academiaPorSlug(slug: string): Promise<Academia | null> {
  const { data, error } = await db()
    .from("academias")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? academiaFromRow(data) : null;
}

// Inserta con el id generado en cliente (mismo id en memoria y BD) y el owner
// del usuario autenticado (lo exige la política RLS).
export async function crearAcademia(
  a: Academia,
  ownerId: string,
): Promise<void> {
  const { error } = await db()
    .from("academias")
    .insert({
      id: a.id,
      slug: a.slug,
      nombre: a.nombre,
      emoji: a.emoji,
      color: a.color,
      estilos: a.estilos,
      ubicacion: a.ubicacion,
      telefono: a.telefono,
      recordatorio_pago: a.recordatorioPago,
      logo_url: a.logoUrl,
      profesores: a.profesores,
      owner: ownerId,
      ...reglasToRow(a.reglas),
    });
  if (error) throw error;
}

export async function actualizarReglas(
  academiaId: string,
  reglas: ReglasBalance,
): Promise<void> {
  const { data, error } = await db()
    .from("academias")
    .update(reglasToRow(reglas))
    .eq("id", academiaId)
    .select("id");
  if (error) throw error;
  exigirFilas(data, "guardar las reglas de la academia");
}

export async function actualizarRecordatorio(
  academiaId: string,
  texto: string,
): Promise<void> {
  const { data, error } = await db()
    .from("academias")
    .update({ recordatorio_pago: texto })
    .eq("id", academiaId)
    .select("id");
  if (error) throw error;
  exigirFilas(data, "guardar el mensaje de recordatorio");
}

// ───────────────────────── Alumnos ─────────────────────────

// Columnas públicas del alumno. `email` y `telefono` quedan fuera a propósito:
// son datos de contacto y nadie tiene permiso de lectura sobre esas columnas
// (0011 y 0012). El email solo se usa en servidor para vincular la ficha; los
// teléfonos se piden aparte con `telefonosDe`, que comprueba que eres del equipo.
const COLS_ALUMNO =
  "id,academia_id,user_id,nombre,rol,nivel,sexo,estilos,foto_url,bio,bailando_desde,instagram,visibilidad,created_at";

export async function alumnosDe(academiaId: string): Promise<Alumno[]> {
  const { data, error } = await db()
    .from("alumnos")
    .select(COLS_ALUMNO)
    .eq("academia_id", academiaId);
  if (error) throw error;
  return (data ?? []).map((r) =>
    alumnoFromRow(r as unknown as Record<string, unknown>),
  );
}

export async function crearAlumno(a: Alumno): Promise<void> {
  const { error } = await db()
    .from("alumnos")
    .insert({
      id: a.id,
      academia_id: a.academiaId,
      nombre: a.nombre,
      rol: a.rol,
      nivel: a.nivel,
      sexo: a.sexo,
      telefono: a.telefono,
      email: a.email,
      estilos: a.estilos,
      foto_url: a.fotoUrl,
      bio: a.bio,
      bailando_desde: a.bailandoDesde,
      instagram: a.instagram,
      visibilidad: a.visibilidad,
    });
  // 23505 = clave única duplicada: ese email ya está apuntado en la academia.
  if (error?.code === "23505") {
    throw new Error(
      "ese email ya está apuntado en esta academia. Entra con tu enlace en vez de volver a registrarte",
    );
  }
  if (error) throw error;
}

/**
 * Teléfonos de los alumnos de una academia. Solo devuelve algo si quien pregunta
 * es el dueño o un profesor (lo comprueba la función en la base de datos); para
 * cualquier otro viene vacío. Se pide aparte del resto del alumno porque el
 * teléfono no es legible en la tabla.
 */
export async function telefonosDe(
  academiaId: string,
): Promise<Record<string, string>> {
  const { data, error } = await db().rpc("telefonos_academia", {
    aid: academiaId,
  });
  if (error) throw error;
  const out: Record<string, string> = {};
  for (const fila of (data ?? []) as { alumno_id: string; telefono: string }[]) {
    out[fila.alumno_id] = fila.telefono ?? "";
  }
  return out;
}

/**
 * Vincula la ficha de alumno con la cuenta que acaba de entrar (reclamarla).
 * Solo funciona si el email de la ficha coincide con el de la sesión y la ficha
 * no tiene dueño todavía (política `alumnos_reclamar`). Devuelve el id del
 * alumno vinculado, o null si no había ninguna ficha suya en esa academia.
 */
export async function vincularAlumno(
  academiaId: string,
  email: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await db()
    .from("alumnos")
    .update({ user_id: userId })
    .eq("academia_id", academiaId)
    .ilike("email", email)
    .is("user_id", null)
    .select("id");
  if (error) throw error;
  return data && data.length > 0 ? (data[0].id as string) : null;
}

export async function actualizarAlumno(
  id: string,
  patch: Partial<Alumno>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre;
  if (patch.rol !== undefined) row.rol = patch.rol;
  if (patch.nivel !== undefined) row.nivel = patch.nivel;
  if (patch.sexo !== undefined) row.sexo = patch.sexo;
  if (patch.telefono !== undefined) row.telefono = patch.telefono;
  if (patch.estilos !== undefined) row.estilos = patch.estilos;
  if (patch.fotoUrl !== undefined) row.foto_url = patch.fotoUrl;
  if (patch.bio !== undefined) row.bio = patch.bio;
  if (patch.bailandoDesde !== undefined) row.bailando_desde = patch.bailandoDesde;
  if (patch.instagram !== undefined) row.instagram = patch.instagram;
  if (patch.visibilidad !== undefined) row.visibilidad = patch.visibilidad;
  if (Object.keys(row).length === 0) return;
  const { data, error } = await db()
    .from("alumnos")
    .update(row)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  exigirFilas(data, "guardar los datos del alumno");
}

// ───────────────────────── Clases ─────────────────────────

export async function clasesDe(academiaId: string): Promise<Clase[]> {
  const { data, error } = await db()
    .from("clases")
    .select("*")
    .eq("academia_id", academiaId);
  if (error) throw error;
  return (data ?? []).map(claseFromRow);
}

export async function crearClase(c: Clase): Promise<void> {
  const { error } = await db()
    .from("clases")
    .insert({
      id: c.id,
      academia_id: c.academiaId,
      nombre: c.nombre,
      nivel: c.nivel,
      estilo: c.estilo,
      dia_semana: c.diaSemana,
      hora: c.hora,
      sala: c.sala,
      aforo: c.aforo,
    });
  if (error) throw error;
}

// ───────────────────────── Asistencias ─────────────────────────

export async function asistenciasDe(
  claseId: string,
  fecha: string,
): Promise<Asistencia[]> {
  const { data, error } = await db()
    .from("asistencias")
    .select("*")
    .eq("clase_id", claseId)
    .eq("fecha", fecha);
  if (error) throw error;
  return (data ?? []).map(asistenciaFromRow);
}

export async function eliminarAlumno(id: string): Promise<void> {
  const { data, error } = await db()
    .from("alumnos")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  exigirFilas(data, "dar de baja al alumno");
}

// Borra la academia. La BD elimina en cascada clases, alumnos, asistencias y
// vídeos (on delete cascade). RLS exige ser el dueño.
export async function eliminarAcademia(id: string): Promise<void> {
  const { data, error } = await db()
    .from("academias")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  exigirFilas(data, "borrar la academia");
}

// Lista TODAS las academias con sus conteos (panel de plataforma). La lectura
// es pública por RLS; el gateo de quién accede se hace en la UI (/admin).
export async function adminListarAcademias(): Promise<AdminAcademiaResumen[]> {
  const { data, error } = await db()
    .from("academias")
    .select(
      "id,slug,nombre,emoji,color,created_at,alumnos(count),clases(count),videos(count)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  const cuenta = (v: unknown): number =>
    Array.isArray(v) && v[0] && typeof (v[0] as { count?: number }).count === "number"
      ? (v[0] as { count: number }).count
      : 0;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    slug: r.slug as string,
    nombre: r.nombre as string,
    emoji: r.emoji as string,
    color: r.color as string,
    createdAt: r.created_at as string,
    nAlumnos: cuenta(r.alumnos),
    nClases: cuenta(r.clases),
    nVideos: cuenta(r.videos),
  }));
}

// ───────────────────────── Vídeos ─────────────────────────

function videoFromRow(r: Record<string, unknown>): Video {
  return {
    id: r.id as string,
    academiaId: r.academia_id as string,
    titulo: r.titulo as string,
    categoria: r.categoria as string,
    url: r.url as string,
    descripcion: (r.descripcion as string) ?? "",
    createdAt: r.created_at as string,
  };
}

export async function videosDe(academiaId: string): Promise<Video[]> {
  const { data, error } = await db()
    .from("videos")
    .select("*")
    .eq("academia_id", academiaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(videoFromRow);
}

export async function crearVideo(v: Video): Promise<void> {
  const { error } = await db()
    .from("videos")
    .insert({
      id: v.id,
      academia_id: v.academiaId,
      titulo: v.titulo,
      categoria: v.categoria,
      url: v.url,
      descripcion: v.descripcion,
    });
  if (error) throw error;
}

export async function actualizarVideo(
  id: string,
  patch: Partial<Video>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.titulo !== undefined) row.titulo = patch.titulo;
  if (patch.categoria !== undefined) row.categoria = patch.categoria;
  if (patch.descripcion !== undefined) row.descripcion = patch.descripcion;
  if (patch.url !== undefined) row.url = patch.url;
  if (Object.keys(row).length === 0) return;
  const { data, error } = await db()
    .from("videos")
    .update(row)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  exigirFilas(data, "guardar el vídeo");
}

export async function eliminarVideo(id: string): Promise<void> {
  const { data, error } = await db()
    .from("videos")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  exigirFilas(data, "borrar el vídeo");
}

// ───────────────────────── Matrículas ─────────────────────────

function matriculaFromRow(r: Record<string, unknown>): Matricula {
  return {
    id: r.id as string,
    academiaId: r.academia_id as string,
    claseId: r.clase_id as string,
    alumnoId: r.alumno_id as string,
    createdAt: r.created_at as string,
  };
}

export async function matriculasDe(academiaId: string): Promise<Matricula[]> {
  const { data, error } = await db()
    .from("matriculas")
    .select("*")
    .eq("academia_id", academiaId);
  if (error) throw error;
  return (data ?? []).map(matriculaFromRow);
}

export async function crearMatricula(m: Matricula): Promise<void> {
  const { error } = await db().from("matriculas").insert({
    id: m.id,
    academia_id: m.academiaId,
    clase_id: m.claseId,
    alumno_id: m.alumnoId,
  });
  if (error) throw error;
}

export async function eliminarMatricula(id: string): Promise<void> {
  const { data, error } = await db()
    .from("matriculas")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  exigirFilas(data, "quitar la matrícula");
}

// ───────────────────────── Miembros (profesores) ─────────────────────────

function miembroFromRow(r: Record<string, unknown>): Miembro {
  return {
    id: r.id as string,
    academiaId: r.academia_id as string,
    email: r.email as string,
    rol: r.rol as Miembro["rol"],
    createdAt: r.created_at as string,
  };
}

export async function miembrosDe(academiaId: string): Promise<Miembro[]> {
  const { data, error } = await db()
    .from("miembros")
    .select("*")
    .eq("academia_id", academiaId);
  if (error) throw error;
  return (data ?? []).map(miembroFromRow);
}

export async function crearMiembro(m: Miembro): Promise<void> {
  const { error } = await db().from("miembros").insert({
    id: m.id,
    academia_id: m.academiaId,
    email: m.email,
    rol: m.rol,
  });
  if (error) throw error;
}

export async function eliminarMiembro(id: string): Promise<void> {
  const { data, error } = await db()
    .from("miembros")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  exigirFilas(data, "quitar el acceso del profesor");
}

// ───────────────────────── Planes de pago ─────────────────────────

function planFromRow(r: Record<string, unknown>): PlanPago {
  return {
    id: r.id as string,
    academiaId: r.academia_id as string,
    nombre: r.nombre as string,
    tipo: r.tipo as PlanPago["tipo"],
    importe: Number(r.importe ?? 0),
    clases: (r.clases as number | null) ?? null,
    activo: (r.activo as boolean) ?? true,
    createdAt: r.created_at as string,
  };
}

export async function planesDe(academiaId: string): Promise<PlanPago[]> {
  const { data, error } = await db()
    .from("planes_pago")
    .select("*")
    .eq("academia_id", academiaId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(planFromRow);
}

export async function crearPlan(p: PlanPago): Promise<void> {
  const { error } = await db().from("planes_pago").insert({
    id: p.id,
    academia_id: p.academiaId,
    nombre: p.nombre,
    tipo: p.tipo,
    importe: p.importe,
    clases: p.clases,
    activo: p.activo,
  });
  if (error) throw error;
}

export async function eliminarPlan(id: string): Promise<void> {
  const { data, error } = await db()
    .from("planes_pago")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  exigirFilas(data, "borrar el plan");
}

// ───────────────────────── Pagos ─────────────────────────

function pagoFromRow(r: Record<string, unknown>): Pago {
  return {
    id: r.id as string,
    academiaId: r.academia_id as string,
    alumnoId: r.alumno_id as string,
    planId: (r.plan_id as string | null) ?? null,
    concepto: (r.concepto as string) ?? "",
    tipo: r.tipo as Pago["tipo"],
    importe: Number(r.importe ?? 0),
    fechaPago: r.fecha_pago as string,
    cubreDesde: (r.cubre_desde as string | null) ?? null,
    cubreHasta: (r.cubre_hasta as string | null) ?? null,
    clases: (r.clases as number | null) ?? null,
    createdAt: r.created_at as string,
  };
}

export async function pagosDe(academiaId: string): Promise<Pago[]> {
  const { data, error } = await db()
    .from("pagos")
    .select("*")
    .eq("academia_id", academiaId);
  if (error) throw error;
  return (data ?? []).map(pagoFromRow);
}

export async function crearPago(p: Pago): Promise<void> {
  const { error } = await db().from("pagos").insert({
    id: p.id,
    academia_id: p.academiaId,
    alumno_id: p.alumnoId,
    plan_id: p.planId,
    concepto: p.concepto,
    tipo: p.tipo,
    importe: p.importe,
    fecha_pago: p.fechaPago,
    cubre_desde: p.cubreDesde,
    cubre_hasta: p.cubreHasta,
    clases: p.clases,
  });
  if (error) throw error;
}

export async function eliminarPago(id: string): Promise<void> {
  const { data, error } = await db()
    .from("pagos")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  exigirFilas(data, "borrar el pago");
}

/**
 * Marca si un alumno vino a una sesión concreta. Va por función en la base de
 * datos porque `asistio` no es escribible desde el cliente: el dato debe ser
 * fiable (nadie puede marcarse presente a sí mismo) para que sirva de histórico.
 */
export async function marcarAsistencia(
  academiaId: string,
  claseId: string,
  alumnoId: string,
  fecha: string,
  vino: boolean,
): Promise<void> {
  const { error } = await db().rpc("marcar_asistencia", {
    aid: academiaId,
    cid: claseId,
    alid: alumnoId,
    f: fecha,
    vino,
  });
  if (error) throw error;
}

// ───────────────────────── Avisos de refuerzo ─────────────────────────

export async function avisosDe(academiaId: string): Promise<AvisoRefuerzo[]> {
  const { data, error } = await db()
    .from("avisos_refuerzo")
    .select("*")
    .eq("academia_id", academiaId);
  // Un alumno no puede leerlos (RLS): no es un fallo, simplemente no le tocan.
  if (error) return [];
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    academiaId: r.academia_id as string,
    claseId: r.clase_id as string,
    alumnoId: r.alumno_id as string,
    fecha: r.fecha as string,
    createdAt: r.created_at as string,
  }));
}

export async function crearAviso(a: AvisoRefuerzo): Promise<void> {
  const { error } = await db().from("avisos_refuerzo").insert({
    id: a.id,
    academia_id: a.academiaId,
    clase_id: a.claseId,
    alumno_id: a.alumnoId,
    fecha: a.fecha,
  });
  if (error) throw error;
}

export async function actualizarClase(
  id: string,
  patch: Partial<Clase>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre;
  if (patch.nivel !== undefined) row.nivel = patch.nivel;
  if (patch.estilo !== undefined) row.estilo = patch.estilo;
  if (patch.diaSemana !== undefined) row.dia_semana = patch.diaSemana;
  if (patch.hora !== undefined) row.hora = patch.hora;
  if (patch.sala !== undefined) row.sala = patch.sala;
  if (patch.aforo !== undefined) row.aforo = patch.aforo;
  if (Object.keys(row).length === 0) return;
  const { data, error } = await db()
    .from("clases")
    .update(row)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  exigirFilas(data, "guardar la clase");
}

export async function eliminarClase(id: string): Promise<void> {
  const { data, error } = await db()
    .from("clases")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  exigirFilas(data, "borrar la clase");
}

export async function asistenciasDeAcademia(
  academiaId: string,
): Promise<Asistencia[]> {
  const { data, error } = await db()
    .from("asistencias")
    .select("*")
    .eq("academia_id", academiaId);
  if (error) throw error;
  return (data ?? []).map(asistenciaFromRow);
}

export async function responder(input: {
  academiaId: string;
  claseId: string;
  alumnoId: string;
  fecha: string;
  estado: EstadoAsistencia;
  esRefuerzo?: boolean;
}): Promise<void> {
  // upsert por (clase_id, alumno_id, fecha) — restricción única en la tabla.
  const { error } = await db()
    .from("asistencias")
    .upsert(
      {
        academia_id: input.academiaId,
        clase_id: input.claseId,
        alumno_id: input.alumnoId,
        fecha: input.fecha,
        estado: input.estado,
        es_refuerzo: input.esRefuerzo ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clase_id,alumno_id,fecha" },
    );
  if (error) throw error;
}
