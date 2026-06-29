// Administrador de la plataforma (el fundador). Identificado por su email.
// Solo esta persona ve /admin con todas las academias.

export const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ""
).toLowerCase();

/** ¿Es este email el del administrador de la plataforma? */
export function esAdminPlataforma(email?: string | null): boolean {
  return !!email && !!ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL;
}

/** Resumen de una academia para el panel de plataforma. */
export interface AdminAcademiaResumen {
  id: string;
  slug: string;
  nombre: string;
  emoji: string;
  color: string;
  createdAt: string;
  nAlumnos: number;
  nClases: number;
  nVideos: number;
}
