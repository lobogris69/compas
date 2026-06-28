"use client";

// Store local-first de Compás. Persiste en localStorage para que la app
// funcione sin backend. La API está pensada para luego enchufar Supabase
// detrás sin cambiar los componentes.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { crearDemo } from "./demo";
import { newId } from "./slug";
import type {
  Academia,
  Alumno,
  Asistencia,
  Clase,
  EstadoAsistencia,
  Rol,
} from "./types";

const STORAGE_KEY = "compas:data:v1";

interface DB {
  academias: Academia[];
  alumnos: Alumno[];
  clases: Clase[];
  asistencias: Asistencia[];
}

const VACIO: DB = { academias: [], alumnos: [], clases: [], asistencias: [] };

interface StoreValue {
  ready: boolean;
  db: DB;
  // Academias
  crearAcademia: (a: Omit<Academia, "id" | "createdAt">) => Academia;
  academiaPorSlug: (slug: string) => Academia | undefined;
  // Alumnos
  crearAlumno: (a: Omit<Alumno, "id" | "createdAt">) => Alumno;
  actualizarAlumno: (id: string, patch: Partial<Alumno>) => void;
  alumnosDe: (academiaId: string) => Alumno[];
  // Clases
  crearClase: (c: Omit<Clase, "id" | "createdAt">) => Clase;
  clasesDe: (academiaId: string) => Clase[];
  // Asistencia
  responder: (
    input: {
      academiaId: string;
      claseId: string;
      alumnoId: string;
      fecha: string;
      estado: EstadoAsistencia;
      esRefuerzo?: boolean;
    },
  ) => void;
  asistenciasDe: (claseId: string, fecha: string) => Asistencia[];
  reset: () => void;
  cargarDemo: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

function load(): DB {
  if (typeof window === "undefined") return VACIO;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return VACIO;
    return { ...VACIO, ...(JSON.parse(raw) as DB) };
  } catch {
    return VACIO;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(VACIO);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = load();
    // Primera visita: sembramos una academia de demo para que se vea viva.
    if (loaded.academias.length === 0) {
      const demo = crearDemo();
      setDb(demo);
      persist(demo);
    } else {
      setDb(loaded);
    }
    setReady(true);
  }, []);

  const persist = (next: DB) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  const update = useCallback((fn: (prev: DB) => DB) => {
    setDb((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, []);

  const crearAcademia: StoreValue["crearAcademia"] = useCallback(
    (input) => {
      const academia: Academia = {
        ...input,
        id: newId(),
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({ ...prev, academias: [...prev.academias, academia] }));
      return academia;
    },
    [update],
  );

  const crearAlumno: StoreValue["crearAlumno"] = useCallback(
    (input) => {
      const alumno: Alumno = {
        ...input,
        id: newId(),
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({ ...prev, alumnos: [...prev.alumnos, alumno] }));
      return alumno;
    },
    [update],
  );

  const actualizarAlumno: StoreValue["actualizarAlumno"] = useCallback(
    (id, patch) => {
      update((prev) => ({
        ...prev,
        alumnos: prev.alumnos.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      }));
    },
    [update],
  );

  const crearClase: StoreValue["crearClase"] = useCallback(
    (input) => {
      const clase: Clase = {
        ...input,
        id: newId(),
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({ ...prev, clases: [...prev.clases, clase] }));
      return clase;
    },
    [update],
  );

  const responder: StoreValue["responder"] = useCallback(
    (input) => {
      update((prev) => {
        const existe = prev.asistencias.find(
          (a) =>
            a.claseId === input.claseId &&
            a.alumnoId === input.alumnoId &&
            a.fecha === input.fecha,
        );
        if (existe) {
          return {
            ...prev,
            asistencias: prev.asistencias.map((a) =>
              a.id === existe.id
                ? {
                    ...a,
                    estado: input.estado,
                    esRefuerzo: input.esRefuerzo ?? a.esRefuerzo,
                    updatedAt: new Date().toISOString(),
                  }
                : a,
            ),
          };
        }
        const nueva: Asistencia = {
          id: newId(),
          academiaId: input.academiaId,
          claseId: input.claseId,
          alumnoId: input.alumnoId,
          fecha: input.fecha,
          estado: input.estado,
          rolEnClase: null,
          esRefuerzo: input.esRefuerzo ?? false,
          updatedAt: new Date().toISOString(),
        };
        return { ...prev, asistencias: [...prev.asistencias, nueva] };
      });
    },
    [update],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      db,
      crearAcademia,
      academiaPorSlug: (slug) => db.academias.find((a) => a.slug === slug),
      crearAlumno,
      actualizarAlumno,
      alumnosDe: (academiaId) =>
        db.alumnos.filter((a) => a.academiaId === academiaId),
      crearClase,
      clasesDe: (academiaId) =>
        db.clases.filter((c) => c.academiaId === academiaId),
      responder,
      asistenciasDe: (claseId, fecha) =>
        db.asistencias.filter(
          (a) => a.claseId === claseId && a.fecha === fecha,
        ),
      reset: () => {
        update(() => VACIO);
      },
      cargarDemo: () => {
        update(() => crearDemo());
      },
    }),
    [
      ready,
      db,
      crearAcademia,
      crearAlumno,
      actualizarAlumno,
      crearClase,
      responder,
      update,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return v;
}

export type { Rol };
