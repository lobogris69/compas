// Exportar datos a CSV. Ninguna academia adopta un sistema del que no pueda
// sacar sus datos — y el RGPD además le obliga a poder hacerlo.
//
// Dos detalles que parecen menores y no lo son, porque el destino real es Excel
// en español: el separador es punto y coma (con coma, Excel mete toda la fila en
// una sola celda) y el archivo lleva marca de UTF-8 al principio (sin ella, los
// acentos y las eñes salen rotos).

const SEPARADOR = ";";
const BOM = "﻿";

/** Escapa un valor para CSV: comillas dobladas y entrecomillado si hace falta. */
export function celda(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const s = String(valor);
  const necesitaComillas =
    s.includes(SEPARADOR) || s.includes('"') || /[\r\n]/.test(s);
  const escapado = s.replace(/"/g, '""');
  return necesitaComillas ? `"${escapado}"` : escapado;
}

/**
 * Convierte filas (objetos con las mismas claves) en texto CSV.
 * Las claves de la primera fila son la cabecera.
 */
export function aCSV(filas: Record<string, unknown>[]): string {
  if (filas.length === 0) return "";
  const columnas = Object.keys(filas[0]);
  const lineas = [
    columnas.map(celda).join(SEPARADOR),
    ...filas.map((f) => columnas.map((c) => celda(f[c])).join(SEPARADOR)),
  ];
  return lineas.join("\r\n");
}

/** Descarga el CSV como archivo, listo para abrir en Excel. */
export function descargarCSV(nombreArchivo: string, csv: string): void {
  const blob = new Blob([BOM + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo.endsWith(".csv")
    ? nombreArchivo
    : `${nombreArchivo}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Nombre de archivo con la academia y la fecha, para no acumular "export(3).csv". */
export function nombreExport(slug: string, que: string): string {
  const hoy = new Date();
  const f = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  return `compas-${slug}-${que}-${f}.csv`;
}
