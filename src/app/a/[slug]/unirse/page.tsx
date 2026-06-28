"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Card, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  NIVELES,
  type Nivel,
  type Rol,
  type Sexo,
  type Visibilidad,
} from "@/lib/types";

export default function Unirse() {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);

  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<Rol>("follower");
  const [nivel, setNivel] = useState<Nivel>("principiante");
  const [sexo, setSexo] = useState<Sexo>("nd");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [visibilidad, setVisibilidad] = useState<Visibilidad>("academia");
  const [hecho, setHecho] = useState(false);
  const [error, setError] = useState("");

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

  function registrar() {
    if (!academia) return;
    if (!nombre.trim()) {
      setError("Pon tu nombre.");
      return;
    }
    const alumno = store.crearAlumno({
      academiaId: academia.id,
      nombre: nombre.trim(),
      rol,
      nivel,
      sexo,
      estilos: academia.estilos,
      fotoUrl: null,
      bio: bio.trim(),
      bailandoDesde: null,
      instagram: instagram.trim() || null,
      visibilidad,
    });
    store.identificarme(academia.id, alumno.id);
    setHecho(true);
  }

  if (hecho && academia) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
        <Card>
          <p className="text-4xl">🎉</p>
          <h1 className="mt-2 text-xl font-bold">¡Bienvenido/a!</h1>
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
            Ya formas parte de {academia.nombre}. La academia te avisará cuando
            haya clase o cuando hagan falta refuerzos de tu rol.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href={`/a/${slug}`}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Ver mis clases
            </Link>
            <Link
              href={`/a/${slug}/alumnos`}
              className="text-sm text-brand-600 underline"
            >
              Ver la comunidad
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  const roles: { v: Rol; label: string; desc: string }[] = [
    { v: "leader", label: "Leader", desc: "Llevo / guío" },
    { v: "follower", label: "Follower", desc: "Sigo" },
    { v: "ambos", label: "Ambos", desc: "Los dos roles" },
  ];

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <div className="mb-5 flex items-center gap-3">
        <div
          className="grid h-11 w-11 place-items-center rounded-2xl text-xl"
          style={{ background: `${academia?.color ?? "#7c4dff"}22` }}
        >
          {academia?.emoji ?? "💃"}
        </div>
        <div>
          <h1 className="text-lg font-extrabold">{academia?.nombre}</h1>
          <p className="text-sm text-ink-500">Únete a la academia</p>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          label="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Lucía"
        />

        <div>
          <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-300">
            ¿Cómo bailas?
          </span>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                key={r.v}
                type="button"
                onClick={() => setRol(r.v)}
                className={cn(
                  "rounded-xl border px-2 py-3 text-center",
                  rol === r.v
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                    : "border-ink-200 dark:border-ink-700",
                )}
              >
                <span className="block font-bold">{r.label}</span>
                <span className="block text-xs text-ink-500">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Select
          label="Tu nivel"
          value={nivel}
          onChange={(e) => setNivel(e.target.value as Nivel)}
        >
          {NIVELES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>

        <details className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
          <summary className="cursor-pointer text-sm font-semibold">
            Perfil (opcional)
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-xs text-ink-500">
              Para que tus compañeros sepan quién eres. Tú decides qué se ve.
            </p>
            <Select
              label="Sexo (opcional)"
              value={sexo}
              onChange={(e) => setSexo(e.target.value as Sexo)}
            >
              <option value="nd">Prefiero no decirlo</option>
              <option value="mujer">Mujer</option>
              <option value="hombre">Hombre</option>
              <option value="otro">Otro</option>
            </Select>
            <Input
              label="Instagram (opcional)"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@usuario"
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-300">
                Sobre ti (opcional)
              </span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950"
                placeholder="Bailando salsa desde 2022 ✨"
              />
            </label>
            <Select
              label="¿Quién puede ver tu perfil?"
              value={visibilidad}
              onChange={(e) => setVisibilidad(e.target.value as Visibilidad)}
            >
              <option value="academia">Toda la academia</option>
              <option value="clase">Solo mis compañeros de clase</option>
              <option value="privado">Solo yo (privado)</option>
            </Select>
          </div>
        </details>

        {error && (
          <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
            {error}
          </p>
        )}

        <Button onClick={registrar} className="w-full py-3 text-base">
          Unirme
        </Button>
      </div>
    </main>
  );
}
