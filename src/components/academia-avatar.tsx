import type { Academia } from "@/lib/types";
import { cn } from "@/lib/cn";

// Avatar de la academia: muestra el logo si lo hay; si no, el emoji sobre el
// color de marca. El tamaño y el text-size se pasan por className.
export function AcademiaAvatar({
  academia,
  className,
}: {
  academia: Pick<Academia, "logoUrl" | "emoji" | "color" | "nombre">;
  className?: string;
}) {
  if (academia.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={academia.logoUrl}
        alt={academia.nombre}
        className={cn("object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn("grid place-items-center", className)}
      style={{ background: `${academia.color}22` }}
    >
      {academia.emoji}
    </div>
  );
}
