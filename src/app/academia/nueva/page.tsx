"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Card, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { slugify } from "@/lib/slug";
import {
  DIAS_SEMANA,
  ESTILOS_SUGERIDOS,
  NIVELES,
  REGLAS_POR_DEFECTO,
  type Nivel,
} from "@/lib/types";

const EMOJIS = ["💃", "🕺", "🎶", "🔥", "✨", "🌹", "🎵", "👯"];

export default function NuevaAcademia() {
  const router = useRouter();
  const { crearAcademia, academiaPorSlug, crearClase } = useStore();

  const [nombre, setNombre] = useState("");
  const [emoji, setEmoji] = useState("💃");
  const [color, setColor] = useState("#7c4dff");
  const [estilos, setEstilos] = useState<string[]>(["Salsa", "Bachata"]);
  // Primera clase
  const [claseNombre, setClaseNombre] = useState("Clase 1");
  const [claseNivel, setClaseNivel] = useState<Nivel>("medio");
  const [claseDia, setClaseDia] = useState(4);
  const [claseHora, setClaseHora] = useState("20:00");
  const [error, setError] = useState("");

  const slug = slugify(nombre);

  function toggleEstilo(e: string) {
    setEstilos((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  }

  function crear() {
    if (!nombre.trim()) {
      setError("Pon un nombre a tu academia.");
      return;
    }
    if (academiaPorSlug(slug)) {
      setError("Ya existe una academia con ese nombre. Prueba otro.");
      return;
    }
    const academia = crearAcademia({
      slug,
      nombre: nombre.trim(),
      emoji,
      color,
      estilos: estilos.length ? estilos : ["Salsa"],
      reglas: { ...REGLAS_POR_DEFECTO },
    });
    crearClase({
      academiaId: academia.id,
      nombre: claseNombre.trim() || "Clase 1",
      nivel: claseNivel,
      estilo: estilos[0] ?? "Salsa",
      diaSemana: claseDia,
      hora: claseHora,
      sala: "Sala A",
      aforo: 24,
    });
    router.push(`/a/${academia.slug}/panel`);
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <h1 className="text-2xl font-extrabold">Crea tu academia</h1>
      <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
        En un minuto tienes tu espacio con tu marca. Podrás cambiarlo todo
        luego.
      </p>

      <div className="mt-6 space-y-5">
        <Card>
          <h2 className="font-bold">1 · Identidad</h2>
          <div className="mt-3 space-y-3">
            <Input
              label="Nombre de la academia"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Salsa Studio Madrid"
            />
            {slug && (
              <p className="text-xs text-ink-500">
                Tu enlace será: <b>/a/{slug}</b>
              </p>
            )}
            <div>
              <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-300">
                Emoji
              </span>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={cn(
                      "h-10 w-10 rounded-xl text-xl",
                      emoji === e
                        ? "bg-brand-600"
                        : "bg-ink-100 dark:bg-ink-800",
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-300">
                Color de marca
              </span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 cursor-pointer rounded-lg border border-ink-300 dark:border-ink-700"
              />
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="font-bold">2 · Estilos</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ESTILOS_SUGERIDOS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => toggleEstilo(e)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold",
                  estilos.includes(e)
                    ? "bg-brand-600 text-white"
                    : "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-bold">3 · Tu primera clase</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input
              label="Nombre"
              value={claseNombre}
              onChange={(e) => setClaseNombre(e.target.value)}
            />
            <Select
              label="Nivel"
              value={claseNivel}
              onChange={(e) => setClaseNivel(e.target.value as Nivel)}
            >
              {NIVELES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <Select
              label="Día"
              value={claseDia}
              onChange={(e) => setClaseDia(Number(e.target.value))}
            >
              {DIAS_SEMANA.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </Select>
            <Input
              label="Hora"
              type="time"
              value={claseHora}
              onChange={(e) => setClaseHora(e.target.value)}
            />
          </div>
        </Card>

        {error && (
          <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
            {error}
          </p>
        )}

        <Button onClick={crear} className="w-full py-3 text-base">
          Crear academia
        </Button>
      </div>
    </main>
  );
}
