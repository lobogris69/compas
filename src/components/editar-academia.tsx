"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { subirLogo } from "@/lib/storage";
import { Button, Card, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ESTILOS_SUGERIDOS, type Academia, type Profesor } from "@/lib/types";

const EMOJIS = ["💃", "🕺", "🎶", "🔥", "✨", "🌹", "🎵", "👯"];

// Editar los datos de la academia después del alta. Hasta ahora quedaban
// congelados desde que se creaba, y son justo los que se publican en la página
// pública de horarios: un nombre mal escrito era permanente.
export function EditarAcademia({ academia }: { academia: Academia }) {
  const store = useStore();
  const [nombre, setNombre] = useState(academia.nombre);
  const [emoji, setEmoji] = useState(academia.emoji);
  const [color, setColor] = useState(academia.color);
  const [ubicacion, setUbicacion] = useState(academia.ubicacion);
  const [telefono, setTelefono] = useState(academia.telefono);
  const [estilos, setEstilos] = useState<string[]>(academia.estilos);
  const [estiloNuevo, setEstiloNuevo] = useState("");
  const [profesores, setProfesores] = useState<Profesor[]>(academia.profesores);
  const [logoUrl, setLogoUrl] = useState(academia.logoUrl);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  const chips = Array.from(new Set([...ESTILOS_SUGERIDOS, ...estilos]));

  function toggleEstilo(e: string) {
    setEstilos((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
    setGuardado(false);
  }

  function añadirEstilo() {
    const v = estiloNuevo.trim();
    if (v && !estilos.includes(v)) setEstilos((p) => [...p, v]);
    setEstiloNuevo("");
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (store.mode === "supabase") {
      setGuardando(true);
      try {
        setLogoUrl(await subirLogo(file));
      } catch (err) {
        setError(
          "No se pudo subir el logo. " +
            (err instanceof Error ? err.message : ""),
        );
      }
      setGuardando(false);
    } else {
      const reader = new FileReader();
      reader.onload = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
    setGuardado(false);
  }

  function guardar() {
    if (!nombre.trim()) {
      setError("La academia necesita un nombre.");
      return;
    }
    setError("");
    store.actualizarAcademia(academia.id, {
      nombre: nombre.trim(),
      emoji,
      color,
      logoUrl,
      ubicacion: ubicacion.trim(),
      telefono: telefono.trim(),
      estilos: estilos.length ? estilos : ["Salsa"],
      profesores: profesores
        .filter((p) => p.nombre.trim())
        .map((p) => ({ nombre: p.nombre.trim(), estilos: p.estilos })),
    });
    setGuardado(true);
  }

  return (
    <Card className="mt-5">
      <h2 className="font-bold">Datos de la academia</h2>
      <p className="mt-1 text-sm text-ink-500">
        Lo que ven tus alumnos en la página pública de horarios.
      </p>

      <div className="mt-4 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl text-2xl"
            style={{ background: `${color}22` }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              emoji
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-xl bg-ink-100 px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-200">
              Cambiar logo
              <input
                type="file"
                accept="image/*"
                onChange={onLogo}
                className="hidden"
              />
            </label>
            {logoUrl && (
              <button
                onClick={() => {
                  setLogoUrl(null);
                  setGuardado(false);
                }}
                className="text-sm text-rose-600 hover:underline"
              >
                Quitar
              </button>
            )}
          </div>
        </div>

        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setGuardado(false);
          }}
        />
        <p className="-mt-2 text-xs text-ink-500">
          Tu dirección pública seguirá siendo <b>/a/{academia.slug}</b>: no
          cambia al renombrar, para no romper los QR y enlaces que ya hayas
          repartido.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Ubicación"
            value={ubicacion}
            onChange={(e) => {
              setUbicacion(e.target.value);
              setGuardado(false);
            }}
            placeholder="Calle, barrio o ciudad"
          />
          <Input
            label="Teléfono de contacto"
            type="tel"
            value={telefono}
            onChange={(e) => {
              setTelefono(e.target.value);
              setGuardado(false);
            }}
            placeholder="600 123 456"
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-300">
            Emoji y color
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  setEmoji(e);
                  setGuardado(false);
                }}
                className={cn(
                  "h-10 w-10 rounded-xl text-xl",
                  emoji === e ? "bg-brand-600" : "bg-ink-100 dark:bg-ink-800",
                )}
              >
                {e}
              </button>
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setGuardado(false);
              }}
              className="h-10 w-16 cursor-pointer rounded-lg border border-ink-300 dark:border-ink-700"
            />
          </div>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-300">
            Estilos
          </span>
          <div className="flex flex-wrap gap-2">
            {chips.map((e) => (
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
          <div className="mt-2 flex gap-2">
            <Input
              value={estiloNuevo}
              onChange={(e) => setEstiloNuevo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  añadirEstilo();
                }
              }}
              placeholder="Añade otro estilo"
              className="flex-1"
            />
            <Button type="button" variant="secondary" onClick={añadirEstilo}>
              Añadir
            </Button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-700 dark:text-ink-300">
              Profesores (los que se publican)
            </span>
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-1.5"
              onClick={() => {
                setProfesores((p) => [...p, { nombre: "", estilos: [] }]);
                setGuardado(false);
              }}
            >
              + Profesor
            </Button>
          </div>
          <div className="space-y-2">
            {profesores.map((p, i) => (
              <div
                key={i}
                className="rounded-xl border border-ink-200 p-3 dark:border-ink-800"
              >
                <div className="flex gap-2">
                  <Input
                    value={p.nombre}
                    onChange={(e) => {
                      const v = e.target.value;
                      setProfesores((prev) =>
                        prev.map((x, idx) =>
                          idx === i ? { ...x, nombre: v } : x,
                        ),
                      );
                      setGuardado(false);
                    }}
                    placeholder="Nombre del profe"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProfesores((prev) => prev.filter((_, x) => x !== i));
                      setGuardado(false);
                    }}
                    className="px-2 text-sm text-rose-600 hover:underline"
                  >
                    Quitar
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {estilos.map((est) => (
                    <button
                      key={est}
                      type="button"
                      onClick={() => {
                        setProfesores((prev) =>
                          prev.map((x, idx) =>
                            idx === i
                              ? {
                                  ...x,
                                  estilos: x.estilos.includes(est)
                                    ? x.estilos.filter((y) => y !== est)
                                    : [...x.estilos, est],
                                }
                              : x,
                          ),
                        );
                        setGuardado(false);
                      }}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        p.estilos.includes(est)
                          ? "bg-brand-600 text-white"
                          : "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
                      )}
                    >
                      {est}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {profesores.length === 0 && (
              <p className="text-sm text-ink-500">
                Aún sin profesores publicados.
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
            {error}
          </p>
        )}

        <Button onClick={guardar} disabled={guardando}>
          {guardando ? "Subiendo…" : guardado ? "✓ Guardado" : "Guardar datos"}
        </Button>
      </div>
    </Card>
  );
}
