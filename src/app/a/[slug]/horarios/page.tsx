"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card, LinkButton } from "@/components/ui";
import { AcademiaAvatar } from "@/components/academia-avatar";
import { DIAS_SEMANA } from "@/lib/types";

// Página pública de la academia: su horario, para compartir en redes / web.
export default function Horarios() {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);

  const porDia = useMemo(() => {
    if (!academia) return [];
    const clases = store.clasesDe(academia.id);
    return DIAS_SEMANA.map((dia, i) => ({
      dia,
      clases: clases
        .filter((c) => c.diaSemana === i)
        .sort((a, b) => a.hora.localeCompare(b.hora)),
    })).filter((d) => d.clases.length > 0);
  }, [academia, store]);

  if (store.ready && !academia)
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
        <Card>
          <p className="text-3xl">🤔</p>
          <p className="mt-2 font-semibold">Academia no encontrada</p>
        </Card>
      </main>
    );

  if (!academia) return null;

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <div className="flex items-center gap-3">
        <AcademiaAvatar
          academia={academia}
          className="h-12 w-12 rounded-2xl text-2xl"
        />
        <div>
          <h1 className="text-xl font-extrabold">{academia.nombre}</h1>
          <p className="text-sm text-ink-500">{academia.estilos.join(" · ")}</p>
        </div>
      </div>

      {(academia.ubicacion ||
        academia.telefono ||
        (academia.profesores?.length ?? 0) > 0) && (
        <Card className="mt-5 space-y-2 text-sm">
          {academia.ubicacion && <p>📍 {academia.ubicacion}</p>}
          {academia.telefono && (
            <p>
              📞{" "}
              <a
                href={`tel:${academia.telefono.replace(/\s+/g, "")}`}
                className="text-brand-600 hover:underline"
              >
                {academia.telefono}
              </a>
            </p>
          )}
          {(academia.profesores?.length ?? 0) > 0 && (
            <div>
              <p className="font-semibold">Profesores</p>
              <ul className="mt-1 space-y-0.5 text-ink-600 dark:text-ink-300">
                {academia.profesores.map((p) => (
                  <li key={p.nombre}>
                    {p.nombre}
                    {p.estilos.length > 0 && (
                      <span className="text-ink-500">
                        {" "}
                        — {p.estilos.join(", ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <h2 className="mb-3 mt-7 text-lg font-bold">Horario de clases</h2>
      <div className="space-y-5">
        {porDia.map(({ dia, clases }) => (
          <div key={dia}>
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-500">
              {dia}
            </p>
            <div className="space-y-2">
              {clases.map((c) => (
                <Card key={c.id} className="flex items-center gap-4 py-3">
                  <span
                    className="rounded-lg px-2.5 py-1 text-sm font-bold text-white"
                    style={{ background: academia.color }}
                  >
                    {c.hora}
                  </span>
                  <div>
                    <p className="font-semibold">{c.nombre}</p>
                    <p className="text-xs text-ink-500">
                      {c.estilo} · nivel {c.nivel} · {c.sala}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
        {porDia.length === 0 && (
          <Card>
            <p className="text-sm text-ink-500">Aún no hay clases publicadas.</p>
          </Card>
        )}
      </div>

      <div className="mt-8 text-center">
        <LinkButton href={`/a/${slug}/unirse`}>Apuntarme a la academia</LinkButton>
      </div>
    </main>
  );
}
