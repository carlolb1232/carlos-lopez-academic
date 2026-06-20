import {
  BookOpen,
  BriefcaseBusiness,
  Medal,
  Presentation,
} from "lucide-react";
import type { AcademicData } from "@/lib/types";

export const profile: AcademicData["profile"] = {
  name: "Carlos Fernando López Rengifo",
  role: "Docente universitario",
  institution: "Universidad Nacional del Centro del Perú",
  location: "Huancayo, Perú",
  summary:
    "Perfil academico en construccion para presentar trayectoria docente, investigacion, materiales de cursos y produccion cientifica en un solo lugar.",
  email: "correo.institucional@uncp.edu.pe",
  interests: [
    "Docencia universitaria",
    "Investigacion aplicada",
    "Gestion academica",
    "Produccion cientifica",
  ],
  metrics: [
    { label: "Cursos historicos", value: "24+" },
    { label: "Publicaciones", value: "18+" },
    { label: "Años de docencia", value: "20+" },
    { label: "Recursos academicos", value: "120+" },
  ],
};

export const timeline: AcademicData["timeline"] = [
  {
    id: "timeline-2002",
    year: "2002",
    title: "Inicio de trayectoria academica",
    type: "Formacion",
    description:
      "Registro inicial de estudios superiores, especializacion y primeras experiencias profesionales.",
  },
  {
    id: "timeline-2008",
    year: "2008",
    title: "Ingreso a la docencia universitaria",
    type: "Docencia",
    description:
      "Inicio de cursos universitarios, asesorias y trabajo directo con estudiantes.",
  },
  {
    id: "timeline-2014",
    year: "2014",
    title: "Consolidacion en investigacion",
    type: "Investigacion",
    description:
      "Participacion en proyectos, articulos y presentaciones academicas.",
  },
  {
    id: "timeline-2018",
    year: "2018",
    title: "Gestion academica y comisiones",
    type: "Gestion",
    description:
      "Participacion en coordinaciones, comites y mejora de procesos universitarios.",
  },
  {
    id: "timeline-2022",
    year: "2022",
    title: "Repositorio academico personal",
    type: "Publicaciones",
    description:
      "Organizacion de articulos, trabajos cientificos y materiales de cursos para consulta publica.",
  },
  {
    id: "timeline-2026",
    year: "2026",
    title: "Perfil profesional digital",
    type: "Actualidad",
    description:
      "Lanzamiento de una web academica con CV, cursos, historico, publicaciones y administracion propia.",
  },
];

export const courses: AcademicData["courses"] = [
  {
    code: "CUR-401",
    name: "Seminario de Investigacion",
    period: "2026-I",
    status: "Actual",
    school: "Facultad UNCP",
    files: 8,
    description:
      "Materiales, silabo, lecturas base, formatos de avance y recursos para trabajos de investigacion.",
  },
  {
    code: "CUR-302",
    name: "Metodologia Cientifica",
    period: "2026-I",
    status: "Actual",
    school: "Facultad UNCP",
    files: 12,
    description:
      "Guias de clase, rubricas, practicas y bibliografia organizada por unidad.",
  },
  {
    code: "CUR-215",
    name: "Curso Historico de Especialidad",
    period: "2025-II",
    status: "Historico",
    school: "Facultad UNCP",
    files: 19,
    description:
      "Curso archivado con materiales disponibles para consulta y referencia de estudiantes.",
  },
];

export const courseFiles: AcademicData["courseFiles"] = [
  {
    id: "file-401-silabo",
    courseCode: "CUR-401",
    title: "Silabo del curso",
    type: "PDF",
    visibility: "Publico",
    uploadedAt: "2026-03-12",
  },
  {
    id: "file-401-formato",
    courseCode: "CUR-401",
    title: "Formato de avance de investigacion",
    type: "DOCX",
    visibility: "Publico",
    uploadedAt: "2026-03-20",
  },
  {
    id: "file-401-rubrica",
    courseCode: "CUR-401",
    title: "Rubrica de exposicion final",
    type: "PDF",
    visibility: "Privado",
    uploadedAt: "2026-04-02",
  },
  {
    id: "file-302-unidad-1",
    courseCode: "CUR-302",
    title: "Unidad 1 - Fundamentos metodologicos",
    type: "PPTX",
    visibility: "Publico",
    uploadedAt: "2026-03-18",
  },
  {
    id: "file-302-guia-1",
    courseCode: "CUR-302",
    title: "Guia de practica 01",
    type: "PDF",
    visibility: "Publico",
    uploadedAt: "2026-03-22",
  },
  {
    id: "file-215-lecturas",
    courseCode: "CUR-215",
    title: "Archivo historico de lecturas",
    type: "ZIP",
    visibility: "Publico",
    uploadedAt: "2025-11-10",
  },
];

