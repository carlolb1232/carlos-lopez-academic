"use client";

import {
  Download,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAcademicData } from "@/components/AcademicDataProvider";
import { useCommunityAuth } from "@/components/CommunityAuthProvider";

const navigation = [
  ["Perfil", "#perfil"],
  ["Trayectoria", "#linea"],
  ["Cursos", "#cursos"],
  ["Foros", "#foros"],
  ["Publicaciones", "#publicaciones"],
];

export function PublicHeader() {
  const { profile } = useAcademicData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    authReady,
    displayName,
    openAuth,
    openPasswordChange,
    signOut,
    user,
  } = useCommunityAuth();

  useEffect(() => {
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/92 backdrop-blur">
      <div className="section-shell flex min-h-16 items-center justify-between gap-4">
        <Link
          className="flex min-w-0 items-center gap-3 focus-ring"
          href="/"
          onClick={() => setMobileOpen(false)}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-ink text-sm font-bold text-white">
            CL
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold leading-tight">
              {profile.name}
            </span>
            <span className="block text-xs text-muted">Perfil academico</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-ink/78 md:flex">
          {navigation.map(([label, href]) => (
            <a className="focus-ring" href={href} key={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {authReady && user ? (
            <div className="flex items-center gap-2 rounded border border-ink/12 bg-white pl-3">
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
              Ingresar
            </button>
          )}
          <a
            className="focus-ring hidden h-10 items-center gap-2 rounded border border-ink/15 px-3 text-sm font-semibold lg:flex"
            href={`mailto:${profile.email}`}
          >
            <Mail size={16} />
            Contacto
          </a>
          <a
            className="focus-ring hidden h-10 items-center gap-2 rounded bg-ocean px-3 text-sm font-semibold text-white lg:flex"
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

        <button
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded border border-ink/15 bg-white md:hidden"
          onClick={() => setMobileOpen((current) => !current)}
          type="button"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-ink/10 bg-white shadow-soft md:hidden">
          <div className="section-shell grid gap-1 py-3 text-sm font-semibold">
            {navigation.map(([label, href]) => (
              <a
                className="focus-ring rounded px-3 py-3 hover:bg-paper"
                href={href}
                key={href}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
            <div className="my-2 border-t border-ink/10" />
            {authReady && user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 text-ink/70">
                  <UserRound size={17} className="text-ocean" />
                  <span className="truncate">{displayName}</span>
                </div>
                <button
                  className="focus-ring flex items-center gap-3 rounded px-3 py-3 text-left hover:bg-paper"
                  onClick={() => {
                    setMobileOpen(false);
                    openPasswordChange();
                  }}
                  type="button"
                >
                  <KeyRound size={17} className="text-ocean" />
                  Cambiar contraseña
                </button>
                <button
                  className="focus-ring flex items-center gap-3 rounded px-3 py-3 text-left text-copper hover:bg-paper"
                  onClick={() => {
                    setMobileOpen(false);
                    void signOut();
                  }}
                  type="button"
                >
                  <LogOut size={17} />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button
                className="focus-ring flex items-center gap-3 rounded px-3 py-3 text-left text-ocean hover:bg-paper"
                onClick={() => {
                  setMobileOpen(false);
                  openAuth("login");
                }}
                type="button"
              >
                <LogIn size={17} />
                Ingresar
              </button>
            )}
            <a
              className="focus-ring flex items-center gap-3 rounded px-3 py-3 hover:bg-paper"
              href={`mailto:${profile.email}`}
              onClick={() => setMobileOpen(false)}
            >
              <Mail size={17} />
              Contacto
            </a>
            <a
              className="focus-ring flex items-center gap-3 rounded px-3 py-3 hover:bg-paper"
              href="#"
              onClick={() => setMobileOpen(false)}
            >
              <Download size={17} />
              Descargar CV
            </a>
            <Link
              className="focus-ring flex items-center gap-3 rounded px-3 py-3 hover:bg-paper"
              href="/admin"
              onClick={() => setMobileOpen(false)}
            >
              <ShieldCheck size={17} />
              Administración
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
