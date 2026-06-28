"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, RolBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ROLES, type Rol } from "@/lib/types";

export default function Comunidad() {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);
  const [filtro, setFiltro] = useState<Rol | "todos">("todos");

  const visibles = useMemo(() => {
    if (!academia) return [];
    return store
      .alumnosDe(academia.id)
      .filter((a) => a.visibilidad !== "privado")
      .filter((a) => filtro === "todos" || a.rol === filtro);
  }, [academia, filtro, store]);

  if (store.ready && !academia) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
        <Card>
          <p className="text-3xl">🤔</p>
          <p className="mt-2 font-semibold">Academia no encontrada</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link
        href={`/a/${slug}/panel`}
        className="text-sm text-ink-500 hover:underline"
      >
        ← {academia?.nombre}
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">La comunidad</h1>
      <p className="text-sm text-ink-500">
        Conoce con quién bailas. Cada quien decide qué muestra.
      </p>

      <div className="mt-4 flex gap-2">
        {(["todos", ...ROLES] as const).map((r) => (
          <button
            key={r}
            onClick={() => setFiltro(r)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-semibold capitalize",
              filtro === r
                ? "bg-brand-600 text-white"
                : "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {visibles.map((a) => (
          <Card key={a.id} className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 text-base font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {a.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-bold">{a.nombre}</p>
                <RolBadge rol={a.rol} />
              </div>
              <p className="text-xs text-ink-500">nivel {a.nivel}</p>
              {a.bio && (
                <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                  {a.bio}
                </p>
              )}
              {a.instagram && (
                <p className="mt-1 text-xs text-brand-600">{a.instagram}</p>
              )}
            </div>
          </Card>
        ))}
        {visibles.length === 0 && (
          <Card>
            <p className="text-sm text-ink-500">
              Todavía no hay perfiles públicos con ese filtro.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
