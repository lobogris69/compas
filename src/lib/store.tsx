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
  useRef,
  useState,
} from "react";
import { crearDemo } from "./demo";
import { newId } from "./slug";
import { isSupabaseEnabled } from "./supabase";
import { useAuth } from "./auth";
import * as remote from "./remote";
import type {
  Academia,
  Alumno,
  Asistencia,
  Clase,
  EstadoAsistencia,
  Matricula,
  Miembro,
  Pago,
  PlanPago,
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
  matriculas: Matricula[];
  miembros: Miembro[];
  planes: PlanPago[];
  pagos: Pago[];
}

const VACIO: DB = {
  academias: [],
  alumnos: [],
  clases: [],
  asistencias: [],
  videos: [],
  matriculas: [],
  miembros: [],
  planes: [],
  pagos: [],
};

/** Inserta/actualiza por id (para hidratar desde la nube sin duplicar). */
function upsertById<T extends { id: string }>(arr: T[], items: T[]): T[] {
  const ids = new Set(items.map((i) => i.id));
  return [...arr.filter((a) => !ids.has(a.id)), ...items];
}

/** Sustituye todos los elementos de una academia por los recién cargados. */
function reemplazarPorAcademia<T extends { academiaId: string }>(
  arr: T[],
  academiaId: string,
  frescos: T[],
): T[] {
  return [...arr.filter((a) => a.academiaId !== academiaId), ...frescos];
}

interface StoreValue {
  ready: boolean;
  db: DB;
  /** "local" (localStorage) o "supabase" (modo real). */
  mode: "local" | "supabase";
  /** Carga una academia y sus datos desde Supabase (modo real). No-op en local. */
  cargarAcademia: (slug: string) => Promise<void>;
  /** ¿Se está cargando esa academia desde la nube? */
  cargandoAcademia: (slug: string) => boolean;
  /** Último fallo al guardar en la nube (null si todo va bien). */
  errorGuardado: string | null;
  /** Descarta el aviso de fallo al guardar. */
  descartarError: () => void;
  // Academias
  crearAcademia: (a: Omit<Academia, "id" | "createdAt">) => Academia;
  actualizarAcademia: (id: string, patch: Partial<Academia>) => void;
  /** Borra la academia y todos sus datos (clases, alumnos, asistencias, vídeos). */
  eliminarAcademia: (id: string) => void;
  academiaPorSlug: (slug: string) => Academia | undefined;
  /** ¿Soy el dueño de esta academia? (gestión: panel, ajustes). */
  soyDueno: (academiaId: string) => boolean;
  /** ¿Soy profesor con acceso a esta academia? (por el email de mi sesión). */
  esProfesor: (academiaId: string) => boolean;
  /** ¿Puedo gestionar (subir vídeos, ver estado)? Dueño o profesor. */
  puedeGestionar: (academiaId: string) => boolean;
  /**
   * Carga los teléfonos de los alumnos (solo dueño/profesor). No vienen con el
   * resto del alumno porque son dato de contacto protegido. Llámalo desde las
   * pantallas de gestión que los necesiten.
   */
  cargarTelefonos: (academiaId: string) => void;
  // Miembros (profesores con acceso)
  invitarMiembro: (academiaId: string, email: string) => void;
  quitarMiembro: (id: string) => void;
  miembrosDe: (academiaId: string) => Miembro[];
  // Pagos: planes (modalidades) y pagos registrados
  crearPlan: (p: Omit<PlanPago, "id" | "createdAt">) => PlanPago;
  eliminarPlan: (id: string) => void;
  planesDe: (academiaId: string) => PlanPago[];
  registrarPago: (p: Omit<Pago, "id" | "createdAt">) => Pago;
  eliminarPago: (id: string) => void;
  pagosDe: (academiaId: string) => Pago[];
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
  // Matrículas (alumno ↔ clase; un alumno puede ir a varias)
  matricular: (academiaId: string, alumnoId: string, claseId: string) => void;
  desmatricular: (alumnoId: string, claseId: string) => void;
  clasesDeAlumno: (alumnoId: string) => Clase[];
  alumnosDeClase: (claseId: string) => Alumno[];
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
  /** Pasar lista: marca si un alumno vino de verdad (solo dueño/profesor). */
  marcarAsistencia: (
    academiaId: string,
    claseId: string,
    alumnoId: string,
    fecha: string,
    vino: boolean,
  ) => void;
  /**
   * Historial de asistencia de un alumno: de las veces que se le pasó lista,
   * cuántas vino. Es la base para predecir el balance antes de la clase.
   */
  fiabilidadDe: (alumnoId: string) => { vino: number; total: number } | null;
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

const MODE: "local" | "supabase" = isSupabaseEnabled ? "supabase" : "local";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [db, setDb] = useState<DB>(VACIO);
  const [yo, setYo] = useState<Record<string, string>>({});
  const [owned, setOwned] = useState<string[]>([]);
  const [cargando, setCargando] = useState<string[]>([]); // slugs cargándose (nube)
  const [ready, setReady] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  useEffect(() => {
    setYo(loadYo());
    // Modo nube: la fuente de verdad es Supabase; los datos se cargan por
    // academia bajo demanda (ver cargarAcademia). No sembramos demo.
    if (MODE === "supabase") {
      setDb(VACIO);
      setOwned([]);
      setReady(true);
      return;
    }
    // Modo local: localStorage + demo en la primera visita.
    const loaded = load();
    let ownedIds = loadOwned();
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
    setReady(true);
  }, []);

