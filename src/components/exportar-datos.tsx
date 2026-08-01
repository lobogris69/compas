"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import * as remote from "@/lib/remote";
import { aCSV, descargarCSV, nombreExport } from "@/lib/exportar";
import { Button, Card } from "@/components/ui";
import { DIAS_SEMANA, type Academia } from "@/lib/types";

// Exportar los datos de la academia a CSV. Ninguna academia adopta un sistema
// del que no pueda sacar sus datos, y el RGPD le obliga a poder hacerlo.
export function ExportarDatos({ academia }: { academia: Academia }) {
  const store = useStore();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState("");

  const clases = store.clasesDe(academia.id);
  const nombreClase = (id: string) =>
    clases.find((c) => c.id === id)?.nombre ?? "(clase borrada)";
  const alumnos = store.alumnosDeConBajas(academia.id);
  const nombreAlumno = (id: string) =>
    alumnos.find((a) => a.id === id)?.nombre ?? "(alumno borrado)";

  async function exportarAlumnos() {
    setOcupado("alumnos");
    setError("");
    try {
      // Email y teléfono no están en memoria (son datos protegidos): se piden
      // aparte y solo llegan si eres del equipo de la academia.
      let contacto: Record<string, { email: string; telefono: string }> = {};
      if (store.mode === "supabase") {
        contacto = await remote.contactoDe(academia.id);
      }
      const filas = alumnos.map((a) => ({
        Nombre: a.nombre,
        Rol: a.rol,
        Nivel: a.nivel,
        Email: contacto[a.id]?.email ?? a.email ?? "",
        Teléfono: contacto[a.id]?.telefono ?? a.telefono ?? "",
        Instagram: a.instagram ?? "",
        Clases: store
          .clasesDeAlumno(a.id)
          .map((c) => `${c.nombre} (${DIAS_SEMANA[c.diaSemana]} ${c.hora})`)
          .join(", "),
        Estado: a.bajaAt ? "baja" : "activo",
        "Fecha de baja": a.bajaAt ? a.bajaAt.slice(0, 10) : "",
        "Alta en la academia": a.createdAt.slice(0, 10),
      }));
      descargarCSV(nombreExport(academia.slug, "alumnos"), aCSV(filas));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo exportar.");
    }
    setOcupado(null);
  }

  function exportarPagos() {
    const filas = store.pagosDe(academia.id).map((p) => ({
      Alumno: nombreAlumno(p.alumnoId),
      Concepto: p.concepto,
      Modalidad: p.tipo,
      // Coma decimal: es lo que espera Excel en español.
      Importe: String(p.importe).replace(".", ","),
      "Fecha de pago": p.fechaPago,
      "Cubre desde": p.cubreDesde ?? "",
      "Cubre hasta": p.cubreHasta ?? "",
      "Clases del bono": p.clases ?? "",
    }));
    descargarCSV(nombreExport(academia.slug, "pagos"), aCSV(filas));
  }

  function exportarAsistencia() {
    const filas = store.db.asistencias
      .filter((a) => a.academiaId === academia.id)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((a) => ({
        Fecha: a.fecha,
        Clase: nombreClase(a.claseId),
        Alumno: nombreAlumno(a.alumnoId),
        "Dijo que": a.estado === "si" ? "sí" : a.estado,
        Vino: a.asistio === null ? "(sin pasar lista)" : a.asistio ? "sí" : "no",
        "Fue refuerzo": a.esRefuerzo ? "sí" : "no",
      }));
    descargarCSV(nombreExport(academia.slug, "asistencia"), aCSV(filas));
  }

  const nPagos = store.pagosDe(academia.id).length;
  const nAsis = store.db.asistencias.filter(
    (a) => a.academiaId === academia.id,
  ).length;

  return (
    <Card className="mt-5">
      <h2 className="font-bold">Exportar tus datos</h2>
      <p className="mt-1 text-sm text-ink-500">
        Se descargan en CSV, listos para abrir en Excel. Son tuyos: llévatelos
        cuando quieras.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={exportarAlumnos}
          disabled={ocupado !== null}
        >
          {ocupado === "alumnos"
            ? "Preparando…"
            : `Alumnos (${alumnos.length})`}
        </Button>
        <Button
          variant="secondary"
          onClick={exportarPagos}
          disabled={nPagos === 0}
        >
          Pagos ({nPagos})
        </Button>
        <Button
          variant="secondary"
          onClick={exportarAsistencia}
          disabled={nAsis === 0}
        >
          Asistencia ({nAsis})
        </Button>
      </div>
      {error && (
        <p className="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-ink-500">
        El listado de alumnos incluye email y teléfono, que no son visibles en
        la app para proteger a tus alumnos. Trátalos con cuidado.
      </p>
    </Card>
  );
}
