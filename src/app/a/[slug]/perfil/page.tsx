"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Card, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  DIAS_SEMANA,
  NIVELES,
  type Nivel,
  type Rol,
  type Visibilidad,
} from "@/lib/types";

export default function MiPerfil() {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);
  const yoId = academia ? store.yoEn(academia.id) : null;
  const yo = academia
    ? store.alumnosDe(academia.id).find((a) => a.id === yoId)
    : undefined;
  const fileRef = useRef<HTMLInputElement>(null);
  const [guardado, setGuardado] = useState(false);

  if (!store.ready) return null;

  if (!academia || !yo)
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
        <Card>
          <p className="text-3xl">🙈</p>
          <p className="mt-2 font-semibold">Aún no te has unido</p>
          <Link
            href={`/a/${slug}/unirse`}
            className="mt-3 inline-block text-brand-600 underline"
          >
            Unirme a la academia
          </Link>
        </Card>
      </main>
    );

  function patch<K extends string>(campo: K, valor: unknown) {
    if (!yo) return;
    store.actualizarAlumno(yo.id, { [campo]: valor } as never);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 1200);
  }

  function onFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !yo) return;
    const reader = new FileReader();
    reader.onload = () => patch("fotoUrl", reader.result as string);
    reader.readAsDataURL(file);
  }

  const roles: Rol[] = ["leader", "follower", "ambos"];
  const todasClases = store.clasesDe(academia.id);
  const misClaseIds = new Set(store.clasesDeAlumno(yo.id).map((c) => c.id));

  function toggleMiClase(claseId: string) {
    if (!academia || !yo) return;
    if (misClaseIds.has(claseId)) {
      store.desmatricular(yo.id, claseId);
    } else {
      store.matricular(academia.id, yo.id, claseId);
    }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 1200);
  }

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <Link href={`/a/${slug}`} className="text-sm text-ink-500 hover:underline">
        ← {academia.nombre}
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">Mi perfil</h1>
      <p className="text-sm text-ink-500">
        Tú decides qué muestras a la comunidad.
      </p>

      <div className="mt-5 space-y-4">
        <Card className="flex items-center gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 text-xl font-bold text-brand-700 dark:bg-brand-900/40"
          >
            {yo.fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={yo.fotoUrl}
                alt={yo.nombre}
                className="h-full w-full object-cover"
              />
            ) : (
              yo.nombre.charAt(0).toUpperCase()
            )}
          </button>
          <div>
            <p className="font-bold">{yo.nombre}</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm text-brand-600"
            >
              Cambiar foto
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFoto}
            className="hidden"
          />
        </Card>

        <Card className="space-y-3">
          <div>
            <span className="mb-1 block text-sm font-medium">Rol</span>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => patch("rol", r)}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-sm font-semibold capitalize",
                    yo.rol === r
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                      : "border-ink-200 dark:border-ink-700",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <Select
            label="Nivel"
            value={yo.nivel}
            onChange={(e) => patch("nivel", e.target.value as Nivel)}
          >
            {NIVELES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>

          <Input
            label="Teléfono"
            type="tel"
            value={yo.telefono}
            onChange={(e) => patch("telefono", e.target.value)}
            placeholder="600 123 456"
          />

          <Input
            label="Instagram"
            value={yo.instagram ?? ""}
            onChange={(e) => patch("instagram", e.target.value || null)}
            placeholder="@usuario"
          />

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Sobre ti</span>
            <textarea
              value={yo.bio}
              onChange={(e) => patch("bio", e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950"
            />
          </label>

          <Select
            label="¿Quién puede ver mi perfil?"
            value={yo.visibilidad}
            onChange={(e) => patch("visibilidad", e.target.value as Visibilidad)}
          >
            <option value="academia">Toda la academia</option>
            <option value="clase">Solo mis compañeros de clase</option>
            <option value="privado">Solo yo (privado)</option>
          </Select>
        </Card>

        {todasClases.length > 0 && (
          <Card className="space-y-2">
            <div>
              <p className="font-bold">Mis clases</p>
              <p className="text-xs text-ink-500">
                Marca a las que vas. Puedes ir a varias.
              </p>
            </div>
            {todasClases.map((c) => {
              const sel = misClaseIds.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleMiClase(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left",
                    sel
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                      : "border-ink-200 dark:border-ink-700",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-md border text-xs text-white",
                      sel
                        ? "border-brand-600 bg-brand-600"
                        : "border-ink-300 dark:border-ink-600",
                    )}
                  >
                    {sel ? "✓" : ""}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {c.nombre}
                    </span>
                    <span className="block text-xs text-ink-500">
                      {DIAS_SEMANA[c.diaSemana]} · {c.hora} · {c.estilo}
                    </span>
                  </span>
                </button>
              );
            })}
          </Card>
        )}

        <p className="text-center text-sm text-emerald-600">
          {guardado ? "✓ Guardado" : " "}
        </p>
      </div>
    </main>
  );
}
