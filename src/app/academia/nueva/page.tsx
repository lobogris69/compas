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
  type Profesor,
} from "@/lib/types";

const EMOJIS = ["💃", "🕺", "🎶", "🔥", "✨", "🌹", "🎵", "👯"];

export default function NuevaAcademia() {
  const router = useRouter();
  const { crearAcademia, academiaPorSlug, crearClase } = useStore();

  // Identidad
  const [nombre, setNombre] = useState("");
  const [emoji, setEmoji] = useState("💃");
  const [color, setColor] = useState("#7c4dff");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  // Contacto
  const [ubicacion, setUbicacion] = useState("");
  const [telefono, setTelefono] = useState("");
  // Estilos
  const [estilos, setEstilos] = useState<string[]>(["Salsa", "Bachata"]);
  const [estiloNuevo, setEstiloNuevo] = useState("");
  // Profesores
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  // Primera clase
  const [claseNombre, setClaseNombre] = useState("Clase 1");
  const [claseNivel, setClaseNivel] = useState<Nivel>("medio");
  const [claseDia, setClaseDia] = useState(4);
  const [claseHora, setClaseHora] = useState("20:00");
  const [error, setError] = useState("");

  const slug = slugify(nombre);
  // Chips: estilos sugeridos + los personalizados ya añadidos.
  const chipsEstilos = Array.from(new Set([...ESTILOS_SUGERIDOS, ...estilos]));

  function toggleEstilo(e: string) {
    setEstilos((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  }

  function añadirEstilo() {
    const v = estiloNuevo.trim();
    if (!v) return;
    if (!estilos.includes(v)) setEstilos((prev) => [...prev, v]);
    setEstiloNuevo("");
  }

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function añadirProfesor() {
    setProfesores((prev) => [...prev, { nombre: "", estilos: [] }]);
  }
  function setProfNombre(i: number, nombre: string) {
    setProfesores((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, nombre } : p)),
    );
  }
  function toggleProfEstilo(i: number, est: string) {
    setProfesores((prev) =>
      prev.map((p, idx) =>
        idx === i
          ? {
              ...p,
              estilos: p.estilos.includes(est)
                ? p.estilos.filter((x) => x !== est)
                : [...p.estilos, est],
            }
          : p,
      ),
    );
  }
  function quitarProfesor(i: number) {
    setProfesores((prev) => prev.filter((_, idx) => idx !== i));
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
    const estilosFinal = estilos.length ? estilos : ["Salsa"];
    const academia = crearAcademia({
      slug,
      nombre: nombre.trim(),
      emoji,
      color,
      logoUrl,
      ubicacion: ubicacion.trim(),
      telefono: telefono.trim(),
      estilos: estilosFinal,
      profesores: profesores
        .filter((p) => p.nombre.trim())
        .map((p) => ({ nombre: p.nombre.trim(), estilos: p.estilos })),
      reglas: { ...REGLAS_POR_DEFECTO },
    });
    crearClase({
      academiaId: academia.id,
      nombre: claseNombre.trim() || "Clase 1",
      nivel: claseNivel,
      estilo: estilosFinal[0],
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
                Logo (opcional)
              </span>
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
                    Subir imagen
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onLogo}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl(null)}
                      className="text-sm text-rose-600 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                Si no subes logo, se usa el emoji.
              </p>
            </div>

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
          <h2 className="font-bold">2 · Contacto</h2>
          <div className="mt-3 space-y-3">
            <Input
              label="Ubicación"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Calle, barrio o ciudad"
            />
            <Input
              label="Teléfono de contacto"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="600 123 456"
            />
          </div>
        </Card>

        <Card>
          <h2 className="font-bold">3 · Estilos</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {chipsEstilos.map((e) => (
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
          <div className="mt-3 flex gap-2">
            <Input
              value={estiloNuevo}
              onChange={(e) => setEstiloNuevo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  añadirEstilo();
                }
              }}
              placeholder="Añade otro estilo (p. ej. Rumba)"
              className="flex-1"
            />
            <Button type="button" variant="secondary" onClick={añadirEstilo}>
              Añadir
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-bold">4 · Profesores</h2>
            <Button type="button" variant="secondary" onClick={añadirProfesor}>
              + Profesor
            </Button>
          </div>
          {profesores.length === 0 ? (
            <p className="mt-2 text-sm text-ink-500">
              Aún sin profesores. Añade los que imparten clase y marca sus
              estilos.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {profesores.map((p, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-ink-200 p-3 dark:border-ink-800"
                >
                  <div className="flex gap-2">
                    <Input
                      value={p.nombre}
                      onChange={(e) => setProfNombre(i, e.target.value)}
                      placeholder="Nombre del profe"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => quitarProfesor(i)}
                      className="px-2 text-sm text-rose-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                  {estilos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {estilos.map((est) => (
                        <button
                          key={est}
                          type="button"
                          onClick={() => toggleProfEstilo(i, est)}
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
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-bold">5 · Tu primera clase</h2>
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
