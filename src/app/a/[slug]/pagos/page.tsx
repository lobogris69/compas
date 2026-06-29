"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Pago, PlanPago } from "@/lib/types";

const MESES_POR_TIPO: Record<string, number> = {
  mensual: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function fmt(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Estado de pago de un alumno a partir de sus pagos.
function estadoAlumno(pagos: Pago[]) {
  const hoy = hoyISO();
  const periodicosActivos = pagos.filter(
    (p) => p.tipo !== "bono" && p.cubreHasta && p.cubreHasta >= hoy,
  );
  if (periodicosActivos.length) {
    const hasta = periodicosActivos
      .map((p) => p.cubreHasta as string)
      .sort()
      .at(-1) as string;
    return { tipo: "aldia" as const, hasta };
  }
  if (pagos.some((p) => p.tipo === "bono")) {
    return { tipo: "bono" as const, hasta: null };
  }
  return { tipo: "pendiente" as const, hasta: null };
}

export default function Pagos() {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);
  const [abierto, setAbierto] = useState<string | null>(null);

  if (!store.ready) return null;
  if (!academia)
    return (
      <Centro>
        <p className="text-3xl">🤔</p>
        <p className="mt-2 font-semibold">Academia no encontrada</p>
      </Centro>
    );

  if (!store.puedeGestionar(academia.id))
    return (
      <Centro>
        <p className="text-3xl">🔒</p>
        <p className="mt-2 font-semibold">Solo el equipo de la academia</p>
        <Link
          href={`/a/${slug}`}
          className="mt-3 inline-block text-brand-600 underline"
        >
          Volver
        </Link>
      </Centro>
    );

  const alumnos = store
    .alumnosDe(academia.id)
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const planes = store.planesDe(academia.id);
  const pagos = store.pagosDe(academia.id);
  const pagosDe = (alumnoId: string) =>
    pagos
      .filter((p) => p.alumnoId === alumnoId)
      .sort((a, b) => b.fechaPago.localeCompare(a.fechaPago));

  const estados = alumnos.map((al) => estadoAlumno(pagosDe(al.id)));
  const nAlDia = estados.filter((e) => e.tipo === "aldia").length;
  const nBono = estados.filter((e) => e.tipo === "bono").length;
  const nPend = estados.filter((e) => e.tipo === "pendiente").length;

  function registrar(alumnoId: string, plan: PlanPago) {
    if (!academia) return;
    const hoy = new Date();
    const meses = MESES_POR_TIPO[plan.tipo];
    // Si ya está cubierto en el futuro, renueva desde el día siguiente.
    const prev = pagosDe(alumnoId)
      .filter((p) => p.cubreHasta)
      .map((p) => p.cubreHasta as string)
      .sort()
      .at(-1);
    let desde = hoy;
    if (meses && prev && prev >= hoyISO()) {
      desde = new Date(prev);
      desde.setDate(desde.getDate() + 1);
    }
    let cubreHasta: string | null = null;
    if (meses) {
      const fin = new Date(desde);
      fin.setMonth(fin.getMonth() + meses);
      fin.setDate(fin.getDate() - 1);
      cubreHasta = fin.toISOString().slice(0, 10);
    }
    store.registrarPago({
      academiaId: academia.id,
      alumnoId,
      planId: plan.id,
      concepto: plan.nombre,
      tipo: plan.tipo,
      importe: plan.importe,
      fechaPago: hoyISO(),
      cubreDesde: desde.toISOString().slice(0, 10),
      cubreHasta,
      clases: plan.tipo === "bono" ? plan.clases : null,
    });
    setAbierto(null);
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link
        href={`/a/${slug}/panel`}
        className="text-sm text-ink-500 hover:underline"
      >
        ← {academia.nombre}
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">Pagos</h1>

      {planes.length === 0 ? (
        <Card className="mt-5">
          <p className="text-sm text-ink-600 dark:text-ink-400">
            Primero define tus planes de pago en{" "}
            <Link
              href={`/a/${slug}/config`}
              className="font-semibold text-brand-600 underline"
            >
              Configuración
            </Link>
            .
          </p>
        </Card>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Resumen n={nAlDia} label="Al día" clase="text-emerald-600" />
            <Resumen n={nPend} label="Pendientes" clase="text-rose-600" />
            <Resumen n={nBono} label="Con bono" clase="text-brand-600" />
          </div>

          <div className="mt-5 space-y-2">
            {alumnos.map((al, i) => {
              const est = estados[i];
              const abiertoEste = abierto === al.id;
              const historial = pagosDe(al.id);
              return (
                <Card key={al.id} className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{al.nombre}</p>
                      <p className="text-xs">
                        {est.tipo === "aldia" ? (
                          <span className="text-emerald-600">
                            🟢 Al día hasta {fmt(est.hasta)}
                          </span>
                        ) : est.tipo === "bono" ? (
                          <span className="text-brand-600">🎟️ Bono activo</span>
                        ) : (
                          <span className="text-rose-600">🔴 Pendiente</span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5"
                      onClick={() =>
                        setAbierto(abiertoEste ? null : al.id)
                      }
                    >
                      {abiertoEste ? "Cerrar" : "Registrar pago"}
                    </Button>
                  </div>

                  {abiertoEste && (
                    <div className="mt-3 border-t border-ink-100 pt-3 dark:border-ink-800">
                      <p className="mb-2 text-xs font-semibold text-ink-500">
                        Cobrar un plan:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {planes.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => registrar(al.id, p)}
                            className="rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
                          >
                            {p.nombre} · {p.importe}€
                          </button>
                        ))}
                      </div>

                      {historial.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-1 text-xs font-semibold text-ink-500">
                            Historial
                          </p>
                          <ul className="space-y-1">
                            {historial.map((p) => (
                              <li
                                key={p.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="min-w-0 truncate text-ink-600 dark:text-ink-300">
                                  {fmt(p.fechaPago)} · {p.concepto} · {p.importe}
                                  €
                                  {p.cubreHasta
                                    ? ` (hasta ${fmt(p.cubreHasta)})`
                                    : p.tipo === "bono" && p.clases
                                      ? ` (${p.clases} clases)`
                                      : ""}
                                </span>
                                <button
                                  onClick={() => store.eliminarPago(p.id)}
                                  className="shrink-0 text-rose-600 hover:underline"
                                >
                                  borrar
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
            {alumnos.length === 0 && (
              <Card>
                <p className="text-sm text-ink-500">
                  Aún no hay alumnos en la academia.
                </p>
              </Card>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function Resumen({
  n,
  label,
  clase,
}: {
  n: number;
  label: string;
  clase: string;
}) {
  return (
    <Card className="text-center">
      <p className={cn("text-3xl font-extrabold", clase)}>{n}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </p>
    </Card>
  );
}

function Centro({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
      <Card>{children}</Card>
    </main>
  );
}