export const courseForums: AcademicData["courseForums"] = [
  {
    id: "forum-401-01",
    courseCode: "CUR-401",
    courseName: "Seminario de Investigacion",
    title: "Dudas sobre el planteamiento del problema",
    status: "Abierto",
    replies: 8,
    likes: 16,
    lastActivity: "Hace 2 horas",
    excerpt:
      "Espacio para discutir formulacion del problema, variables, objetivos e hipotesis del proyecto.",
    thread: [
      {
        id: "reply-401-1",
        author: "Estudiante",
        body: "Profesor, si mi tema tiene dos variables, debo plantear un problema general o dos problemas especificos?",
        likes: 5,
        level: 1,
      },
      {
        id: "reply-401-2",
        author: "Carlos F. López Rengifo",
        body: "Parte por un problema general que integre ambas variables. Luego formula problemas especificos para cada relacion que quieras observar.",
        likes: 9,
        level: 2,
      },
      {
        id: "reply-401-3",
        author: "Estudiante",
        body: "Entonces los objetivos especificos deben corresponder uno a uno con esos problemas especificos.",
        likes: 3,
        level: 3,
      },
    ],
  },
  {
    id: "forum-302-01",
    courseCode: "CUR-302",
    courseName: "Metodologia Cientifica",
    title: "Bibliografia para enfoque cuantitativo",
    status: "Abierto",
    replies: 5,
    likes: 11,
    lastActivity: "Ayer",
    excerpt:
      "Recomendaciones de lecturas, normas de citacion y ejemplos para trabajos de metodologia.",
    thread: [
      {
        id: "reply-302-1",
        author: "Estudiante",
        body: "Comparto una duda sobre que autores conviene usar para justificar el enfoque cuantitativo.",
        likes: 4,
        level: 1,
      },
      {
        id: "reply-302-2",
        author: "Carlos F. López Rengifo",
        body: "Usen autores base del silabo y complementen con articulos recientes del area de aplicacion.",
        likes: 7,
        level: 2,
      },
    ],
  },
  {
    id: "forum-215-01",
    courseCode: "CUR-215",
    courseName: "Curso Historico de Especialidad",
    title: "Consulta sobre materiales historicos",
    status: "Solo lectura",
    replies: 13,
    likes: 24,
    lastActivity: "2025-II",
    excerpt:
      "Foro archivado para conservar preguntas frecuentes y respuestas utiles de ciclos anteriores.",
    thread: [
      {
        id: "reply-215-1",
        author: "Egresado",
        body: "El material de lecturas sigue siendo util como referencia para tesis?",
        likes: 6,
        level: 1,
      },
      {
        id: "reply-215-2",
        author: "Carlos F. López Rengifo",
        body: "Si, pero revisen si existen ediciones mas recientes antes de citar.",
        likes: 10,
        level: 2,
      },
      {
        id: "reply-215-3",
        author: "Estudiante",
        body: "Seria bueno mantener el hilo con enlaces actualizados.",
        likes: 8,
        level: 3,
      },
    ],
  },
];

export const publications: AcademicData["publications"] = [
  {
    id: "publication-2025-article",
    title: "Articulo cientifico sobre investigacion aplicada",
    year: "2025",
    type: "Articulo",
    venue: "Revista academica",
    authors: "Carlos F. López Rengifo; coautores por confirmar",
    status: "Publicado",
  },
  {
    id: "publication-2024-congress",
    title: "Trabajo presentado en congreso universitario",
    year: "2024",
    type: "Ponencia",
    venue: "Congreso nacional",
    authors: "Carlos F. López Rengifo",
    status: "Disponible",
  },
  {
    id: "publication-2023-report",
    title: "Informe tecnico de proyecto academico",
    year: "2023",
    type: "Informe",
    venue: "Repositorio institucional",
    authors: "Equipo de investigacion",
    status: "Archivo",
  },
];

export const adminCards = [
  {
    title: "Perfil profesional",
    description: "Actualizar foto, bio, cargos, formacion, enlaces y datos de contacto.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Cursos",
    description: "Crear cursos actuales, archivarlos por semestre y subir materiales.",
    icon: BookOpen,
  },
  {
    title: "Publicaciones",
    description: "Registrar articulos, ponencias, libros, DOI, coautores y archivos.",
    icon: Presentation,
  },
  {
    title: "Linea del tiempo",
    description: "Agregar hitos de formacion, docencia, investigacion y reconocimientos.",
    icon: Medal,
  },
];
