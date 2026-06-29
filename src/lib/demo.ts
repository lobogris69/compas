// Datos de demostración: una academia de salsa/bachata con alumnos y clases,
// para que la app se vea viva nada más abrirla (modo local).

import { newId, slugify } from "./slug";
import {
  type Academia,
  type Alumno,
  type Asistencia,
  type Clase,
  REGLAS_POR_DEFECTO,
  type Rol,
  type Video,
} from "./types";

export interface DemoData {
  academias: Academia[];
  alumnos: Alumno[];
  clases: Clase[];
  asistencias: Asistencia[];
  videos: Video[];
}

const NOMBRES_LEADER = [
  "Carlos",
  "Miguel",
  "Javi",
  "Andrés",
  "Pablo",
  "Rubén",
  "Dani",
  "Sergio",
  "Marco",
  "Iván",
];
const NOMBRES_FOLLOWER = [
  "Lucía",
  "María",
  "Sara",
  "Elena",
  "Paula",
  "Carmen",
  "Noa",
  "Irene",
];
const NOMBRES_AMBOS = ["Alex", "Sam", "Cris", "Vega"];

function alumno(
  academiaId: string,
  nombre: string,
  rol: Rol,
  nivel: Alumno["nivel"],
): Alumno {
  return {
    id: newId(),
    academiaId,
    nombre,
    rol,
    nivel,
    sexo: "nd",
    estilos: ["Salsa", "Bachata"],
    fotoUrl: null,
    bio: "",
    bailandoDesde: null,
    instagram: null,
    visibilidad: "academia",
    createdAt: new Date().toISOString(),
  };
}

/** Fecha ISO (yyyy-mm-dd) del próximo día de la semana dado. */
export function proximaFecha(diaSemana: number): string {
  const hoy = new Date();
  const delta = (diaSemana - hoy.getDay() + 7) % 7;
  const d = new Date(hoy);
  d.setDate(hoy.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function crearDemo(): DemoData {
  const academiaId = newId();
  const academia: Academia = {
    id: academiaId,
    slug: slugify("Salsa Studio Madrid"),
    nombre: "Salsa Studio Madrid",
    emoji: "💃",
    color: "#7c4dff",
    estilos: ["Salsa", "Bachata", "Kizomba"],
    reglas: { ...REGLAS_POR_DEFECTO },
    createdAt: new Date().toISOString(),
  };

  const alumnos: Alumno[] = [
    ...NOMBRES_LEADER.map((n, i) =>
      alumno(academiaId, n, "leader", i < 6 ? "medio" : "principiante"),
    ),
    ...NOMBRES_FOLLOWER.map((n, i) =>
      alumno(academiaId, n, "follower", i < 4 ? "medio" : "principiante"),
    ),
    ...NOMBRES_AMBOS.map((n) => alumno(academiaId, n, "ambos", "avanzado")),
  ];

  const clases: Clase[] = [
    {
      id: newId(),
      academiaId,
      nombre: "Salsa Intermedio",
      nivel: "medio",
      estilo: "Salsa",
      diaSemana: 4, // jueves
      hora: "20:00",
      sala: "Sala A",
      aforo: 24,
      createdAt: new Date().toISOString(),
    },
    {
      id: newId(),
      academiaId,
      nombre: "Bachata Principiantes",
      nivel: "principiante",
      estilo: "Bachata",
      diaSemana: 2, // martes
      hora: "19:00",
      sala: "Sala B",
      aforo: 20,
      createdAt: new Date().toISOString(),
    },
  ];

  // La clase de salsa del jueves: vienen muchos leaders y pocas followers
  // (descompensada a propósito, para que se vea el motor en acción).
  const claseSalsa = clases[0];
  const fecha = proximaFecha(claseSalsa.diaSemana);
  const vienen = [
    ...NOMBRES_LEADER.slice(0, 8), // 8 leaders
    ...NOMBRES_FOLLOWER.slice(0, 3), // 3 followers
    "Alex", // 1 ambos
  ];
  const asistencias: Asistencia[] = vienen.map((n) => {
    const al = alumnos.find((a) => a.nombre === n)!;
    return {
      id: newId(),
      academiaId,
      claseId: claseSalsa.id,
      alumnoId: al.id,
      fecha,
      estado: "si",
      rolEnClase: null,
      esRefuerzo: false,
      updatedAt: new Date().toISOString(),
    };
  });

  const video = (
    titulo: string,
    categoria: string,
    url: string,
    descripcion = "",
  ): Video => ({
    id: newId(),
    academiaId,
    titulo,
    categoria,
    url,
    descripcion,
    createdAt: new Date().toISOString(),
  });

  const videos: Video[] = [
    video(
      "El Sombrero",
      "Figuras",
      "https://www.youtube.com/results?search_query=salsa+el+sombrero",
      "Figura de salsa paso a paso. Repásala antes de la próxima clase.",
    ),
    video(
      "Enchufla doble",
      "Figuras",
      "https://www.youtube.com/results?search_query=salsa+enchufla+doble",
      "Variación de la enchufla con doble vuelta.",
    ),
    video(
      "Actuación Gala Fin de Curso 2025",
      "Actuaciones",
      "https://www.youtube.com/results?search_query=gala+salsa",
      "Nuestra actuación de la gala. ¡Gracias a todos!",
    ),
  ];

  return { academias: [academia], alumnos, clases, asistencias, videos };
}
