"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { LinkButton, Card } from "@/components/ui";

export default function Landing() {
  const { db, ready } = useStore();
  const demo = db.academias[0];

  return (
    <main className="min-h-dvh bg-grid">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="text-lg font-extrabold tracking-tight">
          💃 Compás
        </span>
        <nav className="flex items-center gap-2">
          {ready && demo && (
            <Link
              href={`/a/${demo.slug}/panel`}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
            >
              Ver demo
            </Link>
          )}
          <LinkButton href="/academia/nueva">Crear mi academia</LinkButton>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-5 pt-16 text-center">
        <p className="mb-3 inline-block rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          Para academias de baile en pareja
        </p>
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
          Que ninguna clase se quede{" "}
          <span className="text-brand-600">descompensada</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-600 dark:text-ink-300">
          Compás equilibra <b className="text-leader">leaders</b> y{" "}
          <b className="text-follower">followers</b> en cada clase, y llama a
          refuerzos automáticamente cuando hace falta. Tu academia, lista en 10
          minutos.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <LinkButton href="/academia/nueva" className="px-6 py-3 text-base">
            Crear mi academia gratis
          </LinkButton>
          {ready && demo && (
            <LinkButton
              href={`/a/${demo.slug}/panel`}
              variant="secondary"
              className="px-6 py-3 text-base"
            >
              Ver una demo en vivo
            </LinkButton>
          )}
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-5xl gap-4 px-5 pb-24 sm:grid-cols-3">
        <Card>
          <div className="text-3xl">⚖️</div>
          <h3 className="mt-2 font-bold">Semáforo de balance</h3>
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
            Mira en vivo cómo va cada clase: verde, ámbar o rojo según el
            equilibrio leader/follower.
          </p>
        </Card>
        <Card>
          <div className="text-3xl">📣</div>
          <h3 className="mt-2 font-bold">Refuerzos automáticos</h3>
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
            Cuando falta gente de un rol, Compás sugiere a quién avisar para
            cuadrar la clase.
          </p>
        </Card>
        <Card>
          <div className="text-3xl">🪪</div>
          <h3 className="mt-2 font-bold">Comunidad con perfiles</h3>
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
            Los alumnos saben con quién bailan: foto, rol y nivel, siempre con
            privacidad opt-in.
          </p>
        </Card>
      </section>

      <footer className="border-t border-ink-200 py-8 text-center text-sm text-ink-500 dark:border-ink-800">
        Compás · proyecto nuevo en desarrollo · modo local (sin backend)
      </footer>
    </main>
  );
}
