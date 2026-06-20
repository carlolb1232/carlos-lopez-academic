"use client";

import { FileText, Filter, Search } from "lucide-react";
import { useAcademicData } from "@/components/AcademicDataProvider";

export function PublicationsSection() {
  const { publications } = useAcademicData();

  return (
    <section className="bg-white py-20" id="publicaciones">
      <div className="section-shell">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-gold">
              Produccion cientifica
            </p>
            <h2 className="mt-3 break-words text-3xl font-bold text-ink sm:text-4xl">
              Articulos, ponencias, informes y trabajos academicos.
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <label className="flex h-11 min-w-64 items-center gap-2 rounded border border-ink/12 bg-paper px-3 text-sm text-muted">
              <Search size={16} />
              <input className="w-full bg-transparent outline-none" placeholder="Buscar publicacion" />
            </label>
            <button className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded border border-ink/12 bg-paper px-4 text-sm font-bold">
              <Filter size={16} />
              Filtrar
            </button>
          </div>
        </div>
        <div className="mt-10 overflow-hidden rounded border border-ink/10 bg-paper">
          <div className="grid grid-cols-[1.4fr_0.5fr_0.7fr_0.7fr] gap-4 border-b border-ink/10 bg-ink px-5 py-4 text-sm font-bold text-white max-md:hidden">
            <span>Titulo</span>
            <span>Año</span>
            <span>Tipo</span>
            <span>Estado</span>
          </div>
          {publications.map((publication) => (
            <article
              className="grid gap-3 border-b border-ink/10 px-5 py-5 last:border-b-0 md:grid-cols-[1.4fr_0.5fr_0.7fr_0.7fr]"
              key={publication.id}
            >
              <div>
                <h3 className="font-bold">{publication.title}</h3>
                <p className="mt-1 text-sm text-ink/65">{publication.authors}</p>
                <p className="mt-1 text-sm text-ink/55">{publication.venue}</p>
              </div>
              <span className="text-sm font-bold text-copper">{publication.year}</span>
              <span className="text-sm font-semibold text-ink/70">{publication.type}</span>
              <span className="inline-flex h-8 w-fit items-center gap-2 rounded bg-white px-3 text-sm font-bold text-moss">
                <FileText size={15} />
                {publication.status}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
