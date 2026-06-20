"use client";

import { Archive, FileText, FileUp, FolderOpen } from "lucide-react";
import { useAcademicData } from "@/components/AcademicDataProvider";

export function CoursesSection() {
  const { courseFiles, courses } = useAcademicData();

  return (
    <section className="bg-paper py-20" id="cursos">
      <div className="section-shell">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-ocean">
              Cursos y materiales
            </p>
            <h2 className="mt-3 break-words text-3xl font-bold text-ink sm:text-4xl">
              Cursos actuales con historico por semestre.
            </h2>
          </div>
          <div className="inline-flex rounded border border-ink/12 bg-white p-1 text-sm font-bold">
            <span className="rounded bg-ink px-3 py-2 text-white">Actuales</span>
            <span className="px-3 py-2 text-ink/62">Historico</span>
          </div>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {courses.map((course) => (
            <article className="rounded border border-ink/10 bg-white p-6 shadow-soft" key={course.code}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-copper">{course.code}</p>
                  <h3 className="mt-2 text-xl font-bold leading-7">{course.name}</h3>
                </div>
                <span className="rounded bg-ocean/10 px-2 py-1 text-xs font-bold text-ocean">
                  {course.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-ink/68">{course.description}</p>
              <div className="mt-6 grid gap-3 text-sm font-semibold text-ink/70">
                <span className="inline-flex items-center gap-2">
                  <Archive size={16} />
                  {course.period}
                </span>
                <span className="inline-flex items-center gap-2">
                  <FolderOpen size={16} />
                  {course.files} archivos
                </span>
              </div>
              <div className="mt-5 grid gap-2 border-t border-ink/10 pt-4">
                {courseFiles
                  .filter((file) => file.courseCode === course.code && file.visibility === "Publico")
                  .slice(0, 2)
                  .map((file) => (
                    <a
                      className="inline-flex items-center justify-between gap-3 rounded bg-paper px-3 py-2 text-sm font-semibold text-ink/72"
                      href={file.fileUrl || undefined}
                      key={`${course.code}-${file.title}`}
                      rel="noreferrer"
                      target={file.fileUrl ? "_blank" : undefined}
                    >
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <FileText className="shrink-0 text-ocean" size={15} />
                        <span className="truncate">{file.title}</span>
                      </span>
                      <span className="shrink-0 text-xs text-copper">{file.type}</span>
                    </a>
                  ))}
              </div>
              <button className="focus-ring mt-6 inline-flex h-10 items-center gap-2 rounded bg-ink px-4 text-sm font-bold text-white">
                <FileUp size={16} />
                Ver materiales
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
