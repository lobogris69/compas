import { describe, expect, it } from "vitest";
import {
  PROBABILIDAD_INICIAL,
  estadoPrevio,
  preverBalance,
  probabilidadDeVenir,
  type Candidato,
  type Historial,
} from "./prediccion";
import type { Asistencia } from "./types";

let n = 0;
function reg(
  alumnoId: string,
  estado: "si" | "no" | "quiza",
  asistio: boolean | null,
): Asistencia {
  n += 1;
  return {
    id: `r${n}`,
    academiaId: "ac",
    claseId: "c1",
    alumnoId,
    fecha: "2026-08-06",
    estado,
    rolEnClase: null,
    esRefuerzo: false,
    asistio,
    updatedAt: "2026-08-06",
  };
}
const hist = (registros: Asistencia[]): Historial => ({ registros });

describe("estadoPrevio", () => {
  it("trata 'quizá' y 'sin respuesta' como lo mismo: no lo sabemos", () => {
    expect(estadoPrevio("quiza")).toBe("sin");
    expect(estadoPrevio(null)).toBe("sin");
    expect(estadoPrevio("si")).toBe("si");
    expect(estadoPrevio("no")).toBe("no");
  });
});

describe("probabilidadDeVenir", () => {
  it("sin historial, usa los valores de partida", () => {
    const h = hist([]);
    expect(probabilidadDeVenir("a", "si", h)).toBeCloseTo(
      PROBABILIDAD_INICIAL.si,
    );
    expect(probabilidadDeVenir("a", "sin", h)).toBeCloseTo(
      PROBABILIDAD_INICIAL.sin,
    );
    expect(probabilidadDeVenir("a", "no", h)).toBeCloseTo(
      PROBABILIDAD_INICIAL.no,
    );
  });

  it("un solo dato no dispara la probabilidad al 100%", () => {
    // "Vino 1 de 1" no puede leerse como "viene siempre".
    const h = hist([reg("a", "si", true)]);
    const p = probabilidadDeVenir("a", "si", h);
    expect(p).toBeLessThan(0.95);
    expect(p).toBeGreaterThan(PROBABILIDAD_INICIAL.si);
  });

  it("con datos suficientes, manda el comportamiento del alumno", () => {
    // Alguien que dice que sí y nunca aparece.
    const suyos = Array.from({ length: 12 }, () => reg("informal", "si", false));
    // Y el resto de la academia, que sí cumple.
    const otros = Array.from({ length: 12 }, () => reg("fiable", "si", true));
    const p = probabilidadDeVenir("informal", "si", hist([...suyos, ...otros]));
    expect(p).toBeLessThan(0.3);
    const q = probabilidadDeVenir("fiable", "si", hist([...suyos, ...otros]));
    expect(q).toBeGreaterThan(0.7);
  });

  it("un alumno desconocido hereda la media de la academia", () => {
    // En esta academia, quien no contesta casi siempre acaba viniendo.
    const registros = Array.from({ length: 20 }, () =>
      reg("otro", "quiza", true),
    );
    const p = probabilidadDeVenir("nuevo", "sin", hist(registros));
    expect(p).toBeGreaterThan(PROBABILIDAD_INICIAL.sin);
  });

  it("ignora las sesiones en las que no se pasó lista", () => {
    const h = hist([reg("a", "si", null), reg("a", "si", null)]);
    expect(probabilidadDeVenir("a", "si", h)).toBeCloseTo(
      PROBABILIDAD_INICIAL.si,
    );
  });
});

describe("preverBalance", () => {
  const cand = (
    alumnoId: string,
    rol: Candidato["rol"],
    previo: Candidato["previo"],
  ): Candidato => ({ alumnoId, rol, previo });

  it("ve venir la descompensación aunque nadie haya contestado aún", () => {
    // Lunes: 8 leaders y 2 followers matriculados, ninguno ha contestado.
    // Contando confirmaciones daría 0 vs 0 (verde). Previendo, no.
    const candidatos = [
      ...Array.from({ length: 8 }, (_, i) => cand(`l${i}`, "leader", "sin")),
      ...Array.from({ length: 2 }, (_, i) => cand(`f${i}`, "follower", "sin")),
    ];
    const p = preverBalance(candidatos, hist([]), 2);
    expect(p.leaders).toBeGreaterThan(p.followers);
    expect(p.faltan?.rol).toBe("follower");
    expect(p.estado).not.toBe("ok");
  });

  it("quien dijo que no, casi no cuenta", () => {
    const candidatos = [
      cand("a", "leader", "si"),
      cand("b", "follower", "no"),
    ];
    const p = preverBalance(candidatos, hist([]), 0);
    expect(p.leaders).toBe(1);
    expect(p.followers).toBe(0);
  });

  it("reparte los 'ambos' al lado que va quedando corto", () => {
    const candidatos = [
      cand("l1", "leader", "si"),
      cand("l2", "leader", "si"),
      cand("x", "ambos", "si"),
    ];
    const p = preverBalance(candidatos, hist([]), 0);
    expect(p.followers).toBeGreaterThan(0);
    expect(p.ambos).toBe(1);
  });

  it("una clase equilibrada sale en verde", () => {
    const candidatos = [
      ...Array.from({ length: 5 }, (_, i) => cand(`l${i}`, "leader", "si")),
      ...Array.from({ length: 5 }, (_, i) => cand(`f${i}`, "follower", "si")),
    ];
    const p = preverBalance(candidatos, hist([]), 2);
    expect(p.estado).toBe("ok");
    expect(p.faltan).toBeNull();
  });

  it("declara poca confianza mientras hay pocos datos", () => {
    const p = preverBalance([cand("a", "leader", "si")], hist([]), 2);
    expect(p.confianza).toBe("baja");
    const muchos = Array.from({ length: 40 }, () => reg("z", "si", true));
    const q = preverBalance([cand("a", "leader", "si")], hist(muchos), 2);
    expect(q.confianza).toBe("alta");
  });

  it("respeta la tolerancia configurada", () => {
    const candidatos = [
      ...Array.from({ length: 6 }, (_, i) => cand(`l${i}`, "leader", "si")),
      ...Array.from({ length: 4 }, (_, i) => cand(`f${i}`, "follower", "si")),
    ];
    expect(preverBalance(candidatos, hist([]), 5).estado).toBe("ok");
    expect(preverBalance(candidatos, hist([]), 0).estado).not.toBe("ok");
  });
});
