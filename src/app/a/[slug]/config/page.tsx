"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Card, Input, Select } from "@/components/ui";
import {
  DIAS_SEMANA,
  NIVELES,
  type Nivel,
  type ReglasBalance,
  type TipoPlan,
} from "@/lib/types";

const TIPOS_PLAN: { v: TipoPlan; label: string }[] = [
  { v: "mensual", label: "Mensual" },
  { v: "trimestral", label: "Trimestral" },
  { v: "semestral", label: "Semestral" },
  { v: "anual", label: "Anual" },
  { v: "bono", label: "Bono (por clases)" },
];

export default function Config() {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore();
  const academia = store.academiaPorSlug(slug);

  const [reglas, setReglas] = useState<ReglasBalance | null>(
    academia ? academia.reglas : null,
  );
  const [guardado, setGuardado] = useState(false);

  // alta de clase
  const [cNombre, setCNombre] = useState("");
  const [cNivel, setCNivel] = useState<Nivel>("medio");
  const [cEstilo, setCEstilo] = useState("");
  const [cDia, setCDia] = useState(1);
  const [cHora, setCHora] = useState("20:00");

  // acceso de profesores
  const [emailProf, setEmailProf] = useState("");

  // planes de pago
  const [pNombre, setPNombre] = useState("");
  const [pTipo, setPTipo] = useState<TipoPlan>("mensual");
  const [pImporte, setPImporte] = useState("");
  const [pClases, setPClases] = useState("");

  // mensaje de recordatorio de pago
  const [recordatorio, setRecordatorio] = useState(
    academia?.recordatorioPago ?? "",
  );
  const [recGuardado, setRecGuardado] = useState(false);

  if (store.ready && !academia)
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
        <Card>
          <p className="text-3xl">🤔</p>
          <p className="mt-2 font-semibold">Academia no encontrada</p>
        </Card>
      </main>
    );

  if (!academia || !reglas) return null;

  if (!store.soyDueno(academia.id))
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5 text-center">
        <Card>
          <p className="text-3xl">🔒</p>
          <p className="mt-2 font-semibold">Solo el equipo de la academia</p>
          <p className="mt-1 text-sm text-ink-500">
            La configuración la gestiona quien creó la academia.
          </p>
          <Link
            href={`/a/${slug}`}
            className="mt-3 inline-block text-brand-600 underline"
          >
            Volver
          </Link>
        </Card>
      </main>
    );

  const clases = store.clasesDe(academia.id);
  const miembros = store.miembrosDe(academia.id);
  const planes = store.planesDe(academia.id);

  function crearPlanLocal() {
    if (!academia) return;
    if (!pNombre.trim()) return;
    store.crearPlan({
      academiaId: academia.id,
      nombre: pNombre.trim(),
      tipo: pTipo,
      importe: Number(pImporte) || 0,
      clases: pTipo === "bono" ? Number(pClases) || null : null,
      activo: true,
    });
    setPNombre("");
    setPImporte("");
    setPClases("");
  }

  function set<K extends keyof ReglasBalance>(k: K, v: ReglasBalance[K]) {
    setReglas((prev) => (prev ? { ...prev, [k]: v } : prev));
    setGuardado(false);
  }

  function guardar() {
    if (!academia || !reglas) return;
    store.actualizarAcademia(academia.id, { reglas });
    setGuardado(true);
  }

  function invitarProf() {
    if (!academia) return;
    const email = emailProf.trim();
    if (!email || !email.includes("@")) return;
    store.invitarMiembro(academia.id, email);
    setEmailProf("");
  }

  function anadirClase() {
    if (!academia) return;
    if (!cNombre.trim()) return;
    store.crearClase({
      academiaId: academia.id,
      nombre: cNombre.trim(),
      nivel: cNivel,
      estilo: cEstilo.trim() || academia.estilos[0] || "Salsa",
      diaSemana: cDia,
      hora: cHora,
      sala: "Sala A",
      aforo: 24,
    });
    setCNombre("");
    setCEstilo("");
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-8">
      <Link
        href={`/a/${slug}/panel`}
        className="text-sm text-ink-500 hover:underline"
      >
        ← {academia.nombre}
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">Configuración</h1>

      <Card className="mt-5">
        <h2 className="font-bold">Reglas de balance</h2>
        <p className="mt-1 text-sm text-ink-500">
          Cómo decide Compás cuándo una clase está descompensada.
        </p>
        <div className="mt-4 space-y-4">
          <Range
            label="Tolerancia de desbalance"
            sufijo="personas"
            min={0}
            max={8}
            value={reglas.tolerancia}
            onChange={(v) => set("tolerancia", v)}
            ayuda="Diferencia leader/follower que se admite antes de avisar."
          />
          <Range
            label="Aviso de refuerzo"
            sufijo="h antes"
            min={1}
            max={24}
            value={reglas.avisoHorasAntes}
            onChange={(v) => set("avisoHorasAntes", v)}
            ayuda="Con cuánta antelación se piden refuerzos."
          />
          <Range
            label="Cupo de refuerzos"
            sufijo="máx."
            min={1}
            max={20}
            value={reglas.cupoRefuerzos}
            onChange={(v) => set("cupoRefuerzos", v)}
            ayuda="Cuántos refuerzos externos se sugieren por clase."
          />
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={reglas.nivelesCompatibles}
              onChange={(e) => set("nivelesCompatibles", e.target.checked)}
              className="h-5 w-5 rounded"
            />
            <span className="text-sm">
              Permitir reforzar con niveles cercanos (±1)
            </span>
          </label>
        </div>
        <Button onClick={guardar} className="mt-5">
          {guardado ? "✓ Guardado" : "Guardar reglas"}
        </Button>
      </Card>

      <Card className="mt-5">
        <h2 className="font-bold">Clases ({clases.length})</h2>
        <ul className="mt-2 divide-y divide-ink-100 dark:divide-ink-800">
          {clases.map((c) => (
            <li key={c.id} className="flex justify-between py-2 text-sm">
              <span className="font-medium">{c.nombre}</span>
              <span className="text-ink-500">
                {DIAS_SEMANA[c.diaSemana]} · {c.hora}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-xl bg-ink-50 p-3 dark:bg-ink-900">
          <p className="mb-2 text-sm font-semibold">Añadir clase</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              label="Nombre"
              value={cNombre}
              onChange={(e) => setCNombre(e.target.value)}
              placeholder="Salsa Avanzado"
            />
            <Input
              label="Estilo"
              value={cEstilo}
              onChange={(e) => setCEstilo(e.target.value)}
              placeholder="Salsa"
            />
            <Select
              label="Nivel"
              value={cNivel}
              onChange={(e) => setCNivel(e.target.value as Nivel)}
            >
              {NIVELES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <Select
              label="Día"
              value={cDia}
              onChange={(e) => setCDia(Number(e.target.value))}
            >
              {DIAS_SEMANA.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </Select>
            <Input
              label="Hora"
              type="time"
              value={cHora}
              onChange={(e) => setCHora(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={anadirClase} className="mt-3">
            Añadir clase
          </Button>
        </div>
      </Card>

      <Card className="mt-5">
        <h2 className="font-bold">Profesores con acceso ({miembros.length})</h2>
        <p className="mt-1 text-sm text-ink-500">
          Invita a tus profes por su email. Cuando entren con ese email podrán
          subir vídeos y ver el estado de las clases (asistentes y equilibrio).
          No pueden cambiar ajustes ni borrar la academia.
        </p>

        {miembros.length > 0 && (
          <ul className="mt-3 divide-y divide-ink-100 dark:divide-ink-800">
            {miembros.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  🧑‍🏫 <span className="font-medium">{m.email}</span>
                </span>
                <button
                  onClick={() => store.quitarMiembro(m.id)}
                  className="shrink-0 text-rose-600 hover:underline"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex gap-2">
          <Input
            type="email"
            value={emailProf}
            onChange={(e) => setEmailProf(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                invitarProf();
              }
            }}
            placeholder="profe@email.com"
            className="flex-1"
          />
          <Button variant="secondary" onClick={invitarProf}>
            Invitar
          </Button>
        </div>
        <p className="mt-2 text-xs text-ink-500">
          El profe debe registrarse en Compás con ese mismo email para acceder.
        </p>
      </Card>

      <Card className="mt-5">
        <h2 className="font-bold">Planes de pago ({planes.length})</h2>
        <p className="mt-1 text-sm text-ink-500">
          Define tus modalidades (mensual, trimestral, semestral, anual o
          bonos). Luego registras los pagos de tus alumnos contra estos planes.
        </p>

        {planes.length > 0 && (
          <ul className="mt-3 divide-y divide-ink-100 dark:divide-ink-800">
            {planes.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-medium">{p.nombre}</span>{" "}
                  <span className="text-ink-500">
                    · {TIPOS_PLAN.find((t) => t.v === p.tipo)?.label}
                    {p.tipo === "bono" && p.clases ? ` (${p.clases} clases)` : ""}
                    {" · "}
                    {p.importe} €
                  </span>
                </span>
                <button
                  onClick={() => store.eliminarPlan(p.id)}
                  className="shrink-0 text-rose-600 hover:underline"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 rounded-xl bg-ink-50 p-3 dark:bg-ink-900">
          <p className="mb-2 text-sm font-semibold">Añadir plan</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              label="Nombre"
              value={pNombre}
              onChange={(e) => setPNombre(e.target.value)}
              placeholder="Cuota mensual"
            />
            <Select
              label="Tipo"
              value={pTipo}
              onChange={(e) => setPTipo(e.target.value as TipoPlan)}
            >
              {TIPOS_PLAN.map((t) => (
                <option key={t.v} value={t.v}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Input
              label="Importe (€)"
              type="number"
              value={pImporte}
              onChange={(e) => setPImporte(e.target.value)}
              placeholder="40"
            />
            {pTipo === "bono" && (
              <Input
                label="Nº de clases del bono"
                type="number"
                value={pClases}
                onChange={(e) => setPClases(e.target.value)}
                placeholder="10"
              />
            )}
          </div>
          <Button variant="secondary" onClick={crearPlanLocal} className="mt-3">
            Añadir plan
          </Button>
        </div>

        <div className="mt-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-300">
              Mensaje de recordatorio de pago
            </span>
            <textarea
              value={recordatorio}
              onChange={(e) => {
                setRecordatorio(e.target.value);
                setRecGuardado(false);
              }}
              rows={3}
              className="w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-ink-700 dark:bg-ink-950"
              placeholder="¡Hola {nombre}! Te recordamos el pago pendiente en {academia}. ¡Gracias!"
            />
          </label>
          <p className="mt-1 text-xs text-ink-500">
            Usa <b>{"{nombre}"}</b> y <b>{"{academia}"}</b> y se rellenan solos.
            Se envía desde la pantalla de Pagos, por WhatsApp.
          </p>
          <Button
            variant="secondary"
            className="mt-2"
            onClick={() => {
              store.actualizarAcademia(academia.id, {
                recordatorioPago: recordatorio,
              });
              setRecGuardado(true);
            }}
          >
            {recGuardado ? "✓ Guardado" : "Guardar mensaje"}
          </Button>
        </div>
      </Card>
    </main>
  );
}

function Range({
  label,
  sufijo,
  min,
  max,
  value,
  onChange,
  ayuda,
}: {
  label: string;
  sufijo: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  ayuda: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold text-brand-600">
          {value} {sufijo}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-brand-600"
      />
      <p className="text-xs text-ink-500">{ayuda}</p>
    </div>
  );
}