  // Recalcula de qué academias soy dueño cada vez que cambia la sesión o llegan
  // academias nuevas a memoria. Antes la propiedad solo se marcaba en el momento
  // exacto en que terminaba `cargarAcademia`: si la sesión aún no había resuelto
  // (muy habitual, porque en modo nube `ready` es true al instante), el dueño se
  // quedaba sin Ajustes, sin Pagos y sin zona de peligro hasta recargar entera
  // la página — y navegar no lo arreglaba, porque la academia ya estaba en caché.
  useEffect(() => {
    if (MODE !== "supabase") return;
    const uid = auth.user?.id;
    if (!uid) return;
    const mios = db.academias.filter((a) => a.ownerId === uid).map((a) => a.id);
    if (mios.length === 0) return;
    setOwned((prev) => {
      const faltan = mios.filter((id) => !prev.includes(id));
      return faltan.length ? [...prev, ...faltan] : prev;
    });
  }, [auth.user, db.academias]);

  const persist = (next: DB) => {
    // En modo nube la verdad está en Supabase; no cacheamos datos en localStorage.
    if (MODE !== "local") return;
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

  // Cola de escrituras remotas (modo nube). Serializa los writes a Supabase en
  // el orden en que se piden, para que la academia padre exista antes que sus
  // hijos (clases, alumnos, vídeos, asistencias) y no se viole la clave foránea.
  //
  // Si una escritura falla NO se traga el error: se guarda en `errorGuardado`
  // para que la UI avise. Antes la pantalla decía "guardado" y al recargar el
  // dato no existía, porque en modo nube no cacheamos nada en localStorage.
  const colaRemota = useRef<Promise<unknown>>(Promise.resolve());
  const encolar = useCallback((fn: () => Promise<unknown>) => {
    const run = () =>
      fn().catch((e: unknown) => {
        console.error(e);
        const msg =
          e instanceof Error ? e.message : typeof e === "string" ? e : "";
        setErrorGuardado(
          msg
            ? `No se pudo guardar en la nube: ${msg}`
            : "No se pudo guardar en la nube. Revisa tu conexión y vuelve a intentarlo.",
        );
      });
    colaRemota.current = colaRemota.current.then(run, run);
    return colaRemota.current;
  }, []);

  const crearAcademia: StoreValue["crearAcademia"] = useCallback(
    (input) => {
      const ownerId = MODE === "supabase" ? auth.user?.id ?? null : null;
      const academia: Academia = {
        ...input,
        id: newId(),
        ownerId,
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({ ...prev, academias: [...prev.academias, academia] }));
      setOwned((prev) => {
        const next = [...prev, academia.id];
        if (MODE === "local" && typeof window !== "undefined") {
          window.localStorage.setItem(OWNER_KEY, JSON.stringify(next));
        }
        return next;
      });
      if (MODE === "supabase" && ownerId) {
        encolar(() => remote.crearAcademia(academia, ownerId));
      }
      return academia;
    },
    [update, auth.user],
  );

  const actualizarAcademia: StoreValue["actualizarAcademia"] = useCallback(
    (id, patch) => {
      update((prev) => ({
        ...prev,
        academias: prev.academias.map((a) =>
          a.id === id ? { ...a, ...patch } : a,
        ),
      }));
      if (MODE === "supabase" && patch.reglas) {
        encolar(() => remote.actualizarReglas(id, patch.reglas!));
      }
      if (MODE === "supabase" && patch.recordatorioPago !== undefined) {
        encolar(() => remote.actualizarRecordatorio(id, patch.recordatorioPago!));
      }
    },
    [update, encolar],
  );

  const eliminarAcademia: StoreValue["eliminarAcademia"] = useCallback(
    (id) => {
      // Quita la academia y todos sus datos de memoria.
      update((prev) => ({
        academias: prev.academias.filter((a) => a.id !== id),
        clases: prev.clases.filter((c) => c.academiaId !== id),
        alumnos: prev.alumnos.filter((a) => a.academiaId !== id),
        asistencias: prev.asistencias.filter((a) => a.academiaId !== id),
        videos: prev.videos.filter((v) => v.academiaId !== id),
        matriculas: prev.matriculas.filter((m) => m.academiaId !== id),
        miembros: prev.miembros.filter((m) => m.academiaId !== id),
        planes: prev.planes.filter((p) => p.academiaId !== id),
        pagos: prev.pagos.filter((p) => p.academiaId !== id),
      }));
      // Limpia propiedad e identidad ligera de esa academia.
      setOwned((prev) => {
        const next = prev.filter((x) => x !== id);
        if (MODE === "local" && typeof window !== "undefined") {
          window.localStorage.setItem(OWNER_KEY, JSON.stringify(next));
        }
        return next;
      });
      setYo((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        if (typeof window !== "undefined") {
          window.localStorage.setItem(YO_KEY, JSON.stringify(next));
        }
        return next;
      });
      // La BD borra en cascada los hijos; aquí solo la academia.
      if (MODE === "supabase") encolar(() => remote.eliminarAcademia(id));
    },
    [update, encolar],
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

  // Al entrar con enlace mágico, el alumno "reclama" su ficha: la que lleva su
  // email y aún no tiene dueño pasa a apuntar a su cuenta. A partir de ahí RLS
  // ya le deja editar su perfil, y su identidad deja de depender del navegador.
  // El emparejamiento por email se hace en el servidor (ver remote.vincularAlumno),
  // así que el cliente nunca necesita leer emails ajenos.
  const vinculado = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (MODE !== "supabase") return;
    const email = auth.user?.email;
    const uid = auth.user?.id;
    if (!email || !uid) return;
    for (const ac of db.academias) {
      const clave = `${uid}:${ac.id}`;
      if (vinculado.current.has(clave)) continue;
      vinculado.current.add(clave);
      const yaMia = db.alumnos.find(
        (a) => a.academiaId === ac.id && a.userId === uid,
      );
      if (yaMia) {
        identificarme(ac.id, yaMia.id);
        continue;
      }
      const acId = ac.id;
      encolar(async () => {
        const id = await remote.vincularAlumno(acId, email, uid);
        if (!id) return; // no tenía ficha en esta academia: normal
        update((prev) => ({
          ...prev,
          alumnos: prev.alumnos.map((a) =>
            a.id === id ? { ...a, userId: uid } : a,
          ),
        }));
        identificarme(acId, id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, db.academias, db.alumnos]);

  const crearAlumno: StoreValue["crearAlumno"] = useCallback(
    (input) => {
      const alumno: Alumno = {
        ...input,
        id: newId(),
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({ ...prev, alumnos: [...prev.alumnos, alumno] }));
      if (MODE === "supabase") encolar(() => remote.crearAlumno(alumno));
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
      if (MODE === "supabase") encolar(() => remote.actualizarAlumno(id, patch));
    },
    [update],
  );

  const eliminarAlumno: StoreValue["eliminarAlumno"] = useCallback(
    (id) => {
      update((prev) => ({
        ...prev,
        alumnos: prev.alumnos.filter((a) => a.id !== id),
        // limpia sus respuestas de asistencia y sus matrículas
        asistencias: prev.asistencias.filter((a) => a.alumnoId !== id),
        matriculas: prev.matriculas.filter((m) => m.alumnoId !== id),
      }));
      if (MODE === "supabase") encolar(() => remote.eliminarAlumno(id));
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
      if (MODE === "supabase") encolar(() => remote.crearVideo(video));
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
      if (MODE === "supabase") encolar(() => remote.actualizarVideo(id, patch));
    },
    [update],
  );

  const eliminarVideo: StoreValue["eliminarVideo"] = useCallback(
    (id) => {
      update((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => v.id !== id),
      }));
      if (MODE === "supabase") encolar(() => remote.eliminarVideo(id));
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
      if (MODE === "supabase") encolar(() => remote.crearClase(clase));
      return clase;
    },
    [update],
  );

  const matricular: StoreValue["matricular"] = useCallback(
    (academiaId, alumnoId, claseId) => {
      // Decidir FUERA del updater: React solo garantiza ejecutarlo de forma
      // síncrona en el caso optimizado, así que leer una variable asignada
      // dentro perdía la escritura (la matrícula no llegaba nunca a Supabase).
      if (
        db.matriculas.some(
          (m) => m.alumnoId === alumnoId && m.claseId === claseId,
        )
      ) {
        return; // ya matriculado
      }
      const nueva: Matricula = {
        id: newId(),
        academiaId,
        claseId,
        alumnoId,
        createdAt: new Date().toISOString(),
      };
      update((prev) =>
        prev.matriculas.some(
          (m) => m.alumnoId === alumnoId && m.claseId === claseId,
        )
          ? prev
          : { ...prev, matriculas: [...prev.matriculas, nueva] },
      );
      if (MODE === "supabase") encolar(() => remote.crearMatricula(nueva));
    },
    [db.matriculas, update, encolar],
  );

  const desmatricular: StoreValue["desmatricular"] = useCallback(
    (alumnoId, claseId) => {
      const m = db.matriculas.find(
        (x) => x.alumnoId === alumnoId && x.claseId === claseId,
      );
      if (!m) return;
      update((prev) => ({
        ...prev,
        matriculas: prev.matriculas.filter((x) => x.id !== m.id),
      }));
      if (MODE === "supabase") encolar(() => remote.eliminarMatricula(m.id));
    },
    [db.matriculas, update, encolar],
  );

  const telefonosPedidos = useRef<Set<string>>(new Set());
  const cargarTelefonos: StoreValue["cargarTelefonos"] = useCallback(
    (academiaId) => {
      if (MODE !== "supabase") return;
      if (telefonosPedidos.current.has(academiaId)) return;
      telefonosPedidos.current.add(academiaId);
      remote
        .telefonosDe(academiaId)
        .then((mapa) => {
          if (Object.keys(mapa).length === 0) return;
          update((prev) => ({
            ...prev,
            alumnos: prev.alumnos.map((a) =>
              mapa[a.id] !== undefined ? { ...a, telefono: mapa[a.id] } : a,
            ),
          }));
        })
        .catch((e) => {
          // No es crítico: sin teléfonos la pantalla sigue siendo usable.
          telefonosPedidos.current.delete(academiaId);
          console.error("cargarTelefonos", e);
        });
    },
    [update],
  );

  const invitarMiembro: StoreValue["invitarMiembro"] = useCallback(
    (academiaId, email) => {
      const correo = email.trim().toLowerCase();
      if (!correo) return;
      const yaEsta = db.miembros.some(
        (m) => m.academiaId === academiaId && m.email.toLowerCase() === correo,
      );
      if (yaEsta) return;
      const nuevo: Miembro = {
        id: newId(),
        academiaId,
        email: correo,
        rol: "profesor",
        createdAt: new Date().toISOString(),
      };
      update((prev) =>
        prev.miembros.some(
          (m) => m.academiaId === academiaId && m.email.toLowerCase() === correo,
        )
          ? prev
          : { ...prev, miembros: [...prev.miembros, nuevo] },
      );
      if (MODE === "supabase") encolar(() => remote.crearMiembro(nuevo));
    },
    [db.miembros, update, encolar],
  );

  const quitarMiembro: StoreValue["quitarMiembro"] = useCallback(
    (id) => {
      update((prev) => ({
        ...prev,
        miembros: prev.miembros.filter((m) => m.id !== id),
      }));
      if (MODE === "supabase") encolar(() => remote.eliminarMiembro(id));
    },
    [update, encolar],
  );

  const crearPlan: StoreValue["crearPlan"] = useCallback(
    (input) => {
      const plan: PlanPago = {
        ...input,
        id: newId(),
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({ ...prev, planes: [...prev.planes, plan] }));
      if (MODE === "supabase") encolar(() => remote.crearPlan(plan));
      return plan;
    },
    [update, encolar],
  );

  const eliminarPlan: StoreValue["eliminarPlan"] = useCallback(
    (id) => {
      update((prev) => ({
        ...prev,
        planes: prev.planes.filter((p) => p.id !== id),
      }));
      if (MODE === "supabase") encolar(() => remote.eliminarPlan(id));
    },
    [update, encolar],
  );

  const registrarPago: StoreValue["registrarPago"] = useCallback(
    (input) => {
      const pago: Pago = {
        ...input,
        id: newId(),
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({ ...prev, pagos: [...prev.pagos, pago] }));
      if (MODE === "supabase") encolar(() => remote.crearPago(pago));
      return pago;
    },
    [update, encolar],
  );

  const eliminarPago: StoreValue["eliminarPago"] = useCallback(
    (id) => {
      update((prev) => ({
        ...prev,
        pagos: prev.pagos.filter((p) => p.id !== id),
      }));
      if (MODE === "supabase") encolar(() => remote.eliminarPago(id));
    },
    [update, encolar],
  );

  const responder: StoreValue["responder"] = useCallback(
    (input) => {
      if (MODE === "supabase") encolar(() => remote.responder(input));
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
          asistio: null,
          updatedAt: new Date().toISOString(),
        };
        return { ...prev, asistencias: [...prev.asistencias, nueva] };
      });
    },
    [update],
  );

  const marcarAsistencia: StoreValue["marcarAsistencia"] = useCallback(
    (academiaId, claseId, alumnoId, fecha, vino) => {
      update((prev) => {
        const existe = prev.asistencias.find(
          (a) =>
            a.claseId === claseId &&
            a.alumnoId === alumnoId &&
            a.fecha === fecha,
        );
        if (existe) {
          return {
            ...prev,
            asistencias: prev.asistencias.map((a) =>
              a.id === existe.id
                ? { ...a, asistio: vino, updatedAt: new Date().toISOString() }
                : a,
            ),
          };
        }
        // Alguien que aparece sin haber contestado: se crea su fila.
        const nueva: Asistencia = {
          id: newId(),
          academiaId,
          claseId,
          alumnoId,
          fecha,
          estado: vino ? "si" : "no",
          rolEnClase: null,
          esRefuerzo: false,
          asistio: vino,
          updatedAt: new Date().toISOString(),
        };
        return { ...prev, asistencias: [...prev.asistencias, nueva] };
      });
      if (MODE === "supabase") {
        encolar(() =>
          remote.marcarAsistencia(academiaId, claseId, alumnoId, fecha, vino),
        );
      }
    },
    [update, encolar],
  );

  const cargarAcademia: StoreValue["cargarAcademia"] = useCallback(
    async (slug) => {
      if (MODE !== "supabase") return;
      // ya en memoria → no recargar
      if (db.academias.some((a) => a.slug === slug)) return;
      setCargando((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
      try {
        const ac = await remote.academiaPorSlug(slug);
        if (ac) {
          const [
            alumnos,
            clases,
            videos,
            asistencias,
            matriculas,
            miembros,
            planes,
            pagos,
          ] = await Promise.all([
            remote.alumnosDe(ac.id),
            remote.clasesDe(ac.id),
            remote.videosDe(ac.id),
            remote.asistenciasDeAcademia(ac.id),
            remote.matriculasDe(ac.id),
            remote.miembrosDe(ac.id),
            remote.planesDe(ac.id),
            remote.pagosDe(ac.id),
          ]);
          setDb((prev) => ({
            academias: upsertById(prev.academias, [ac]),
            alumnos: reemplazarPorAcademia(prev.alumnos, ac.id, alumnos),
            clases: reemplazarPorAcademia(prev.clases, ac.id, clases),
            videos: reemplazarPorAcademia(prev.videos, ac.id, videos),
            asistencias: reemplazarPorAcademia(
              prev.asistencias,
              ac.id,
              asistencias,
            ),
            matriculas: reemplazarPorAcademia(
              prev.matriculas,
              ac.id,
              matriculas,
            ),
            miembros: reemplazarPorAcademia(prev.miembros, ac.id, miembros),
            planes: reemplazarPorAcademia(prev.planes, ac.id, planes),
            pagos: reemplazarPorAcademia(prev.pagos, ac.id, pagos),
          }));
          if (ac.ownerId && auth.user && ac.ownerId === auth.user.id) {
            setOwned((prev) =>
              prev.includes(ac.id) ? prev : [...prev, ac.id],
            );
          }
        }
      } catch (e) {
        console.error("cargarAcademia", e);
      } finally {
        setCargando((prev) => prev.filter((s) => s !== slug));
      }
    },
    [db.academias, auth.user],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      db,
      mode: MODE,
      cargarAcademia,
      cargandoAcademia: (slug) => cargando.includes(slug),
      errorGuardado,
      descartarError: () => setErrorGuardado(null),
      crearAcademia,
      actualizarAcademia,
      eliminarAcademia,
      academiaPorSlug: (slug) => db.academias.find((a) => a.slug === slug),
      soyDueno: (academiaId) => owned.includes(academiaId),
      esProfesor: (academiaId) => {
        const email = auth.user?.email?.toLowerCase();
        if (!email) return false;
        return db.miembros.some(
          (m) =>
            m.academiaId === academiaId && m.email.toLowerCase() === email,
        );
      },
      puedeGestionar: (academiaId) => {
        if (owned.includes(academiaId)) return true;
        const email = auth.user?.email?.toLowerCase();
        if (!email) return false;
        return db.miembros.some(
          (m) =>
            m.academiaId === academiaId && m.email.toLowerCase() === email,
        );
      },
      cargarTelefonos,
      invitarMiembro,
      quitarMiembro,
      miembrosDe: (academiaId) =>
        db.miembros.filter((m) => m.academiaId === academiaId),
      crearPlan,
      eliminarPlan,
      planesDe: (academiaId) =>
        db.planes.filter((p) => p.academiaId === academiaId),
      registrarPago,
      eliminarPago,
      pagosDe: (academiaId) =>
        db.pagos.filter((p) => p.academiaId === academiaId),
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
      matricular,
      desmatricular,
      clasesDeAlumno: (alumnoId) => {
        const ids = new Set(
          db.matriculas
            .filter((m) => m.alumnoId === alumnoId)
            .map((m) => m.claseId),
        );
        return db.clases.filter((c) => ids.has(c.id));
      },
      alumnosDeClase: (claseId) => {
        const ids = new Set(
          db.matriculas
            .filter((m) => m.claseId === claseId)
            .map((m) => m.alumnoId),
        );
        return db.alumnos.filter((a) => ids.has(a.id));
      },
      responder,
      asistenciasDe: (claseId, fecha) =>
        db.asistencias.filter(
          (a) => a.claseId === claseId && a.fecha === fecha,
        ),
      marcarAsistencia,
      fiabilidadDe: (alumnoId) => {
        const pasadas = db.asistencias.filter(
          (a) => a.alumnoId === alumnoId && a.asistio !== null,
        );
        if (pasadas.length === 0) return null;
        return {
          vino: pasadas.filter((a) => a.asistio).length,
          total: pasadas.length,
        };
      },
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
      cargando,
      errorGuardado,
      cargarAcademia,
      crearAcademia,
      actualizarAcademia,
      eliminarAcademia,
      identificarme,
      crearAlumno,
      actualizarAlumno,
      eliminarAlumno,
      crearVideo,
      actualizarVideo,
      eliminarVideo,
      crearClase,
      matricular,
      desmatricular,
      marcarAsistencia,
      cargarTelefonos,
      invitarMiembro,
      quitarMiembro,
      crearPlan,
      eliminarPlan,
      registrarPago,
      eliminarPago,
      responder,
      update,
      auth.user,
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
