import Link from "next/link";
import { Card, BalanceBar } from "@/components/ui";
import { estiloEstado, type BalanceResult } from "@/lib/balance";

// Marcador súper-visual del estado de una clase: matriculados, confirmados,
// leaders/followers y equilibrio de un vistazo. Con acceso a refuerzos si falta.
export function MarcadorClase({
  nombre,
  subtitulo,
  matriculados,
  confirmados,
  balance,
  hrefDetalle,
}: {
  nombre: string;
  subtitulo: string;
  matriculados: number;
  confirmados: number;
  balance: BalanceResult;
  hrefDetalle: string;
}) {
  const est = estiloEstado(balance.estado);
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

      {balance.faltan ? (
        <Link
          href={hrefDetalle}
          className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300"
        >
          <span>
            Faltan <b>{balance.faltan.cantidad}</b>{" "}
            {balance.faltan.rol === "leader" ? "leaders" : "followers"} para
            cuadrar
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
