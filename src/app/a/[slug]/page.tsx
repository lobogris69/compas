"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { calcularBalance, estiloEstado } from "@/lib/balance";
import { proximaFecha } from "@/lib/demo";
import { BalanceBar, Button, Card, LinkButton, RolBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DIAS_SEMANA } from "@/lib/types";

export default function HomeAlumno() {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);
  const yoId = academia ? store.yoEn(academia.id) : null;
  const yo = academia
    ? store.alumnosDe(academia.id).find((a) => a.id === yoId)
    : undefined;

  const clases = academia ? store.clasesDe(academia.id) : [];
  const alumnos = academia ? store.alumnosDe(academia.id) : [];

  const sesiones = useMemo(() => {
    if (!academia) return [];
    return clases.map((c) => {
      const fecha = proximaFecha(c.diaSemana);
      const asis = store.asistenciasDe(c.id, fecha);
      const miRespuesta = yoId
        ? asis.find((a) => a.alumnoId === yoId)?.estado ?? null
        : null;
      const asistentes = asis
        .filter((a) => a.estado === "si")
        .map((a) => alumnos.find((al) => al.id === a.alumnoId))
        .filter(Boolean)
        .map((al) => ({ rol: al!.rol }));
      const balance = calcularBalance(asistentes, academia.reglas.tolerancia);
      return { clase: c, fecha, miRespuesta, balance };
    });
  }, [academia, clases, alumnos, yoId, store]);

  if (!store.ready)
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </main>
    );

  if (!academia)
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
        <Card>
          <p className="text-3xl">🤔</p>
          <p className="mt-2 font-semibold">Academia no encontrada</p>
        </Card>
      </main>
    );

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <div className="flex items-center gap-3">
        <div
          className="grid h-11 w-11 place-items-center rounded-2xl text-xl"
          style={{ background: `${academia.color}22` }}
        >
          {academia.emoji}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold">{academia.nombre}</h1>
          {yo ? (
            <p className="flex items-center gap-2 text-sm text-ink-500">
              Hola, {yo.nombre} <RolBadge rol={yo.rol} />
            </p>
          ) : (
            <p className="text-sm text-ink-500">Próximas clases</p>
          )}
        </div>
        <Link
          href={`/a/${slug}/alumnos`}
          className="text-sm font-semibold text-brand-600"
        >
          Comunidad
        </Link>
      </div>

      {!yo && (
        <Card className="mt-5 border-brand-200 bg-brand-50 dark:bg-brand-900/20">
          <p className="font-semibold">¿Eres alumno/a de esta academia?</p>
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
            Únete para confirmar tu asistencia y que las clases salgan
            cuadradas.
          </p>
          <LinkButton href={`/a/${slug}/unirse`} className="mt-3">
            Unirme
          </LinkButton>
        </Card>
      )}

      <h2 className="mb-3 mt-7 text-lg font-bold">Próximas clases</h2>
      <div className="space-y-3">
        {sesiones.map(({ clase, fecha, miRespuesta, balance }) => {
          const est = estiloEstado(balance.estado);
          return (
            <Card key={clase.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{clase.nombre}</p>
                  <p className="text-sm text-ink-500">
                    {DIAS_SEMANA[clase.diaSemana]} · {clase.hora} · {clase.estilo}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${est.clase}`}
                >
                  {est.emoji}
                </span>
              </div>

              <div className="mt-3">
                <BalanceBar
                  leaders={balance.leaders}
                  followers={balance.followers}
                />
                <p className="mt-1.5 text-xs text-ink-500">
                  {balance.leaders} leaders · {balance.followers} followers
                  {balance.faltan &&
                    ` · faltan ${balance.faltan.cantidad} ${
                      balance.faltan.rol === "leader" ? "leaders" : "followers"
                    }`}
                </p>
              </div>

              {yo ? (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-ink-500">¿Vienes?</span>
                  <RsvpBtn
                    activo={miRespuesta === "si"}
                    onClick={() =>
                      store.responder({
                        academiaId: academia.id,
                        claseId: clase.id,
                        alumnoId: yo.id,
                        fecha,
                        estado: "si",
                      })
                    }
                    tono="si"
                  >
                    Sí
                  </RsvpBtn>
                  <RsvpBtn
                    activo={miRespuesta === "no"}
                    onClick={() =>
                      store.responder({
                        academiaId: academia.id,
                        claseId: clase.id,
                        alumnoId: yo.id,
                        fecha,
                        estado: "no",
                      })
                    }
                    tono="no"
                  >
                    No
                  </RsvpBtn>
                  <Link
                    href={`/a/${slug}/clase/${clase.id}`}
                    className="ml-auto text-sm font-semibold text-brand-600"
                  >
                    Ver clase →
                  </Link>
                </div>
              ) : (
                <Link
                  href={`/a/${slug}/clase/${clase.id}`}
                  className="mt-3 inline-block text-sm font-semibold text-brand-600"
                >
                  Ver clase →
                </Link>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
}

function RsvpBtn({
  activo,
  tono,
  onClick,
  children,
}: {
  activo: boolean;
  tono: "si" | "no";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-1.5 text-sm font-semibold transition",
        activo && tono === "si" && "bg-emerald-600 text-white",
        activo && tono === "no" && "bg-rose-600 text-white",
        !activo && "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
      )}
    >
      {children}
    </button>
  );
}
