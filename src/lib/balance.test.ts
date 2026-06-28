import { describe, it, expect } from "vitest";
import {
  asignarRolesEfectivos,
  calcularBalance,
  sugerirRefuerzos,
} from "./balance";
import {
  type Academia,
  type Alumno,
  REGLAS_POR_DEFECTO,
  type Rol,
} from "./types";

function rol(r: Rol) {
  return { rol: r };
}

describe("calcularBalance", () => {
  it("clase equilibrada sin ambos → ok, sin faltantes", () => {
    const b = calcularBalance(
      [rol("leader"), rol("leader"), rol("follower"), rol("follower")],
      2,
    );
    expect(b.leaders).toBe(2);
    expect(b.followers).toBe(2);
    expect(b.gap).toBe(0);
    expect(b.estado).toBe("ok");
    expect(b.faltan).toBeNull();
  });

  it("reparte los 'ambos' al rol en minoría", () => {
    // 3 leaders, 1 follower, 2 ambos → ambos van ambos a follower → 3 vs 3
    const b = calcularBalance(
      [
        rol("leader"),
        rol("leader"),
        rol("leader"),
        rol("follower"),
        rol("ambos"),
        rol("ambos"),
      ],
      2,
    );
    expect(b.leaders).toBe(3);
    expect(b.followers).toBe(3);
    expect(b.ambos).toBe(2);
    expect(b.faltan).toBeNull();
  });

  it("detecta déficit y de qué rol", () => {
    // 8 leaders, 3 followers, tolerancia 2 → faltan 5 followers, estado alert
    const asistentes = [
      ...Array(8).fill(rol("leader")),
      ...Array(3).fill(rol("follower")),
    ];
    const b = calcularBalance(asistentes, 2);
    expect(b.leaders).toBe(8);
    expect(b.followers).toBe(3);
    expect(b.gap).toBe(5);
    expect(b.faltan).toEqual({ rol: "follower", cantidad: 5 });
    expect(b.estado).toBe("alert");
  });

  it("estado warn cuando el gap supera la tolerancia pero no el doble", () => {
    // gap 3, tolerancia 2 → warn (3 > 2 pero 3 <= 4)
    const asistentes = [
      ...Array(5).fill(rol("leader")),
      ...Array(2).fill(rol("follower")),
    ];
    const b = calcularBalance(asistentes, 2);
    expect(b.gap).toBe(3);
    expect(b.estado).toBe("warn");
  });

  it("clase vacía → ok, todo a cero", () => {
    const b = calcularBalance([], 2);
    expect(b.total).toBe(0);
    expect(b.estado).toBe("ok");
    expect(b.faltan).toBeNull();
  });
});

describe("asignarRolesEfectivos", () => {
  it("asigna 'ambos' equilibrando", () => {
    const m = asignarRolesEfectivos([
      { id: "a", rol: "leader" },
      { id: "b", rol: "leader" },
      { id: "c", rol: "follower" },
      { id: "d", rol: "ambos" },
    ]);
    expect(m.get("a")).toBe("leader");
    expect(m.get("c")).toBe("follower");
    // d debe ir a follower para cuadrar (2 leaders vs 1 follower)
    expect(m.get("d")).toBe("follower");
  });
});

describe("sugerirRefuerzos", () => {
  const academia: Academia = {
    id: "ac1",
    slug: "test",
    nombre: "Test",
    emoji: "💃",
    color: "#000",
    estilos: ["Salsa"],
    reglas: { ...REGLAS_POR_DEFECTO },
    createdAt: "2026-01-01",
  };

  function alumno(id: string, r: Rol, nivel: Alumno["nivel"]): Alumno {
    return {
      id,
      academiaId: "ac1",
      nombre: id,
      rol: r,
      nivel,
      sexo: "nd",
      estilos: ["Salsa"],
      fotoUrl: null,
      bio: "",
      bailandoDesde: null,
      instagram: null,
      visibilidad: "academia",
      createdAt: "2026-01-01",
    };
  }

  it("sugiere quien cubre el rol que falta y no responde aún", () => {
    const alumnos = [
      alumno("f1", "follower", "medio"),
      alumno("f2", "follower", "medio"),
      alumno("amb", "ambos", "medio"),
      alumno("l1", "leader", "medio"), // no sirve: sobran leaders
      alumno("yaviene", "follower", "medio"),
    ];
    const balance = calcularBalance(
      [
        ...Array(5).fill(rol("leader")),
        rol("follower"),
      ],
      2,
    );
    expect(balance.faltan?.rol).toBe("follower");

    const sugeridos = sugerirRefuerzos(
      academia,
      alumnos,
      "medio",
      balance,
      new Set(["yaviene"]),
    );
    const ids = sugeridos.map((s) => s.alumno.id);
    expect(ids).toContain("f1");
    expect(ids).toContain("amb"); // ambos puede cubrir follower
    expect(ids).not.toContain("l1"); // leader no cubre déficit de follower
    expect(ids).not.toContain("yaviene"); // ya responde
  });

  it("respeta compatibilidad de nivel (no junta principiante con avanzado)", () => {
    const alumnos = [
      alumno("avanzado", "follower", "avanzado"),
      alumno("principiante", "follower", "principiante"),
    ];
    const balance = calcularBalance(
      [...Array(4).fill(rol("leader"))],
      2,
    );
    // Clase de nivel principiante: el avanzado está a 2 de distancia → excluido
    const sugeridos = sugerirRefuerzos(
      academia,
      alumnos,
      "principiante",
      balance,
      new Set(),
    );
    const ids = sugeridos.map((s) => s.alumno.id);
    expect(ids).toContain("principiante");
    expect(ids).not.toContain("avanzado");
  });
});
