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
  Video,
} from "./types";

const STORAGE_KEY = "compas:data:v1";
const YO_KEY = "compas:yo:v1"; // identidad ligera del alumno en modo local
const OWNER_KEY = "compas:dueno:v1"; // academias de las que soy dueño (modo local)

interface DB {
  academias: Academia[];
  alumnos: Alumno[];
  clases: Clase[];
  asistencias: Asistencia[];
  videos: Video[];
}

const VACIO: DB = {
  academias: [],
  alumnos: [],
  clases: [],
  asistencias: [],
  videos: [],
};

interface StoreValue {
  ready: boolean;
  db: DB;
  // Academias
  crearAcademia: (a: Omit<Academia, "id" | "createdAt">) => Academia;
  actualizarAcademia: (id: string, patch: Partial<Academia>) => void;
  academiaPorSlug: (slug: string) => Academia | undefined;
  /** ¿Soy el dueño de esta academia? (gestión: panel, ajustes). */
  soyDueno: (academiaId: string) => boolean;
  // Identidad ligera del alumno (modo local): qué alumno "soy" en cada academia
  yoEn: (academiaId: string) => string | null;
  identificarme: (academiaId: string, alumnoId: string) => void;
  // Alumnos
  crearAlumno: (a: Omit<Alumno, "id" | "createdAt">) => Alumno;
  actualizarAlumno: (id: string, patch: Partial<Alumno>) => void;
  eliminarAlumno: (id: string) => void; // dar de baja
  alumnosDe: (academiaId: string) => Alumno[];
  // Vídeos
  crearVideo: (v: Omit<Video, "id" | "createdAt">) => Video;
  actualizarVideo: (id: string, patch: Partial<Video>) => void;
  eliminarVideo: (id: string) => void;
  videosDe: (academiaId: string) => Video[];
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

function loadYo(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(YO_KEY) || "{}");
  } catch {
    return {};
  }
}

function loadOwned(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(OWNER_KEY) || "[]");
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(VACIO);
  const [yo, setYo] = useState<Record<string, string>>({});
  const [owned, setOwned] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = load();
    let ownedIds = loadOwned();
    // Primera visita: sembramos una academia de demo para que se vea viva,
    // y te marcamos como su dueño para poder probar la gestión.
    if (loaded.academias.length === 0) {
      const demo = crearDemo();
      setDb(demo);
      persist(demo);
      ownedIds = [...ownedIds, demo.academias[0].id];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(OWNER_KEY, JSON.stringify(ownedIds));
      }
    } else {
      setDb(loaded);
    }
    setOwned(ownedIds);
    setYo(loadYo());
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
      setOwned((prev) => {
        const next = [...prev, academia.id];
        if (typeof window !== "undefined") {
          window.localStorage.setItem(OWNER_KEY, JSON.stringify(next));
        }
        return next;
      });
      return academia;
    },
    [update],
  );

  const actualizarAcademia: StoreValue["actualizarAcademia"] = useCallback(
    (id, patch) => {
      update((prev) => ({
        ...prev,
        academias: prev.academias.map((a) =>
          a.id === id ? { ...a, ...patch } : a,
        ),
      }));
    },
    [update],
  );

  const identificarme: StoreValue["identificarme"] = useCallback(
    (academiaId, alumnoId) => {
      setYo((prev) => {
        const next = { ...prev, [academiaId]: alumnoId };
        if (typeof window !== "undefined") {
          window.localStorage.setItem(YO_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    [],
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

  const eliminarAlumno: StoreValue["eliminarAlumno"] = useCallback(
    (id) => {
      update((prev) => ({
        ...prev,
        alumnos: prev.alumnos.filter((a) => a.id !== id),
        // limpia sus respuestas de asistencia
        asistencias: prev.asistencias.filter((a) => a.alumnoId !== id),
      }));
    },
    [update],
  );

  const crearVideo: StoreValue["crearVideo"] = useCallback(
    (input) => {
      const video: Video = {
        ...input,
        id: newId(),
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({ ...prev, videos: [...prev.videos, video] }));
      return video;
    },
    [update],
  );

  const actualizarVideo: StoreValue["actualizarVideo"] = useCallback(
    (id, patch) => {
      update((prev) => ({
        ...prev,
        videos: prev.videos.map((v) => (v.id === id ? { ...v, ...patch } : v)),
      }));
    },
    [update],
  );

  const eliminarVideo: StoreValue["eliminarVideo"] = useCallback(
    (id) => {
      update((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => v.id !== id),
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
      actualizarAcademia,
      academiaPorSlug: (slug) => db.academias.find((a) => a.slug === slug),
      soyDueno: (academiaId) => owned.includes(academiaId),
      yoEn: (academiaId) => yo[academiaId] ?? null,
      identificarme,
      crearAlumno,
      actualizarAlumno,
      eliminarAlumno,
      alumnosDe: (academiaId) =>
        db.alumnos.filter((a) => a.academiaId === academiaId),
      crearVideo,
      actualizarVideo,
      eliminarVideo,
      videosDe: (academiaId) =>
        db.videos
          .filter((v) => v.academiaId === academiaId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
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
      yo,
      owned,
      crearAcademia,
      actualizarAcademia,
      identificarme,
      crearAlumno,
      actualizarAlumno,
      eliminarAlumno,
      crearVideo,
      actualizarVideo,
      eliminarVideo,
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
