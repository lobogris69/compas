"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CATEGORIAS_VIDEO_SUGERIDAS, type Video } from "@/lib/types";

export default function Videoteca() {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);
  const esDueno = academia ? store.soyDueno(academia.id) : false;

  const [busqueda, setBusqueda] = useState("");
  const [cat, setCat] = useState<string>("todas");

  const videos = academia ? store.videosDe(academia.id) : [];
  const categorias = useMemo(
    () => Array.from(new Set(videos.map((v) => v.categoria))).sort(),
    [videos],
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return videos.filter((v) => {
      const okCat = cat === "todas" || v.categoria === cat;
      const okQ =
        !q ||
        v.titulo.toLowerCase().includes(q) ||
        v.descripcion.toLowerCase().includes(q) ||
        v.categoria.toLowerCase().includes(q);
      return okCat && okQ;
    });
  }, [videos, busqueda, cat]);

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
      <Link href={`/a/${slug}`} className="text-sm text-ink-500 hover:underline">
        ← {academia.nombre}
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">Videoteca 🎬</h1>
      <p className="text-sm text-ink-500">
        Clases, figuras y actuaciones para repasar cuando quieras.
      </p>

      {esDueno && <AltaVideo academiaId={academia.id} />}

      {/* Buscador */}
      <div className="mt-5">
        <Input
          placeholder="Busca por nombre… (p. ej. El Sombrero)"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Filtro de categorías */}
      <div className="mt-3 flex flex-wrap gap-2">
        {["todas", ...categorias].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-semibold capitalize",
              cat === c
                ? "bg-brand-600 text-white"
                : "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="mt-5 space-y-3">
        {filtrados.map((v) => (
          <VideoCard key={v.id} video={v} esDueno={esDueno} />
        ))}
        {filtrados.length === 0 && (
          <Card>
            <p className="text-sm text-ink-500">
              No hay vídeos que coincidan con la búsqueda.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}

function VideoCard({ video, esDueno }: { video: Video; esDueno: boolean }) {
  const store = useStore();
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(video.titulo);
  const [categoria, setCategoria] = useState(video.categoria);
  const [descripcion, setDescripcion] = useState(video.descripcion);

  if (editando) {
    return (
      <Card className="space-y-2">
        <Input
          label="Nombre del vídeo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <Input
          label="Categoría"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          list="cats"
        />
        <Input
          label="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <div className="flex gap-2 pt-1">
          <Button
            onClick={() => {
              store.actualizarVideo(video.id, {
                titulo: titulo.trim() || video.titulo,
                categoria: categoria.trim() || video.categoria,
                descripcion: descripcion.trim(),
              });
              setEditando(false);
            }}
          >
            Guardar
          </Button>
          <Button variant="secondary" onClick={() => setEditando(false)}>
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-bold">{video.titulo}</p>
            <Badge className="bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {video.categoria}
            </Badge>
          </div>
          {video.descripcion && (
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
              {video.descripcion}
            </p>
          )}
        </div>
        <span className="text-2xl">🎬</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
        >
          ▶ Ver
        </a>
        <a
          href={video.url}
          download
          className="rounded-lg bg-ink-100 px-3 py-1.5 text-sm font-semibold text-ink-700 dark:bg-ink-800 dark:text-ink-200"
        >
          ⬇ Descargar
        </a>
        {esDueno && (
          <>
            <button
              onClick={() => setEditando(true)}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              Renombrar
            </button>
            <button
              onClick={() => {
                if (confirm(`¿Eliminar "${video.titulo}"?`))
                  store.eliminarVideo(video.id);
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              Eliminar
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

function AltaVideo({ academiaId }: { academiaId: string }) {
  const store = useStore();
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("Figuras");
  const [url, setUrl] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [abierto, setAbierto] = useState(false);

  function anadir() {
    if (!titulo.trim() || !url.trim()) return;
    store.crearVideo({
      academiaId,
      titulo: titulo.trim(),
      categoria: categoria.trim() || "Sin categoría",
      url: url.trim(),
      descripcion: descripcion.trim(),
    });
    setTitulo("");
    setUrl("");
    setDescripcion("");
  }

  return (
    <Card className="mt-5 border-brand-200 bg-brand-50/60 dark:bg-brand-900/15">
      <datalist id="cats">
        {CATEGORIAS_VIDEO_SUGERIDAS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between font-bold"
      >
        <span>➕ Subir / añadir vídeo</span>
        <span className="text-ink-400">{abierto ? "−" : "+"}</span>
      </button>
      {abierto && (
        <div className="mt-3 space-y-2">
          <Input
            label="Nombre del vídeo"
            placeholder="El Sombrero"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              label="Categoría"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              list="cats"
            />
            <Input
              label="Enlace del vídeo (URL)"
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <Input
            label="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <p className="text-xs text-ink-500">
            En modo local los vídeos se añaden por enlace. La subida de archivo a
            almacenamiento llegará con el modo nube (ver SUPABASE.md).
          </p>
          <Button onClick={anadir} className="mt-1">
            Añadir a la videoteca
          </Button>
        </div>
      )}
    </Card>
  );
}
