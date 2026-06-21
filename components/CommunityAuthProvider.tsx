"use client";

import {
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  UserPlus,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent } from "react";
import { allowPublicSignup } from "@/lib/auth-config";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "register";

type CommunityAuthContextValue = {
  user: User | null;
  authReady: boolean;
  displayName: string;
  allowPublicSignup: boolean;
  openAuth: (mode?: AuthMode) => void;
  openPasswordChange: () => void;
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
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser?.user_metadata.must_change_password === true) {
        setPasswordOpen(true);
      }
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
      if (session?.user.user_metadata.must_change_password === true) {
        setPasswordOpen(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAuth = useCallback((nextMode: AuthMode = "login") => {
    setMode(
      nextMode === "register" && !allowPublicSignup ? "login" : nextMode,
    );
    setError("");
    setMessage("");
    setIsOpen(true);
  }, []);

  const openPasswordChange = useCallback(() => {
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordMessage("");
    setPasswordOpen(true);
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
      allowPublicSignup,
      openAuth,
      openPasswordChange,
      requireAuth,
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
      },
    }),
    [
      authReady,
      displayName,
      openAuth,
      openPasswordChange,
      requireAuth,
      user,
    ],
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

    if (!allowPublicSignup) {
      setBusy(false);
      setError("El registro público está deshabilitado.");
      setMode("login");
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

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !user) return;
    if (newPassword.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);
    setPasswordError("");
    setPasswordMessage("");
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        ...user.user_metadata,
        must_change_password: false,
      },
    });
    setBusy(false);

    if (updateError) {
      setPasswordError(updateError.message);
      return;
    }

    setPasswordMessage("Contraseña actualizada correctamente.");
    setNewPassword("");
    setConfirmPassword("");
    window.setTimeout(() => setPasswordOpen(false), 900);
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

            {!allowPublicSignup ? (
              <p className="mt-4 rounded border border-ocean/20 bg-ocean/8 px-3 py-2 text-sm leading-6 text-ocean">
                Las cuentas son creadas por el docente. Ingresa con el correo y
                la contraseña temporal que recibiste.
              </p>
            ) : null}

            <div
              className={`mt-5 grid rounded border border-ink/10 bg-paper p-1 ${
                allowPublicSignup ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              <button
                className={`h-9 rounded text-sm font-bold ${
                  mode === "login" ? "bg-ink text-white" : "text-ink/65"
                }`}
                onClick={() => setMode("login")}
                type="button"
              >
                Ingresar
              </button>
              {allowPublicSignup ? (
                <button
                  className={`h-9 rounded text-sm font-bold ${
                    mode === "register" ? "bg-ink text-white" : "text-ink/65"
                  }`}
                  onClick={() => setMode("register")}
                  type="button"
                >
                  Crear cuenta
                </button>
              ) : null}
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
      {passwordOpen && user ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[95] grid place-items-center bg-ink/55 px-5 backdrop-blur-sm"
          role="dialog"
        >
          <form
            className="relative w-full max-w-md rounded border border-ink/10 bg-white p-6 shadow-2xl"
            onSubmit={changePassword}
          >
            <button
              aria-label="Cerrar"
              className="focus-ring absolute right-4 top-4 grid h-9 w-9 place-items-center rounded border border-ink/10"
              onClick={() => setPasswordOpen(false)}
              type="button"
            >
              <X size={17} />
            </button>
            <div className="grid h-11 w-11 place-items-center rounded bg-ocean text-white">
              <KeyRound size={20} />
            </div>
            <h2 className="mt-4 text-2xl font-bold">Cambiar contraseña</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Crea una contraseña personal de al menos 8 caracteres.
            </p>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-bold">
                Nueva contraseña
                <input
                  className="h-11 rounded border border-ink/12 px-3 font-normal outline-none"
                  minLength={8}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type="password"
                  value={newPassword}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Repetir contraseña
                <input
                  className="h-11 rounded border border-ink/12 px-3 font-normal outline-none"
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  value={confirmPassword}
                />
              </label>
              {passwordError ? (
                <p className="text-sm font-semibold text-copper">
                  {passwordError}
                </p>
              ) : null}
              {passwordMessage ? (
                <p className="text-sm font-semibold text-moss">
                  {passwordMessage}
                </p>
              ) : null}
              <button
                className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded bg-ocean px-4 text-sm font-bold text-white disabled:opacity-60"
                disabled={busy}
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : (
                  <KeyRound size={17} />
                )}
                Guardar nueva contraseña
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
