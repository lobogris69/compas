// Adaptador de datos contra Supabase (modo nube multi-academia).
//
// Mapea entre las tablas (snake_case, ver supabase/migrations/0001_init.sql) y
// los tipos de la app (camelCase). Está tipado y listo para enchufar; el store
// local seguirá siendo el modo por defecto hasta migrarlo a asíncrono.

import { getSupabase } from "./supabase";
import type {
  Academia,
  Alumno,
  Asistencia,
  Clase,
  EstadoAsistencia,
  ReglasBalance,
  Video,
} from "./types";

function db() {
  const s = getSupabase();
  if (!s) throw new Error("Supabase no está configurado");
  return s;
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

export async function crearAcademia(
  input: Omit<Academia, "id" | "createdAt">,
): Promise<Academia> {
  const { data, error } = await db()
    .from("academias")
    .insert({
      slug: input.slug,
      nombre: input.nombre,
      emoji: input.emoji,
      color: input.color,
      estilos: input.estilos,
      ...reglasToRow(input.reglas),
    })
    .select("*")
    .single();
  if (error) throw error;
  return academiaFromRow(data);
}

export async function actualizarReglas(
  academiaId: string,
  reglas: ReglasBalance,
): Promise<void> {
  const { error } = await db()
    .from("academias")
    .update(reglasToRow(reglas))
    .eq("id", academiaId);
  if (error) throw error;
}

// ───────────────────────── Alumnos ─────────────────────────

export async function alumnosDe(academiaId: string): Promise<Alumno[]> {
  const { data, error } = await db()
    .from("alumnos")
    .select("*")
    .eq("academia_id", academiaId);
  if (error) throw error;
  return (data ?? []).map(alumnoFromRow);
}

export async function crearAlumno(
  input: Omit<Alumno, "id" | "createdAt">,
): Promise<Alumno> {
  const { data, error } = await db()
    .from("alumnos")
    .insert({
      academia_id: input.academiaId,
      nombre: input.nombre,
      rol: input.rol,
      nivel: input.nivel,
      sexo: input.sexo,
      estilos: input.estilos,
      foto_url: input.fotoUrl,
      bio: input.bio,
      bailando_desde: input.bailandoDesde,
      instagram: input.instagram,
      visibilidad: input.visibilidad,
    })
    .select("*")
    .single();
  if (error) throw error;
  return alumnoFromRow(data);
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

export async function crearClase(
  input: Omit<Clase, "id" | "createdAt">,
): Promise<Clase> {
  const { data, error } = await db()
    .from("clases")
    .insert({
      academia_id: input.academiaId,
      nombre: input.nombre,
      nivel: input.nivel,
      estilo: input.estilo,
      dia_semana: input.diaSemana,
      hora: input.hora,
      sala: input.sala,
      aforo: input.aforo,
    })
    .select("*")
    .single();
  if (error) throw error;
  return claseFromRow(data);
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
  const { error } = await db().from("alumnos").delete().eq("id", id);
  if (error) throw error;
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

export async function crearVideo(
  input: Omit<Video, "id" | "createdAt">,
): Promise<Video> {
  const { data, error } = await db()
    .from("videos")
    .insert({
      academia_id: input.academiaId,
      titulo: input.titulo,
      categoria: input.categoria,
      url: input.url,
      descripcion: input.descripcion,
    })
    .select("*")
    .single();
  if (error) throw error;
  return videoFromRow(data);
}

export async function actualizarVideo(
  id: string,
  patch: Partial<Pick<Video, "titulo" | "categoria" | "descripcion" | "url">>,
): Promise<void> {
  const { error } = await db().from("videos").update(patch).eq("id", id);
  if (error) throw error;
}

export async function eliminarVideo(id: string): Promise<void> {
  const { error } = await db().from("videos").delete().eq("id", id);
  if (error) throw error;
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
