"use client";

import { LoaderCircle, LockKeyhole, LogIn, UserPlus, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "register";

type CommunityAuthContextValue = {
  user: User | null;
  authReady: boolean;
  displayName: string;
  openAuth: (mode?: AuthMode) => void;
  requireAuth: () => boolean;
  signOut: () => Promise<void>;
};

const CommunityAuthContext = createContext<CommunityAuthContextValue | null>(
  null,
);

export function CommunityAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAuth = useCallback((nextMode: AuthMode = "login") => {
    setMode(nextMode);
    setError("");
    setMessage("");
    setIsOpen(true);
  }, []);

  const requireAuth = useCallback(() => {
    if (user) return true;
    openAuth("login");
    return false;
  }, [openAuth, user]);

  const displayName =
    (user?.user_metadata.full_name as string | undefined)?.trim() ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const value = useMemo<CommunityAuthContextValue>(
    () => ({
      user,
      authReady,
      displayName,
      openAuth,
      requireAuth,
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
      },
    }),
    [authReady, displayName, openAuth, requireAuth, user],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !email.trim() || !password) return;

    setBusy(true);
    setError("");
    setMessage("");

    if (mode === "login") {
      const result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setBusy(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setIsOpen(false);
      setPassword("");
      return;
    }

    if (name.trim().length < 2) {
      setBusy(false);
      setError("Escribe el nombre que aparecerá en tus comentarios.");
      return;
    }

    const result = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
      },
    });
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (result.data.session) {
      setIsOpen(false);
      setPassword("");
    } else {
      setMessage(
        "Revisa tu correo para confirmar la cuenta y luego inicia sesión.",
      );
      setMode("login");
      setPassword("");
    }
  }

  return (
    <CommunityAuthContext.Provider value={value}>
      {children}
      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[90] grid place-items-center bg-ink/55 px-5 backdrop-blur-sm"
          role="dialog"
        >
          <form
            className="relative w-full max-w-md rounded border border-ink/10 bg-white p-6 shadow-2xl"
            onSubmit={submit}
          >
            <button
              aria-label="Cerrar"
              className="focus-ring absolute right-4 top-4 grid h-9 w-9 place-items-center rounded border border-ink/10"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X size={17} />
            </button>

            <div className="grid h-11 w-11 place-items-center rounded bg-ocean text-white">
              <LockKeyhole size={20} />
            </div>
            <h2 className="mt-4 text-2xl font-bold">
              Participa en la comunidad
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              El contenido es público. Necesitas una cuenta para comentar,
              responder y dar likes.
            </p>

            <div className="mt-5 grid grid-cols-2 rounded border border-ink/10 bg-paper p-1">
              <button
                className={`h-9 rounded text-sm font-bold ${
                  mode === "login" ? "bg-ink text-white" : "text-ink/65"
                }`}
                onClick={() => setMode("login")}
                type="button"
              >
                Ingresar
              </button>
              <button
                className={`h-9 rounded text-sm font-bold ${
                  mode === "register" ? "bg-ink text-white" : "text-ink/65"
                }`}
                onClick={() => setMode("register")}
                type="button"
              >
                Crear cuenta
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              {mode === "register" ? (
                <label className="grid gap-2 text-sm font-bold">
                  Nombre público
                  <input
                    className="h-11 rounded border border-ink/12 px-3 font-normal outline-none"
                    onChange={(event) => setName(event.target.value)}
                    value={name}
                  />
                </label>
              ) : null}
              <label className="grid gap-2 text-sm font-bold">
                Correo
                <input
                  className="h-11 rounded border border-ink/12 px-3 font-normal outline-none"
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  value={email}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Contraseña
                <input
                  className="h-11 rounded border border-ink/12 px-3 font-normal outline-none"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  value={password}
                />
              </label>

              {error ? (
                <p className="text-sm font-semibold text-copper">{error}</p>
              ) : null}
              {message ? (
                <p className="text-sm font-semibold text-moss">{message}</p>
              ) : null}

              <button
                className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded bg-ocean px-4 text-sm font-bold text-white disabled:opacity-60"
                disabled={busy}
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : mode === "login" ? (
                  <LogIn size={17} />
                ) : (
                  <UserPlus size={17} />
                )}
                {mode === "login" ? "Ingresar" : "Crear cuenta"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </CommunityAuthContext.Provider>
  );
}

export function useCommunityAuth() {
  const context = useContext(CommunityAuthContext);
  if (!context) {
    throw new Error(
      "useCommunityAuth must be used inside CommunityAuthProvider",
    );
  }
  return context;
}
