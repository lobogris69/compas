"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { calcularBalance, estiloEstado } from "@/lib/balance";
import { proximaFecha } from "@/lib/demo";
import { BalanceBar, Card, LinkButton } from "@/components/ui";
import { DIAS_SEMANA } from "@/lib/types";

export default function PanelAcademia() {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);
  const [copiado, setCopiado] = useState(false);

  const enlaceAlumnos =
    typeof window !== "undefined"
      ? `${window.location.origin}/a/${slug}/unirse`
      : `/a/${slug}/unirse`;

  const clases = academia ? store.clasesDe(academia.id) : [];
  const alumnos = academia ? store.alumnosDe(academia.id) : [];

  const filas = useMemo(() => {
    if (!academia) return [];
    return clases.map((c) => {
      const fecha = proximaFecha(c.diaSemana);
      const asis = store
        .asistenciasDe(c.id, fecha)
        .filter((a) => a.estado === "si");
      const asistentes = asis
        .map((a) => alumnos.find((al) => al.id === a.alumnoId))
        .filter(Boolean)
        .map((al) => ({ rol: al!.rol }));
      const balance = calcularBalance(asistentes, academia.reglas.tolerancia);
      return { clase: c, fecha, balance };
    });
  }, [academia, clases, alumnos, store]);

  if (!store.ready) {
    return <Cargando />;
  }
  if (!academia) {
    return <NoEncontrada />;
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center gap-3">
        <div
          className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
          style={{ background: `${academia.color}22` }}
        >
          {academia.emoji}
        </div>
        <div>
          <h1 className="text-xl font-extrabold">{academia.nombre}</h1>
          <p className="text-sm text-ink-500">
            {alumnos.length} alumnos · {clases.length} clases
          </p>
        </div>
        <div className="ml-auto">
          <LinkButton href={`/a/${slug}/alumnos`} variant="secondary">
            Alumnos
          </LinkButton>
        </div>
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="rounded-xl bg-white p-2">
            <QRCodeCanvas value={enlaceAlumnos} size={96} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold">Invita a tus alumnos</h2>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
              Comparte este enlace o el QR. Se registran con su rol y nivel.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="truncate rounded-lg bg-ink-100 px-2 py-1 text-xs dark:bg-ink-800">
                {enlaceAlumnos}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(enlaceAlumnos);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 1500);
                }}
                className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white"
              >
                {copiado ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        </div>
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-bold">Próximas clases</h2>
      <div className="space-y-3">
        {filas.map(({ clase, fecha, balance }) => {
          const est = estiloEstado(balance.estado);
          return (
            <Link key={clase.id} href={`/a/${slug}/clase/${clase.id}`}>
              <Card className="transition hover:border-brand-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{clase.nombre}</p>
                    <p className="text-sm text-ink-500">
                      {DIAS_SEMANA[clase.diaSemana]} · {clase.hora} ·{" "}
                      {clase.estilo}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${est.clase}`}
                  >
                    {est.emoji} {est.label}
                  </span>
                </div>
                <div className="mt-3">
                  <BalanceBar
                    leaders={balance.leaders}
                    followers={balance.followers}
                  />
                  <div className="mt-1.5 flex justify-between text-xs font-medium">
                    <span className="text-leader">
                      {balance.leaders} leaders
                    </span>
                    {balance.faltan && (
                      <span className="text-ink-500">
                        faltan {balance.faltan.cantidad}{" "}
                        {balance.faltan.rol === "leader"
                          ? "leaders"
                          : "followers"}
                      </span>
                    )}
                    <span className="text-follower">
                      {balance.followers} followers
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
        {filas.length === 0 && (
          <Card>
            <p className="text-sm text-ink-500">
              Aún no hay clases. Crea una desde el asistente de alta.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}

function Cargando() {
  return (
    <main className="grid min-h-dvh place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
    </main>
  );
}

function NoEncontrada() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
      <Card>
        <p className="text-3xl">🤔</p>
        <p className="mt-2 font-semibold">Academia no encontrada</p>
        <Link href="/" className="mt-3 inline-block text-brand-600 underline">
          Volver al inicio
        </Link>
      </Card>
    </main>
  );
}
