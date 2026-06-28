"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import {
  asignarRolesEfectivos,
  calcularBalance,
  estiloEstado,
  sugerirRefuerzos,
} from "@/lib/balance";
import { proximaFecha } from "@/lib/demo";
import { BalanceBar, Button, Card, RolBadge } from "@/components/ui";
import { DIAS_SEMANA } from "@/lib/types";

export default function DetalleClase() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);
  const clase = academia
    ? store.clasesDe(academia.id).find((c) => c.id === id)
    : undefined;

  const fecha = clase ? proximaFecha(clase.diaSemana) : "";
  const alumnos = academia ? store.alumnosDe(academia.id) : [];

  const datos = useMemo(() => {
    if (!academia || !clase) return null;
    const asis = store.asistenciasDe(clase.id, fecha);
    const vienenIds = asis.filter((a) => a.estado === "si").map((a) => a.alumnoId);
    const yaResponden = new Set(asis.map((a) => a.alumnoId));
    const asistentes = vienenIds
      .map((aid) => alumnos.find((al) => al.id === aid))
      .filter(Boolean) as (typeof alumnos);

    const balance = calcularBalance(
      asistentes.map((a) => ({ rol: a.rol })),
      academia.reglas.tolerancia,
    );
    const efectivos = asignarRolesEfectivos(
      asistentes.map((a) => ({ id: a.id, rol: a.rol })),
    );
    const refuerzos = sugerirRefuerzos(
      academia,
      alumnos,
      clase.nivel,
      balance,
      yaResponden,
    );
    return { asistentes, balance, efectivos, refuerzos };
  }, [academia, clase, alumnos, fecha, store]);

  if (!store.ready)
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </main>
    );

  if (!academia || !clase || !datos)
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
        <Card>
          <p className="text-3xl">🤔</p>
          <p className="mt-2 font-semibold">Clase no encontrada</p>
          <Link href={`/a/${slug}/panel`} className="mt-3 inline-block text-brand-600 underline">
            Volver al panel
          </Link>
        </Card>
      </main>
    );

  const { asistentes, balance, efectivos, refuerzos } = datos;
  const est = estiloEstado(balance.estado);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link
        href={`/a/${slug}/panel`}
        className="text-sm text-ink-500 hover:underline"
      >
        ← {academia.nombre}
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">{clase.nombre}</h1>
          <p className="text-sm text-ink-500">
            {DIAS_SEMANA[clase.diaSemana]} · {clase.hora} · {clase.sala} ·{" "}
            nivel {clase.nivel}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${est.clase}`}
        >
          {est.emoji} {est.label}
        </span>
      </div>

      <Card className="mt-5">
        <div className="flex items-end justify-between">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-leader">
              {balance.leaders}
            </p>
            <p className="text-xs font-semibold text-leader">LEADERS</p>
          </div>
          <div className="px-4 pb-1 text-center text-ink-400">
            <p className="text-sm">{balance.total} en pareja</p>
            {balance.ambos > 0 && (
              <p className="text-xs">({balance.ambos} flexibles repartidos)</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-follower">
              {balance.followers}
            </p>
            <p className="text-xs font-semibold text-follower">FOLLOWERS</p>
          </div>
        </div>
        <div className="mt-3">
          <BalanceBar leaders={balance.leaders} followers={balance.followers} />
        </div>
        {balance.faltan && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-center text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Faltan <b>{balance.faltan.cantidad}</b>{" "}
            {balance.faltan.rol === "leader" ? "leaders" : "followers"} para
            cuadrar la clase.
          </p>
        )}
      </Card>

      {/* Sugerencia de refuerzos */}
      {balance.faltan && refuerzos.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 font-bold">
            📣 Refuerzos sugeridos ({balance.faltan.rol === "leader"
              ? "leaders"
              : "followers"})
          </h2>
          <p className="mb-3 text-sm text-ink-500">
            Alumnos que pueden venir a equilibrar esta clase. Avísales para que
            confirmen.
          </p>
          <div className="space-y-2">
            {refuerzos.map(({ alumno }) => (
              <Card key={alumno.id} className="flex items-center gap-3 py-3">
                <Avatar nombre={alumno.nombre} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{alumno.nombre}</p>
                  <p className="text-xs text-ink-500">nivel {alumno.nivel}</p>
                </div>
                <RolBadge rol={alumno.rol} />
                <Button
                  variant="secondary"
                  onClick={() =>
                    store.responder({
                      academiaId: academia.id,
                      claseId: clase.id,
                      alumnoId: alumno.id,
                      fecha,
                      estado: "si",
                      esRefuerzo: true,
                    })
                  }
                >
                  Apuntar
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Quién viene */}
      <section className="mt-8">
        <h2 className="mb-2 font-bold">Quién viene ({asistentes.length})</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {asistentes.map((a) => {
            const efectivo = efectivos.get(a.id);
            return (
              <Card key={a.id} className="flex items-center gap-3 py-3">
                <Avatar nombre={a.nombre} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.nombre}</p>
                  <p className="text-xs text-ink-500">nivel {a.nivel}</p>
                </div>
                {a.rol === "ambos" && efectivo ? (
                  <span className="text-xs text-ink-400">
                    →{" "}
                    <span
                      className={
                        efectivo === "leader" ? "text-leader" : "text-follower"
                      }
                    >
                      {efectivo}
                    </span>
                  </span>
                ) : null}
                <RolBadge rol={a.rol} />
              </Card>
            );
          })}
          {asistentes.length === 0 && (
            <Card>
              <p className="text-sm text-ink-500">
                Nadie ha confirmado todavía para el {fecha}.
              </p>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}

function Avatar({ nombre }: { nombre: string }) {
  const inicial = nombre.charAt(0).toUpperCase();
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
      {inicial}
    </div>
  );
}
