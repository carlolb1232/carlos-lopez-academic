"use client";

import { BookOpen, FileText, GraduationCap, Landmark, Medal, Microscope } from "lucide-react";
import { useAcademicData } from "@/components/AcademicDataProvider";

const timelineIcons = {
  Formacion: GraduationCap,
  Docencia: BookOpen,
  Investigacion: Microscope,
  Gestion: Landmark,
  Publicaciones: FileText,
  Actualidad: Medal,
};

export function TimelineSection() {
  const { timeline } = useAcademicData();

  return (
    <section className="bg-white py-20" id="linea">
      <div className="section-shell">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-moss">
            Linea del tiempo
          </p>
          <h2 className="mt-3 break-words text-3xl font-bold text-ink sm:text-4xl">
            Evolucion profesional conectada con cursos y publicaciones.
          </h2>
        </div>
        <div className="mt-12 grid gap-5">
          {timeline.map((item) => {
            const Icon = timelineIcons[item.type as keyof typeof timelineIcons] ?? Medal;
            return (
              <article
                className="grid gap-4 rounded border border-ink/10 bg-paper p-5 shadow-sm md:grid-cols-[110px_56px_1fr]"
                key={item.id}
              >
                <div className="text-2xl font-bold text-copper">{item.year}</div>
                <div className="grid h-12 w-12 place-items-center rounded bg-white text-ocean">
                  <Icon size={23} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <span className="rounded bg-moss/10 px-2 py-1 text-xs font-bold text-moss">
                      {item.type}
                    </span>
                  </div>
                  <p className="mt-2 leading-7 text-ink/70">{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
