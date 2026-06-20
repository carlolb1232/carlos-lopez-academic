"use client";

import { ArrowRight, BookOpen, MapPin, University } from "lucide-react";
import { useAcademicData } from "@/components/AcademicDataProvider";

export function Hero() {
  const { profile } = useAcademicData();

  return (
    <section className="min-h-[620px] border-b border-ink/10 bg-[linear-gradient(90deg,rgba(247,244,236,0.92),rgba(247,244,236,0.74),rgba(247,244,236,0.30)),url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1800&auto=format&fit=crop')] bg-cover bg-center">
      <div className="section-shell grid min-h-[620px] content-center py-16">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded border border-ink/15 bg-white/65 px-3 py-2 text-sm font-semibold text-ink">
            <University size={16} />
            {profile.institution}
          </div>
          <h1 className="max-w-3xl break-words text-4xl font-bold leading-[1.05] text-ink sm:text-6xl lg:text-7xl">
            {profile.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/78">
            {profile.summary}
          </p>
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
            <a
              className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded bg-ink px-5 font-semibold text-white sm:w-auto"
              href="#cursos"
            >
              Ver cursos
              <ArrowRight size={18} />
            </a>
            <a
              className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded border border-ink/18 bg-white/70 px-5 font-semibold sm:w-auto"
              href="#publicaciones"
            >
              <BookOpen size={18} />
              Produccion cientifica
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-ink/72">
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} />
              {profile.location}
            </span>
            <span>{profile.role}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
