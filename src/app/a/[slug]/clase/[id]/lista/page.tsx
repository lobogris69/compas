"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { proximaFecha } from "@/lib/demo";
import { Card, RolBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DIAS_SEMANA } from "@/lib/types";

// Pasar lista: quién vino de verdad. Es el dato que convierte el motor de
// "contar los que dicen que vienen" a "predecir quién va a venir".
export default function PasarLista() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);
  const clase = academia
    ? store.clasesDe(academia.id).find((c) => c.id === id)
    : undefined;
  const fecha = clase ? proximaFecha(clase.diaSemana) : "";

  const gente = useMemo(() => {
    if (!academia || !clase) return [];
    const matriculados = store.alumnosDeClase(clase.id);
    const asis = store.asistenciasDe(clase.id, fecha);
    // Matriculados + cualquiera que respondiera (refuerzos incluidos).
    const extra = asis
      .map((a) => store.alumnosDe(academia.id).find((al) => al.id === a.alumnoId))
      .filter(
        (al): al is NonNullable<typeof al> =>
          !!al && !matriculados.some((m) => m.id === al.id),
      );
    return [...matriculados, ...extra]
      .map((al) => {
        const a = asis.find((x) => x.alumnoId === al.id);
        return { alumno: al, dijo: a?.estado ?? null, asistio: a?.asistio ?? null };
      })
      .sort((x, y) => x.alumno.nombre.localeCompare(y.alumno.nombre));
  }, [academia, clase, fecha, store]);

  if (!store.ready) return null;
  if (!academia || !clase)
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
        <Card>
          <p className="text-3xl">🤔</p>
          <p className="mt-2 font-semibold">Clase no encontrada</p>
        </Card>
      </main>
    );

  if (!store.puedeGestionar(academia.id))
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
        <Card>
          <p className="text-3xl">🔒</p>
          <p className="mt-2 font-semibold">Solo el equipo de la academia</p>
          <Link
            href={`/a/${slug}/clase/${id}`}
            className="mt-3 inline-block text-brand-600 underline"
          >
            Volver a la clase
          </Link>
        </Card>
      </main>
    );

  const pasados = gente.filter((g) => g.asistio !== null).length;
  const vinieron = gente.filter((g) => g.asistio === true).length;

  return (
    <main className="mx-auto max-w-xl px-5 py-8">
      <Link
        href={`/a/${slug}/clase/${id}`}
        className="text-sm text-ink-500 hover:underline"
      >
        ← {clase.nombre}
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">Pasar lista</h1>
      <p className="text-sm text-ink-500">
        {DIAS_SEMANA[clase.diaSemana]} {fecha.split("-").reverse().join("/")} ·{" "}
        {clase.hora}
      </p>

      <Card className="mt-4 flex items-center justify-between py-3">
        <p className="text-sm text-ink-600 dark:text-ink-300">
          {pasados === 0
            ? "Aún no has marcado a nadie"
            : `${pasados} de ${gente.length} marcados`}
        </p>
        <p className="text-sm font-bold text-emerald-600">
          {vinieron} vinieron
        </p>
      </Card>

      <div className="mt-4 space-y-2">
        {gente.map(({ alumno, dijo, asistio }) => {
          const fiab = store.fiabilidadDe(alumno.id);
          return (
            <Card key={alumno.id} className="py-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{alumno.nombre}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
                    {dijo === "si" && <span>dijo que venía</span>}
                    {dijo === "no" && <span>dijo que no</span>}
                    {dijo === null && <span>no contestó</span>}
                    {fiab && (
                      <span>
                        · vino {fiab.vino} de {fiab.total}
                      </span>
                    )}
                  </p>
                </div>
                <RolBadge rol={alumno.rol} />
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() =>
                      store.marcarAsistencia(
                        academia.id,
                        clase.id,
                        alumno.id,
                        fecha,
                        true,
                      )
                    }
                    aria-label={`${alumno.nombre} vino`}
                    className={cn(
                      "h-10 w-10 rounded-xl text-lg font-bold transition",
                      asistio === true
                        ? "bg-emerald-600 text-white"
                        : "bg-ink-100 text-ink-500 hover:bg-emerald-100 dark:bg-ink-800",
                    )}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() =>
                      store.marcarAsistencia(
                        academia.id,
                        clase.id,
                        alumno.id,
                        fecha,
                        false,
                      )
                    }
                    aria-label={`${alumno.nombre} no vino`}
                    className={cn(
                      "h-10 w-10 rounded-xl text-lg font-bold transition",
                      asistio === false
                        ? "bg-rose-600 text-white"
                        : "bg-ink-100 text-ink-500 hover:bg-rose-100 dark:bg-ink-800",
                    )}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
        {gente.length === 0 && (
          <Card>
            <p className="text-sm text-ink-500">
              Nadie matriculado en esta clase todavía. Los alumnos eligen sus
              clases al apuntarse o desde su perfil.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
