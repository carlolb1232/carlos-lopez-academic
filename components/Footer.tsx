"use client";

import { Mail, MapPin, University } from "lucide-react";
import { useAcademicData } from "@/components/AcademicDataProvider";
import { VisitCounter } from "@/components/VisitCounter";

export function Footer() {
  const { profile } = useAcademicData();

  return (
    <footer className="bg-ink py-10 text-white">
      <div className="section-shell flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className="text-lg font-bold">{profile.name}</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/68">
            Sitio academico para CV, cursos, publicaciones, trayectoria y
            repositorio de materiales.
          </p>
        </div>
        <div className="grid gap-2 text-sm font-semibold text-white/78">
          <span className="inline-flex items-center gap-2">
            <University size={16} />
            {profile.institution}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin size={16} />
            {profile.location}
          </span>
          <span className="inline-flex items-center gap-2">
            <Mail size={16} />
            {profile.email}
          </span>
          <VisitCounter />
        </div>
      </div>
    </footer>
  );
}
