// Subida de archivos a Supabase Storage (modo nube).
// Los logos van a un bucket público; guardamos solo la URL, no el archivo.

import { getSupabase } from "./supabase";
import { newId } from "./slug";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_LOGOS = "logos";
const BUCKET_VIDEOS = "videos";

/** Límite de tamaño para vídeos subidos (debe coincidir con el del bucket). */
export const LIMITE_VIDEO_MB = 100;

/**
 * Ruta del archivo dentro del bucket: `<uuid del usuario>/<id>.<ext>`.
 * La primera carpeta es la identidad de quien sube, y las políticas de Storage
 * (0010_seguridad.sql) solo le dejan modificar o borrar lo que hay dentro de
 * ella. Sin esto, cualquier usuario registrado podría borrar los archivos de
 * cualquier academia.
 */
async function rutaPropia(
  supabase: SupabaseClient,
  file: File,
  extPorDefecto: string,
): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Inicia sesión para subir archivos.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || extPorDefecto;
  return `${data.user.id}/${newId()}.${ext}`;
}

/**
 * Sube una imagen de logo y devuelve su URL pública.
 * Lanza si Supabase no está configurado o si la subida falla.
 */
export async function subirLogo(file: File): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase no está configurado");

  const path = await rutaPropia(supabase, file, "png");

  const { error } = await supabase.storage
    .from(BUCKET_LOGOS)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_LOGOS).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Sube un archivo de vídeo y devuelve su URL pública.
 * Rechaza si supera el límite o si Supabase no está configurado.
 */
export async function subirVideo(file: File): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase no está configurado");
  if (file.size > LIMITE_VIDEO_MB * 1024 * 1024) {
    throw new Error(`El vídeo supera el límite de ${LIMITE_VIDEO_MB} MB`);
  }

  const path = await rutaPropia(supabase, file, "mp4");

  const { error } = await supabase.storage
    .from(BUCKET_VIDEOS)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_VIDEOS).getPublicUrl(path);
  return data.publicUrl;
}
