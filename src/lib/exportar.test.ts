import { describe, expect, it } from "vitest";
import { aCSV, celda, nombreExport } from "./exportar";

describe("celda", () => {
  it("deja pasar el texto normal sin tocarlo", () => {
    expect(celda("Lucía")).toBe("Lucía");
    expect(celda(40)).toBe("40");
  });

  it("entrecomilla si el valor lleva el separador", () => {
    // Sin esto, "Salsa; Bachata" partiría la fila en dos celdas.
    expect(celda("Salsa; Bachata")).toBe('"Salsa; Bachata"');
  });

  it("dobla las comillas dobles", () => {
    expect(celda('El "Sombrero"')).toBe('"El ""Sombrero"""');
  });

  it("entrecomilla los saltos de línea (una bio los tiene)", () => {
    expect(celda("Bailo salsa\ndesde 2019")).toBe('"Bailo salsa\ndesde 2019"');
  });

  it("los vacíos no rompen la fila", () => {
    expect(celda(null)).toBe("");
    expect(celda(undefined)).toBe("");
  });
});

describe("aCSV", () => {
  it("pone cabecera y filas separadas por punto y coma", () => {
    const csv = aCSV([
      { nombre: "Ana", rol: "follower" },
      { nombre: "Beto", rol: "leader" },
    ]);
    expect(csv).toBe("nombre;rol\r\nAna;follower\r\nBeto;leader");
  });

  it("sin filas devuelve vacío en vez de una cabecera huérfana", () => {
    expect(aCSV([])).toBe("");
  });

  it("respeta el orden de las columnas de la primera fila", () => {
    const csv = aCSV([{ b: 2, a: 1 }]);
    expect(csv.split("\r\n")[0]).toBe("b;a");
  });
});

describe("nombreExport", () => {
  it("incluye la academia y el contenido", () => {
    const n = nombreExport("salsa-studio", "alumnos");
    expect(n).toContain("compas-salsa-studio-alumnos-");
    expect(n.endsWith(".csv")).toBe(true);
  });
});
