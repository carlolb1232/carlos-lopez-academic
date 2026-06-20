"use client";

import { Download, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useAcademicData } from "@/components/AcademicDataProvider";

export function PublicHeader() {
  const { profile } = useAcademicData();

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/92 backdrop-blur">
      <div className="section-shell flex min-h-16 items-center justify-between gap-4">
        <Link className="flex items-center gap-3 focus-ring" href="/">
          <span className="grid h-10 w-10 place-items-center rounded bg-ink text-sm font-bold text-white">
            CL
          </span>
          <span>
            <span className="block text-sm font-bold leading-tight">
              {profile.name}
            </span>
            <span className="block text-xs text-muted">Perfil academico</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-ink/78 md:flex">
          <a className="focus-ring" href="#perfil">
            Perfil
          </a>
          <a className="focus-ring" href="#linea">
            Trayectoria
          </a>
          <a className="focus-ring" href="#cursos">
            Cursos
          </a>
          <a className="focus-ring" href="#foros">
            Foros
          </a>
          <a className="focus-ring" href="#publicaciones">
            Publicaciones
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            className="focus-ring hidden h-10 items-center gap-2 rounded border border-ink/15 px-3 text-sm font-semibold sm:flex"
            href={`mailto:${profile.email}`}
          >
            <Mail size={16} />
            Contacto
          </a>
          <a
            className="focus-ring hidden h-10 items-center gap-2 rounded bg-ocean px-3 text-sm font-semibold text-white sm:flex"
            href="#"
          >
            <Download size={16} />
            CV
          </a>
          <Link
            className="focus-ring grid h-10 w-10 place-items-center rounded bg-ink text-white"
            href="/admin"
            title="Admin"
          >
            <ShieldCheck size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
