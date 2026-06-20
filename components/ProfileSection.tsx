"use client";

import { Award, ExternalLink, Mail } from "lucide-react";
import { useAcademicData } from "@/components/AcademicDataProvider";

export function ProfileSection() {
  const { profile } = useAcademicData();

  return (
    <section className="bg-paper py-20" id="perfil">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-copper">
            Perfil profesional
          </p>
          <h2 className="mt-3 break-words text-3xl font-bold text-ink sm:text-4xl">
            Una presencia academica clara, actualizable y propia.
          </h2>
          <p className="mt-5 text-base leading-8 text-ink/72">
            Este espacio reunira su hoja de vida, experiencia docente,
            investigacion, archivos de clase y produccion cientifica. Los datos
            actuales son de muestra hasta reemplazarlos por informacion validada.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {profile.interests.map((interest) => (
              <span
                className="rounded border border-ink/12 bg-white px-3 py-2 text-sm font-semibold text-ink/78"
                key={interest}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {profile.metrics.map((metric) => (
            <div className="rounded border border-ink/10 bg-white p-6 shadow-soft" key={metric.label}>
              <p className="text-3xl font-bold text-ocean">{metric.value}</p>
              <p className="mt-2 text-sm font-semibold text-muted">{metric.label}</p>
            </div>
          ))}
          <div className="rounded border border-ink/10 bg-ink p-6 text-white sm:col-span-2">
            <Award size={24} />
            <p className="mt-4 text-lg font-bold">Enlaces academicos</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
              <a className="inline-flex items-center gap-2 rounded bg-white/10 px-3 py-2" href="#">
                ORCID <ExternalLink size={14} />
              </a>
              <a className="inline-flex items-center gap-2 rounded bg-white/10 px-3 py-2" href="#">
                Google Scholar <ExternalLink size={14} />
              </a>
              <a className="inline-flex items-center gap-2 rounded bg-white/10 px-3 py-2" href={`mailto:${profile.email}`}>
                Email <Mail size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
