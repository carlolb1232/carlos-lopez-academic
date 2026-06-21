"use client";

import {
  Download,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useAcademicData } from "@/components/AcademicDataProvider";
import { useCommunityAuth } from "@/components/CommunityAuthProvider";

export function PublicHeader() {
  const { profile } = useAcademicData();
  const {
    authReady,
    displayName,
    openAuth,
    openPasswordChange,
    signOut,
    user,
  } = useCommunityAuth();

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
          {authReady && user ? (
            <div className="hidden items-center gap-2 rounded border border-ink/12 bg-white pl-3 sm:flex">
              <UserRound size={16} className="text-ocean" />
              <span className="max-w-32 truncate text-sm font-bold">
                {displayName}
              </span>
              <button
                aria-label="Cambiar contraseña"
                className="focus-ring grid h-10 w-10 place-items-center border-l border-ink/10 text-ocean"
                onClick={openPasswordChange}
                title="Cambiar contraseña"
              >
                <KeyRound size={16} />
              </button>
              <button
                aria-label="Cerrar sesión"
                className="focus-ring grid h-10 w-10 place-items-center border-l border-ink/10 text-copper"
                onClick={() => void signOut()}
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              className="focus-ring inline-flex h-10 items-center gap-2 rounded border border-ink/15 bg-white px-3 text-sm font-semibold"
              onClick={() => openAuth("login")}
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Ingresar</span>
            </button>
          )}
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
