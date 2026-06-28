// Generación de avisos de refuerzo listos para enviar (p. ej. por WhatsApp).
// De momento produce el texto y un enlace wa.me; el envío automático (API de
// Meta o no oficial) se documenta en docs/academia-baile/03-whatsapp.md.

import type { Academia, Clase } from "./types";
import { DIAS_SEMANA } from "./types";

/** Mensaje grupal para pedir refuerzos de un rol en una clase concreta. */
export function mensajeRefuerzo(
  academia: Academia,
  clase: Clase,
  rolNecesario: "leader" | "follower",
  cantidad: number,
): string {
  const rolTxt = rolNecesario === "leader" ? "leaders" : "followers";
  const dia = DIAS_SEMANA[clase.diaSemana];
  return (
    `${academia.emoji} *${academia.nombre}*\n\n` +
    `¡Nos faltan *${cantidad} ${rolTxt}* para la clase de *${clase.nombre}*!\n` +
    `🗓️ ${dia} a las ${clase.hora}${clase.sala ? ` · ${clase.sala}` : ""}\n\n` +
    `Si puedes venir a echar una mano y bailar, responde a este mensaje 🙌\n` +
    `¡Gracias por hacer comunidad! 💃🕺`
  );
}

/** Mensaje directo a un alumno concreto para reforzar. */
export function mensajeRefuerzoDirecto(
  academia: Academia,
  clase: Clase,
  nombre: string,
  rolRefuerzo: "leader" | "follower",
): string {
  const dia = DIAS_SEMANA[clase.diaSemana];
  return (
    `¡Hola ${nombre}! 👋 Soy ${academia.nombre}.\n\n` +
    `Nos vendría genial que vinieras de *${rolRefuerzo}* a *${clase.nombre}* ` +
    `el ${dia} a las ${clase.hora}. ¿Te animas? 🙌`
  );
}

/** Enlace wa.me que abre WhatsApp con el texto ya escrito (elige contacto al vuelo). */
export function enlaceWhatsApp(texto: string, telefono?: string): string {
  const base = telefono
    ? `https://wa.me/${telefono.replace(/[^0-9]/g, "")}`
    : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(texto)}`;
}
