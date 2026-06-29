"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { esAdminPlataforma, type AdminAcademiaResumen } from "@/lib/admin";
import * as remote from "@/lib/remote";
import { Card } from "@/components/ui";

// Panel de plataforma (solo el fundador, por su email): todas las academias.
export default function Admin() {
  const auth = useAuth();
  const [items, setItems] = useState<AdminAcademiaResumen[] | null>(null);
  const [error, setError] = useState("");
  const autorizado = auth.enabled && esAdminPlataforma(auth.user?.email);

  useEffect(() => {
    if (!autorizado) return;
    remote
      .adminListarAcademias()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [autorizado]);

  if (!auth.ready) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </main>
    );
  }
  if (!auth.enabled) {
    return (
      <Aviso
        emoji="💻"
        titulo="Solo en modo nube"
        texto="El panel de plataforma necesita Supabase configurado."
      />
    );
  }
  if (!auth.user) {
    return (
      <Aviso
        emoji="🔒"
        titulo="Entra con tu cuenta"
        link="/entrar"
        linkText="Ir a entrar"
      />
    );
  }
  if (!autorizado) {
    return (
      <Aviso
        emoji="⛔"
        titulo="No autorizado"
        texto="Esta zona es solo para el administrador de la plataforma."
        link="/"
        linkText="Volver al inicio"
      />
    );
  }

  const totalAlumnos = (items ?? []).reduce((s, a) => s + a.nAlumnos, 0);
  const totalClases = (items ?? []).reduce((s, a) => s + a.nClases, 0);

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🛡️</span>
        <div>
          <h1 className="text-2xl font-extrabold">Plataforma</h1>
          <p className="text-sm text-ink-500">
            Todas las academias de Compás · {auth.user.email}
          </p>
        </div>
      </div>

      {/* Métricas globales */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Metrica valor={items?.length ?? "…"} label="Academias" />
        <Metrica valor={items ? totalAlumnos : "…"} label="Alumnos" />
        <Metrica valor={items ? totalClases : "…"} label="Clases" />
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
          {error}
        </p>
      )}

      <h2 className="mb-3 mt-8 text-lg font-bold">Academias</h2>
      {!items ? (
        <p className="text-sm text-ink-500">Cargando…</p>
      ) : items.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">Aún no hay academias.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <Card key={a.id} className="flex items-center gap-3 py-3">
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl"
                style={{ background: `${a.color}22` }}
              >
                {a.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{a.nombre}</p>
                <p className="text-xs text-ink-500">
                  /a/{a.slug} · alta {a.createdAt.slice(0, 10)}
                </p>
              </div>
              <div className="hidden gap-4 text-center text-sm sm:flex">
                <Stat n={a.nAlumnos} label="alum." />
                <Stat n={a.nClases} label="clases" />
                <Stat n={a.nVideos} label="vídeos" />
              </div>
              <Link
                href={`/a/${a.slug}/panel`}
                className="shrink-0 rounded-xl bg-ink-100 px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-200"
              >
                Abrir
              </Link>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

function Metrica({ valor, label }: { valor: number | string; label: string }) {
  return (
    <Card className="text-center">
      <p className="text-3xl font-extrabold">{valor}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </p>
    </Card>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <p className="font-bold">{n}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}

function Aviso({
  emoji,
  titulo,
  texto,
  link,
  linkText,
}: {
  emoji: string;
  titulo: string;
  texto?: string;
  link?: string;
  linkText?: string;
}) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
      <Card>
        <p className="text-3xl">{emoji}</p>
        <p className="mt-2 font-semibold">{titulo}</p>
        {texto && <p className="mt-1 text-sm text-ink-500">{texto}</p>}
        {link && linkText && (
          <Link
            href={link}
            className="mt-3 inline-block text-brand-600 underline"
          >
            {linkText}
          </Link>
        )}
      </Card>
    </main>
  );
}
