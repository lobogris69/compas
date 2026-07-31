import Link from "next/link";
import { Card, BalanceBar } from "@/components/ui";
import { estiloEstado, type BalanceResult } from "@/lib/balance";
import type { Prevision } from "@/lib/prediccion";

// Marcador súper-visual del estado de una clase: matriculados, confirmados,
// leaders/followers y equilibrio de un vistazo. Con acceso a refuerzos si falta.
export function MarcadorClase({
  nombre,
  subtitulo,
  matriculados,
  confirmados,
  balance,
  prevision,
  diaClase,
  hrefDetalle,
}: {
  nombre: string;
  subtitulo: string;
  matriculados: number;
  confirmados: number;
  balance: BalanceResult;
  prevision?: Prevision | null;
  diaClase?: string;
  hrefDetalle: string;
}) {
  // El semáforo refleja cómo va a ACABAR la clase, no cómo va ahora: con 0
  // confirmados el recuento saldría verde aunque la previsión avise de que
  // faltarán followers, y la tarjeta se contradeciría a sí misma.
  const mandan = prevision ?? balance;
  const est = estiloEstado(mandan.estado);
  const faltan = mandan.faltan;
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-extrabold">{nombre}</h3>
          <p className="text-sm text-ink-500">{subtitulo}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${est.clase}`}
        >
          {est.emoji} {est.label}
        </span>
      </div>

      {/* Matriculados vs confirmados */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-ink-100 p-3 text-center dark:bg-ink-800">
          <p className="text-3xl font-extrabold">{matriculados}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Matriculados
          </p>
        </div>
        <div className="rounded-2xl bg-ink-100 p-3 text-center dark:bg-ink-800">
          <p className="text-3xl font-extrabold">
            {confirmados}
            {matriculados > 0 && (
              <span className="text-base font-semibold text-ink-400">
                /{matriculados}
              </span>
            )}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Confirmados
          </p>
        </div>
      </div>

      {/* Leaders vs followers */}
      <div>
        <div className="flex items-end justify-between">
          <div className="text-center">
            <p className="text-4xl font-extrabold text-leader">
              {balance.leaders}
            </p>
            <p className="text-xs font-semibold text-leader">🔵 LEADERS</p>
          </div>
          <div className="pb-1 text-center text-ink-400">
            <p className="text-sm">{balance.total} en pareja</p>
            {balance.ambos > 0 && (
              <p className="text-xs">({balance.ambos} flexibles)</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-4xl font-extrabold text-follower">
              {balance.followers}
            </p>
            <p className="text-xs font-semibold text-follower">FOLLOWERS 🩷</p>
          </div>
        </div>
        <div className="mt-2">
          <BalanceBar leaders={balance.leaders} followers={balance.followers} />
        </div>
      </div>

      {/* Previsión: lo que de verdad va a pasar, antes de que pase. */}
      {prevision && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-900 dark:bg-brand-950/30">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
              🔮 Previsión {diaClase ? `del ${diaClase.toLowerCase()}` : ""}
            </p>
            <p className="text-xs text-ink-500">
              {prevision.confianza === "baja"
                ? "pocos datos aún"
                : prevision.confianza === "media"
                  ? "fiabilidad media"
                  : "fiabilidad alta"}
            </p>
          </div>
          <p className="mt-1 text-sm">
            Vendrán unos <b>{prevision.total}</b> ·{" "}
            <span className="font-semibold text-leader">
              {prevision.leaders} leaders
            </span>{" "}
            ·{" "}
            <span className="font-semibold text-follower">
              {prevision.followers} followers
            </span>
          </p>
          {prevision.faltan ? (
            <p className="mt-1 text-sm font-medium text-amber-800 dark:text-amber-300">
              Si nadie más se apunta, te faltarán{" "}
              <b>{prevision.faltan.cantidad}</b>{" "}
              {prevision.faltan.rol === "leader" ? "leaders" : "followers"}.
            </p>
          ) : (
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
              Debería quedar equilibrada.
            </p>
          )}
        </div>
      )}

      {faltan ? (
        <Link
          href={hrefDetalle}
          className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300"
        >
          <span>
            {prevision ? "Adelántate" : "Faltan"}{" "}
            {prevision ? (
              <>y avisa a {faltan.cantidad}{" "}
                {faltan.rol === "leader" ? "leaders" : "followers"}</>
            ) : (
              <>
                <b>{faltan.cantidad}</b>{" "}
                {faltan.rol === "leader" ? "leaders" : "followers"} para cuadrar
              </>
            )}
          </span>
          <span className="shrink-0 font-semibold">📣 Buscar refuerzos →</span>
        </Link>
      ) : (
        <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          Clase equilibrada ✨
        </p>
      )}
    </Card>
  );
}
