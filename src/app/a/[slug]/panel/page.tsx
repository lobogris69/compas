"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { calcularBalance, estiloEstado } from "@/lib/balance";
import { cn } from "@/lib/cn";
import { proximaFecha } from "@/lib/demo";
import { BalanceBar, Button, Card, Input, LinkButton } from "@/components/ui";
import { AcademiaAvatar } from "@/components/academia-avatar";
import { MarcadorClase } from "@/components/marcador-clase";
import { DIAS_SEMANA, type Academia } from "@/lib/types";

export default function PanelAcademia() {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);
  const [copiado, setCopiado] = useState(false);
  const [claseSelId, setClaseSelId] = useState<string | null>(null);

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
      const matriculados = store.alumnosDeClase(c.id).length;
      return { clase: c, fecha, balance, matriculados, confirmados: balance.total };
    });
  }, [academia, clases, alumnos, store]);

  if (!store.ready) {
    return <Cargando />;
  }
  if (!academia) {
    return <NoEncontrada />;
  }

  const selFila = filas.find((f) => f.clase.id === claseSelId) ?? filas[0];

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center gap-3">
        <AcademiaAvatar
          academia={academia}
          className="h-12 w-12 rounded-2xl text-2xl"
        />
        <div>
          <h1 className="text-xl font-extrabold">{academia.nombre}</h1>
          <p className="text-sm text-ink-500">
            {alumnos.length} alumnos · {clases.length} clases
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <LinkButton href={`/a/${slug}/videos`} variant="secondary">
            🎬 Vídeos
          </LinkButton>
          <LinkButton href={`/a/${slug}/alumnos`} variant="secondary">
            Alumnos
          </LinkButton>
          {store.soyDueno(academia.id) && (
            <LinkButton href={`/a/${slug}/config`} variant="ghost">
              Ajustes
            </LinkButton>
          )}
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
            <Link
              href={`/a/${slug}/horarios`}
              className="mt-2 inline-block text-xs font-semibold text-brand-600"
            >
              Ver horario público →
            </Link>
          </div>
        </div>
      </Card>

      {selFila && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Estado de tus clases</h2>
          {filas.length > 1 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {filas.map((f) => {
                const sel = f.clase.id === selFila.clase.id;
                const est = estiloEstado(f.balance.estado);
                return (
                  <button
                    key={f.clase.id}
                    onClick={() => setClaseSelId(f.clase.id)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold",
                      sel
                        ? "bg-brand-600 text-white"
                        : "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
                    )}
                  >
                    {est.emoji} {f.clase.nombre}
                  </button>
                );
              })}
            </div>
          )}
          <MarcadorClase
            nombre={selFila.clase.nombre}
            subtitulo={`${DIAS_SEMANA[selFila.clase.diaSemana]} · ${selFila.clase.hora} · ${selFila.clase.estilo} · nivel ${selFila.clase.nivel}`}
            matriculados={selFila.matriculados}
            confirmados={selFila.confirmados}
            balance={selFila.balance}
            hrefDetalle={`/a/${slug}/clase/${selFila.clase.id}`}
          />
        </section>
      )}

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

      {store.soyDueno(academia.id) && <ZonaPeligro academia={academia} />}
    </main>
  );
}

// Zona de peligro: borrar la academia y todos sus datos. Solo el dueño la ve.
// Pide escribir el nombre exacto para evitar borrados accidentales.
function ZonaPeligro({ academia }: { academia: Academia }) {
  const store = useStore();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [conf, setConf] = useState("");
  const puede = conf.trim() === academia.nombre.trim();

  function borrar() {
    if (!puede) return;
    store.eliminarAcademia(academia.id);
    router.push("/");
  }

  return (
    <Card className="mt-10 border-rose-300 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20">
      <h2 className="font-bold text-rose-700 dark:text-rose-300">
        Zona de peligro
      </h2>
      <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
        Borra esta academia y <b>todos</b> sus datos (clases, alumnos,
        asistencias y vídeos). No se puede deshacer.
      </p>
      {!abierto ? (
        <Button
          variant="danger"
          className="mt-3"
          onClick={() => setAbierto(true)}
        >
          Borrar esta academia
        </Button>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-sm">
            Para confirmar, escribe el nombre exacto:{" "}
            <b>{academia.nombre}</b>
          </p>
          <Input
            value={conf}
            onChange={(e) => setConf(e.target.value)}
            placeholder={academia.nombre}
          />
          <div className="flex gap-2">
            <Button variant="danger" disabled={!puede} onClick={borrar}>
              Borrar definitivamente
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setAbierto(false);
                setConf("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </Card>
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
