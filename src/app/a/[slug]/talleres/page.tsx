"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { subirLogo } from "@/lib/storage";
import * as remote from "@/lib/remote";
import { Button, Card, Input, RolBadge, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import { AcademiaAvatar } from "@/components/academia-avatar";
import type {
  Academia,
  MetodoPago,
  PlazasTaller,
  Reserva,
  Rol,
  Taller,
} from "@/lib/types";

function fmtFecha(iso: string | null): string {
  if (!iso) return "fecha por confirmar";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function Talleres() {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);
  const puedeGestionar = academia ? store.puedeGestionar(academia.id) : false;

  if (!store.ready) return null;
  if (!academia)
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
        <Card>
          <p className="text-3xl">🤔</p>
          <p className="mt-2 font-semibold">Academia no encontrada</p>
        </Card>
      </main>
    );

  const talleres = store
    .talleresDe(academia.id)
    .filter((t) => puedeGestionar || t.activo)
    .sort((a, b) => (a.fecha ?? "9999").localeCompare(b.fecha ?? "9999"));

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <div className="flex items-center gap-3">
        <AcademiaAvatar
          academia={academia}
          className="h-12 w-12 rounded-2xl text-2xl"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold">Talleres</h1>
          <p className="text-sm text-ink-500">{academia.nombre}</p>
        </div>
        <Link
          href={`/a/${slug}/horarios`}
          className="shrink-0 text-sm text-brand-600 hover:underline"
        >
          Ver horarios →
        </Link>
      </div>

      {puedeGestionar && <NuevoTaller academia={academia} />}

      <div className="mt-6 space-y-4">
        {talleres.map((t) => (
          <TarjetaTaller
            key={t.id}
            taller={t}
            academia={academia}
            puedeGestionar={puedeGestionar}
          />
        ))}
        {talleres.length === 0 && (
          <Card>
            <p className="text-sm text-ink-500">
              {puedeGestionar
                ? "Aún no has publicado ningún taller. Crea uno arriba y comparte esta página."
                : "No hay talleres publicados ahora mismo."}
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}

// ───────────────────────── Un taller ─────────────────────────

function TarjetaTaller({
  taller,
  academia,
  puedeGestionar,
}: {
  taller: Taller;
  academia: Academia;
  puedeGestionar: boolean;
}) {
  const store = useStore();
  const [reservando, setReservando] = useState(false);
  const [verReservas, setVerReservas] = useState(false);
  const [ocupacion, setOcupacion] = useState<PlazasTaller | null>(null);

  const reservas = store
    .reservasDe(academia.id)
    .filter((r) => r.tallerId === taller.id && r.estado !== "cancelada");

  // Quien no es del equipo no recibe las reservas (llevan datos personales),
  // así que la ocupación se pide aparte: devuelve el recuento, nunca los
  // nombres. Sin esto, un visitante vería "quedan 10 de 10" en un taller lleno.
  useEffect(() => {
    if (puedeGestionar || store.mode !== "supabase") return;
    let vivo = true;
    remote
      .plazasDe(taller.id)
      .then((p) => vivo && setOcupacion(p))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [taller.id, puedeGestionar, store.mode, reservando]);

  const leaders = puedeGestionar
    ? reservas.filter((r) => r.rol === "leader").length
    : (ocupacion?.leaders ?? 0);
  const followers = puedeGestionar
    ? reservas.filter((r) => r.rol === "follower").length
    : (ocupacion?.followers ?? 0);
  const reservadas = puedeGestionar
    ? reservas.length
    : (ocupacion?.reservadas ?? 0);
  const libres = taller.plazas === null ? null : taller.plazas - reservadas;
  const lleno = libres !== null && libres <= 0;

  return (
    <Card className={cn(!taller.activo && "opacity-60")}>
      {taller.cartelUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={taller.cartelUrl}
          alt={taller.nombre}
          className="mb-3 max-h-72 w-full rounded-xl object-cover"
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold">{taller.nombre}</h2>
          <p className="text-sm text-ink-500">
            {fmtFecha(taller.fecha)}
            {taller.hora ? ` · ${taller.hora}` : ""}
            {taller.duracionMin ? ` · ${taller.duracionMin} min` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          {taller.importe > 0 ? `${taller.importe} €` : "Gratis"}
        </span>
      </div>

      {taller.descripcion && (
        <p className="mt-2 whitespace-pre-line text-sm text-ink-600 dark:text-ink-300">
          {taller.descripcion}
        </p>
      )}

      {libres !== null && (
        <p className="mt-2 text-sm font-medium">
          {lleno ? (
            <span className="text-rose-600">Completo</span>
          ) : (
            <span className="text-ink-600 dark:text-ink-300">
              Quedan {libres} de {taller.plazas} plazas
            </span>
          )}
        </p>
      )}

      {/* El equilibrio del taller: lo que hace que esto sea Compás. */}
      {puedeGestionar && reservas.length > 0 && (
        <p className="mt-1 text-sm">
          <span className="font-semibold text-leader">{leaders} leaders</span> ·{" "}
          <span className="font-semibold text-follower">
            {followers} followers
          </span>
          {leaders !== followers && (
            <span className="text-ink-500">
              {" "}
              — faltan {Math.abs(leaders - followers)}{" "}
              {leaders > followers ? "followers" : "leaders"} para cuadrarlo
            </span>
          )}
        </p>
      )}

      {!lleno && taller.activo && (
        <div className="mt-3">
          {reservando ? (
            <FormularioReserva
              taller={taller}
              academia={academia}
              onCerrar={() => setReservando(false)}
            />
          ) : (
            <Button onClick={() => setReservando(true)}>Reservar plaza</Button>
          )}
        </div>
      )}

      {puedeGestionar && (
        <div className="mt-4 border-t border-ink-100 pt-3 dark:border-ink-800">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button
              onClick={() => setVerReservas((v) => !v)}
              className="font-semibold text-brand-600"
            >
              {verReservas ? "▾" : "▸"} Reservas ({reservas.length})
            </button>
            <button
              onClick={() =>
                store.actualizarTaller({ ...taller, activo: !taller.activo })
              }
              className="text-ink-500 hover:underline"
            >
              {taller.activo ? "Despublicar" : "Publicar"}
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    `¿Borrar "${taller.nombre}"? Se borrarán también sus reservas.`,
                  )
                )
                  store.eliminarTaller(taller.id);
              }}
              className="text-rose-600 hover:underline"
            >
              Borrar
            </button>
          </div>
          {verReservas && <ListaReservas reservas={reservas} />}
        </div>
      )}
    </Card>
  );
}

function ListaReservas({ reservas }: { reservas: Reserva[] }) {
  const store = useStore();
  if (reservas.length === 0)
    return <p className="mt-2 text-sm text-ink-500">Todavía nadie.</p>;
  return (
    <ul className="mt-2 divide-y divide-ink-100 text-sm dark:divide-ink-800">
      {reservas.map((r) => (
        <li key={r.id} className="flex items-center gap-2 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{r.nombre}</p>
            <p className="truncate text-xs text-ink-500">
              {[r.telefono, r.email].filter(Boolean).join(" · ") ||
                "sin contacto"}{" "}
              · {r.metodoPago}
            </p>
          </div>
          <RolBadge rol={r.rol} />
          {r.estado === "confirmada" ? (
            <span className="shrink-0 text-xs font-semibold text-emerald-600">
              ✓ pagada
            </span>
          ) : (
            <button
              onClick={() =>
                store.actualizarReserva(r.id, { estado: "confirmada" })
              }
              className="shrink-0 rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
            >
              Marcar pagada
            </button>
          )}
          <button
            onClick={() =>
              store.actualizarReserva(r.id, { estado: "cancelada" })
            }
            className="shrink-0 text-xs text-rose-600 hover:underline"
          >
            Cancelar
          </button>
        </li>
      ))}
    </ul>
  );
}

// ───────────────────────── Reservar ─────────────────────────

function FormularioReserva({
  taller,
  academia,
  onCerrar,
}: {
  taller: Taller;
  academia: Academia;
  onCerrar: () => void;
}) {
  const store = useStore();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [rol, setRol] = useState<Rol>("follower");
  const [metodo, setMetodo] = useState<MetodoPago>("bizum");
  const [hecho, setHecho] = useState(false);
  const [error, setError] = useState("");

  function reservar() {
    if (!nombre.trim()) {
      setError("Pon tu nombre.");
      return;
    }
    if (!telefono.trim() && !email.trim()) {
      setError("Deja un teléfono o un email para poder avisarte.");
      return;
    }
    setError("");
    store.crearReserva({
      academiaId: academia.id,
      tallerId: taller.id,
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
      rol,
      metodoPago: metodo,
      estado: "pendiente",
      notas: "",
    });
    setHecho(true);
  }

  if (hecho) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="font-semibold text-emerald-800 dark:text-emerald-300">
          🎉 ¡Plaza reservada!
        </p>
        {taller.importe > 0 ? (
          <div className="mt-2 text-emerald-900 dark:text-emerald-200">
            <p>
              Para confirmarla, envía <b>{taller.importe} €</b>:
            </p>
            <ul className="mt-1 space-y-0.5">
              {metodo === "bizum" && academia.bizum && (
                <li>
                  📱 Bizum al <b>{academia.bizum}</b>
                </li>
              )}
              {metodo === "transferencia" && academia.iban && (
                <li>
                  🏦 Transferencia a <b>{academia.iban}</b>
                </li>
              )}
              {metodo === "efectivo" && <li>💶 En efectivo, el mismo día.</li>}
              {metodo === "bizum" && !academia.bizum && (
                <li>La academia te dirá cómo hacer el Bizum.</li>
              )}
              {metodo === "transferencia" && !academia.iban && (
                <li>La academia te pasará el número de cuenta.</li>
              )}
            </ul>
            <p className="mt-2 text-xs">
              La academia confirmará tu plaza en cuanto reciba el pago.
            </p>
          </div>
        ) : (
          <p className="mt-1 text-emerald-900 dark:text-emerald-200">
            Es gratis: nos vemos allí.
          </p>
        )}
        <button
          onClick={onCerrar}
          className="mt-3 text-sm font-semibold text-emerald-800 underline dark:text-emerald-300"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-200 p-4 dark:border-ink-800">
      <p className="mb-3 font-semibold">Reservar “{taller.nombre}”</p>
      <div className="space-y-3">
        <Input
          label="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Lucía"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Teléfono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="600 123 456"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="lucia@email.com"
          />
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-300">
            ¿Vienes de leader o de follower?
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(["leader", "follower", "ambos"] as Rol[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRol(r)}
                className={cn(
                  "rounded-xl border px-2 py-2 text-sm font-semibold capitalize",
                  rol === r
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                    : "border-ink-200 dark:border-ink-700",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-ink-500">
            Nos sirve para que el taller quede equilibrado y todo el mundo baile.
          </p>
        </div>
        {taller.importe > 0 && (
          <Select
            label="¿Cómo prefieres pagar?"
            value={metodo}
            onChange={(e) => setMetodo(e.target.value as MetodoPago)}
          >
            <option value="bizum">Bizum</option>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">En efectivo el mismo día</option>
          </Select>
        )}
        {error && (
          <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={reservar}>Confirmar reserva</Button>
          <Button variant="secondary" onClick={onCerrar}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Crear taller (equipo) ─────────────────────────

function NuevoTaller({ academia }: { academia: Academia }) {
  const store = useStore();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("19:00");
  const [duracion, setDuracion] = useState("90");
  const [importe, setImporte] = useState("15");
  const [plazas, setPlazas] = useState("");
  const [cartelUrl, setCartelUrl] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function onCartel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (store.mode === "supabase") {
      setSubiendo(true);
      try {
        setCartelUrl(await subirLogo(file));
      } catch (err) {
        setError(
          "No se pudo subir el cartel. " +
            (err instanceof Error ? err.message : ""),
        );
      }
      setSubiendo(false);
    } else {
      const reader = new FileReader();
      reader.onload = () => setCartelUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function crear() {
    if (!nombre.trim()) {
      setError("Ponle nombre al taller.");
      return;
    }
    store.crearTaller({
      academiaId: academia.id,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      fecha: fecha || null,
      hora,
      duracionMin: Number(duracion) || null,
      importe: Number(importe) || 0,
      plazas: plazas ? Number(plazas) : null,
      cartelUrl,
      activo: true,
    });
    setNombre("");
    setDescripcion("");
    setFecha("");
    setCartelUrl(null);
    setPlazas("");
    setError("");
    setAbierto(false);
  }

  return (
    <Card className="mt-5 border-brand-200 bg-brand-50/60 dark:bg-brand-900/15">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between font-bold"
      >
        <span>➕ Publicar un taller</span>
        <span className="text-ink-400">{abierto ? "−" : "+"}</span>
      </button>
      {abierto && (
        <div className="mt-3 space-y-3">
          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Taller de pasos libres"
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-300">
              Descripción
            </span>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950"
              placeholder="Nivel, qué se va a trabajar, qué llevar…"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            <Input
              label="Hora"
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
            <Input
              label="Duración (min)"
              type="number"
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
            />
            <Input
              label="Importe (€)"
              type="number"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
            />
            <Input
              label="Plazas (vacío = sin límite)"
              type="number"
              value={plazas}
              onChange={(e) => setPlazas(e.target.value)}
            />
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-300">
              Cartel
            </span>
            <div className="flex items-center gap-3">
              {cartelUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cartelUrl}
                  alt="Cartel"
                  className="h-16 w-16 rounded-xl object-cover"
                />
              )}
              <label className="cursor-pointer rounded-xl bg-ink-100 px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-200">
                {subiendo ? "Subiendo…" : "Subir imagen"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onCartel}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          {error && (
            <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
              {error}
            </p>
          )}
          <Button onClick={crear} disabled={subiendo}>
            Publicar taller
          </Button>
        </div>
      )}
    </Card>
  );
}
