"use client";

import {
  CalendarClock,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  FolderUp,
  Heart,
  LockKeyhole,
  LoaderCircle,
  LogOut,
  MessageSquare,
  Plus,
  Reply,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { makeId, useAcademicData } from "@/components/AcademicDataProvider";
import { adminCards } from "@/lib/data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Course, CourseForum, Profile } from "@/lib/types";

const ADMIN_EMAIL = "carlolb1232@gmail.com";

export default function AdminPage() {
  const data = useAcademicData();
  const [sessionChecked, setSessionChecked] = useState(!isSupabaseConfigured);
  const [isAuthenticated, setIsAuthenticated] = useState(!isSupabaseConfigured);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [profileDraft, setProfileDraft] = useState<Profile>(data.profile);
  const [courseDraft, setCourseDraft] = useState<Course>({
    code: "",
    name: "",
    period: "2026-I",
    status: "Actual",
    school: "Facultad UNCP",
    files: 0,
    description: "",
  });
  const [publicationDraft, setPublicationDraft] = useState({
    title: "",
    year: "2026",
    type: "Articulo",
    venue: "",
    authors: "Carlos F. López Rengifo",
    status: "Borrador",
  });
  const [timelineDraft, setTimelineDraft] = useState({
    year: "2026",
    title: "",
    type: "Docencia",
    description: "",
  });
  const [forumDraft, setForumDraft] = useState({
    courseCode: data.courses[0]?.code ?? "",
    title: "",
    excerpt: "",
    status: "Abierto" as CourseForum["status"],
  });
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyTargets, setReplyTargets] = useState<Record<string, string>>({});
  const [fileCategories, setFileCategories] = useState<Record<string, string>>(
    {},
  );
  const [fileVisibility, setFileVisibility] = useState<
    Record<string, "Publico" | "Privado">
  >({});
  const [publicationSearch, setPublicationSearch] = useState("");

  const filteredPublications = useMemo(
    () =>
      data.publications.filter((publication) =>
        `${publication.title} ${publication.authors} ${publication.year}`
          .toLowerCase()
          .includes(publicationSearch.toLowerCase()),
      ),
    [data.publications, publicationSearch],
  );

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data: sessionData }) => {
      const isAdmin = sessionData.session?.user.email === ADMIN_EMAIL;
      setIsAuthenticated(isAdmin);
      if (sessionData.session && !isAdmin) {
        setAuthError(
          "Esta cuenta puede participar en foros, pero no administrar el sitio.",
        );
      }
      setSessionChecked(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAdmin = session?.user.email === ADMIN_EMAIL;
      setIsAuthenticated(isAdmin);
      if (session && !isAdmin) {
        setAuthError(
          "Esta cuenta puede participar en foros, pero no administrar el sitio.",
        );
      }
      setSessionChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated && data.mode === "supabase") {
      void data.refreshData();
    }
  }, [isAuthenticated, data.mode, data.refreshData]);

  useEffect(() => {
    if (!data.loading) {
      setProfileDraft(data.profile);
      if (!forumDraft.courseCode && data.courses[0]) {
        setForumDraft((current) => ({
          ...current,
          courseCode: data.courses[0].code,
        }));
      }
    }
  }, [data.loading, data.profile, data.courses, forumDraft.courseCode]);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setAuthLoading(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
    } else if (loginEmail.trim().toLowerCase() !== ADMIN_EMAIL) {
      setAuthError("Esta cuenta no tiene permisos de administración.");
    }
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
  }

  function saveProfile(event: FormEvent) {
    event.preventDefault();
    data.updateProfile(profileDraft);
  }

  function addCourse(event: FormEvent) {
    event.preventDefault();
    if (!courseDraft.code.trim() || !courseDraft.name.trim()) return;
    data.addCourse({
      ...courseDraft,
      code: courseDraft.code.trim().toUpperCase(),
    });
    setCourseDraft({
      ...courseDraft,
      code: "",
      name: "",
      description: "",
      files: 0,
    });
  }

  function addPublication(event: FormEvent) {
    event.preventDefault();
    if (!publicationDraft.title.trim()) return;
    data.addPublication({ ...publicationDraft, id: makeId("publication") });
    setPublicationDraft({ ...publicationDraft, title: "", venue: "" });
  }

  function addTimeline(event: FormEvent) {
    event.preventDefault();
    if (!timelineDraft.title.trim()) return;
    data.addTimelineEvent({ ...timelineDraft, id: makeId("timeline") });
    setTimelineDraft({ ...timelineDraft, title: "", description: "" });
  }

  function addForum(event: FormEvent) {
    event.preventDefault();
    const course = data.courses.find(
      (item) => item.code === forumDraft.courseCode,
    );
    if (!course || !forumDraft.title.trim()) return;
    data.addForum({
      id: makeId("forum"),
      courseCode: course.code,
      courseName: course.name,
      title: forumDraft.title,
      status: forumDraft.status,
      replies: 0,
      likes: 0,
      lastActivity: "Ahora",
      excerpt:
        forumDraft.excerpt || "Foro creado desde el panel administrativo.",
      thread: [],
    });
    setForumDraft({ ...forumDraft, title: "", excerpt: "" });
  }

  function addReply(forumId: string) {
    const forum = data.courseForums.find((item) => item.id === forumId);
    const body = replyDrafts[forumId]?.trim();
    if (!forum || !body) return;
    const targetId = replyTargets[forumId];
    const target = forum.thread.find((reply) => reply.id === targetId);
    const nextLevel = (target ? Math.min(target.level + 1, 3) : 1) as 1 | 2 | 3;
    data.addForumReply(forumId, {
      id: makeId("reply"),
      author: data.profile.name,
      body,
      likes: 0,
      level: nextLevel,
      parentId: target?.id,
    });
    setReplyDrafts((current) => ({ ...current, [forumId]: "" }));
  }

  function handleCourseFile(courseCode: string, file: File | null) {
    if (!file) return;
    void data.uploadCourseFile({
      courseCode,
      file,
      visibility: fileVisibility[courseCode] ?? "Publico",
      category: fileCategories[courseCode] ?? "Otro",
    });
  }

  if (!sessionChecked || data.loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper">
        <div className="inline-flex items-center gap-3 text-sm font-bold text-muted">
          <LoaderCircle className="animate-spin" size={20} />
          Preparando panel administrativo...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-5">
        <form
          className="w-full max-w-md rounded border border-ink/10 bg-white p-7 shadow-soft"
          onSubmit={login}
        >
          <div className="grid h-12 w-12 place-items-center rounded bg-ocean text-white">
            <LockKeyhole size={22} />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Acceso administrativo</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Inicia sesion con el usuario creado en Supabase Auth.
          </p>
          <div className="mt-6 grid gap-4">
            <TextField
              label="Correo"
              value={loginEmail}
              onChange={setLoginEmail}
            />
            <label className="grid gap-2 text-sm font-bold">
              Contraseña
              <input
                className="h-11 rounded border border-ink/12 px-3 font-normal outline-none"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
            </label>
            {authError ? (
              <p className="text-sm font-semibold text-copper">{authError}</p>
            ) : null}
            <button
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded bg-ink px-4 text-sm font-bold text-white disabled:opacity-60"
              disabled={authLoading}
            >
              {authLoading ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <LockKeyhole size={16} />
              )}
              Ingresar
            </button>
          </div>
          <Link
            className="mt-5 inline-flex text-sm font-bold text-ocean"
            href="/"
          >
            Volver al sitio publico
          </Link>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-white">
        <div className="section-shell flex min-h-16 items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-ocean">Panel administrativo</p>
            <h1 className="text-xl font-bold">{data.profile.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="focus-ring inline-flex h-10 items-center gap-2 rounded border border-ink/12 px-3 text-sm font-bold"
              href="/"
            >
              <Eye size={16} />
              Vista publica
            </Link>
            {data.mode === "local" ? (
              <button
                className="focus-ring grid h-10 w-10 place-items-center rounded bg-ink text-white"
                title="Reiniciar datos demo"
                onClick={data.resetData}
              >
                <RotateCcw size={17} />
              </button>
            ) : null}
            <button
              className="focus-ring grid h-10 w-10 place-items-center rounded bg-ink text-white"
              title="Salir"
              onClick={() => void logout()}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <section className="section-shell py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded border border-ink/10 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-3 border-b border-ink/10 pb-5">
              <div className="grid h-11 w-11 place-items-center rounded bg-ocean text-white">
                <LockKeyhole size={20} />
              </div>
              <div>
                <p className="font-bold">Acceso docente</p>
                <p className="text-sm text-muted">
                  {data.mode === "supabase"
                    ? "Supabase activo"
                    : "LocalStorage activo"}
                </p>
              </div>
            </div>
            <nav className="mt-5 grid gap-2 text-sm font-bold text-ink/74">
              {[
                "Dashboard",
                "Perfil",
                "Cursos",
                "Foros",
                "Publicaciones",
                "Linea del tiempo",
                "Archivos",
              ].map((item, index) => (
                <a
                  className={`rounded px-3 py-2 ${index === 0 ? "bg-ink text-white" : "hover:bg-paper"}`}
                  href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
                  key={item}
                >
                  {item}
                </a>
              ))}
            </nav>
          </aside>

          <div className="grid gap-6">
            {data.error ? (
              <div className="rounded border border-copper/30 bg-copper/10 px-4 py-3 text-sm font-semibold text-copper">
                No se pudo sincronizar con Supabase: {data.error}
              </div>
            ) : null}
            <section
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              id="dashboard"
            >
              {adminCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    className="rounded border border-ink/10 bg-white p-5 shadow-soft"
                    key={card.title}
                  >
                    <div className="grid h-10 w-10 place-items-center rounded bg-ocean/10 text-ocean">
                      <Icon size={20} />
                    </div>
                    <h2 className="mt-4 font-bold">{card.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-ink/62">
                      {card.description}
                    </p>
                  </article>
                );
              })}
            </section>

            <form
              className="rounded border border-ink/10 bg-white p-6 shadow-soft"
              id="perfil"
              onSubmit={saveProfile}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    Editar perfil profesional
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Los cambios se guardan y aparecen en la pagina publica.
                  </p>
                </div>
                <button className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded bg-ink px-4 text-sm font-bold text-white">
                  <Save size={16} />
                  Guardar perfil
                </button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <TextField
                  label="Nombre completo"
                  value={profileDraft.name}
                  onChange={(value) =>
                    setProfileDraft({ ...profileDraft, name: value })
                  }
                />
                <TextField
                  label="Cargo actual"
                  value={profileDraft.role}
                  onChange={(value) =>
                    setProfileDraft({ ...profileDraft, role: value })
                  }
                />
                <TextField
                  label="Institucion"
                  value={profileDraft.institution}
                  onChange={(value) =>
                    setProfileDraft({ ...profileDraft, institution: value })
                  }
                />
                <TextField
                  label="Correo"
                  value={profileDraft.email}
                  onChange={(value) =>
                    setProfileDraft({ ...profileDraft, email: value })
                  }
                />
                <label className="grid gap-2 text-sm font-bold md:col-span-2">
                  Biografia breve
                  <textarea
                    className="min-h-28 rounded border border-ink/12 p-3 font-normal leading-7 outline-none"
                    value={profileDraft.summary}
                    onChange={(event) =>
                      setProfileDraft({
                        ...profileDraft,
                        summary: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
            </form>

            <section className="grid gap-6" id="cursos">
              <form
                className="rounded border border-ink/10 bg-white p-6 shadow-soft"
                onSubmit={addCourse}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      Cursos y archivos por curso
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Crea cursos y sube archivos asociados a cada uno.
                    </p>
                  </div>
                  <button className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ocean px-4 text-sm font-bold text-white">
                    <Plus size={16} />
                    Guardar curso
                  </button>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-5">
                  <TextField
                    label="Codigo"
                    value={courseDraft.code}
                    onChange={(value) =>
                      setCourseDraft({ ...courseDraft, code: value })
                    }
                  />
                  <TextField
                    label="Curso"
                    value={courseDraft.name}
                    onChange={(value) =>
                      setCourseDraft({ ...courseDraft, name: value })
                    }
                  />
                  <TextField
                    label="Periodo"
                    value={courseDraft.period}
                    onChange={(value) =>
                      setCourseDraft({ ...courseDraft, period: value })
                    }
                  />
                  <SelectField
                    label="Estado"
                    value={courseDraft.status}
                    options={["Actual", "Historico"]}
                    onChange={(value) =>
                      setCourseDraft({
                        ...courseDraft,
                        status: value as Course["status"],
                      })
                    }
                  />
                  <TextField
                    label="Facultad"
                    value={courseDraft.school}
                    onChange={(value) =>
                      setCourseDraft({ ...courseDraft, school: value })
                    }
                  />
                  <label className="grid gap-2 text-sm font-bold md:col-span-5">
                    Descripcion
                    <textarea
                      className="min-h-20 rounded border border-ink/12 p-3 font-normal leading-7 outline-none"
                      value={courseDraft.description}
                      onChange={(event) =>
                        setCourseDraft({
                          ...courseDraft,
                          description: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              </form>

              <div className="grid gap-5">
                {data.courses.map((course) => {
                  const files = data.courseFiles.filter(
                    (file) => file.courseCode === course.code,
                  );

                  return (
                    <article
                      className="rounded border border-ink/10 bg-white p-5 shadow-soft"
                      key={course.code}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-copper">
                            {course.period} · {course.code}
                          </p>
                          <h3 className="mt-1 text-lg font-bold">
                            {course.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted">
                            {files.length} archivos asociados
                          </p>
                        </div>
                        <button
                          className="focus-ring inline-flex h-9 items-center gap-2 rounded border border-ink/12 px-3 text-sm font-bold text-copper"
                          onClick={() => data.deleteCourse(course.code)}
                        >
                          <Trash2 size={15} />
                          Eliminar
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_330px]">
                        <FileTable
                          files={files}
                          onDelete={data.deleteCourseFile}
                        />
                        <div className="rounded border border-dashed border-ink/22 bg-paper p-4">
                          <UploadBlock
                            courseCode={course.code}
                            category={fileCategories[course.code] ?? "Otro"}
                            visibility={
                              fileVisibility[course.code] ?? "Publico"
                            }
                            onCategory={(value) =>
                              setFileCategories((current) => ({
                                ...current,
                                [course.code]: value,
                              }))
                            }
                            onVisibility={(value) =>
                              setFileVisibility((current) => ({
                                ...current,
                                [course.code]: value,
                              }))
                            }
                            onFile={(file) =>
                              handleCourseFile(course.code, file)
                            }
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section
              className="rounded border border-ink/10 bg-white p-6 shadow-soft"
              id="foros"
            >
              <ForumAdmin
                forumDraft={forumDraft}
                setForumDraft={setForumDraft}
                addForum={addForum}
                replyDrafts={replyDrafts}
                setReplyDrafts={setReplyDrafts}
                replyTargets={replyTargets}
                setReplyTargets={setReplyTargets}
                addReply={addReply}
              />
            </section>

            <form
              className="rounded border border-ink/10 bg-white p-6 shadow-soft"
              id="publicaciones"
              onSubmit={addPublication}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-bold">
                  Publicaciones y trabajos cientificos
                </h2>
                <button className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ocean px-4 text-sm font-bold text-white">
                  <FilePlus2 size={16} />
                  Agregar
                </button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-6">
                <TextField
                  label="Titulo"
                  value={publicationDraft.title}
                  onChange={(value) =>
                    setPublicationDraft({ ...publicationDraft, title: value })
                  }
                />
                <TextField
                  label="Año"
                  value={publicationDraft.year}
                  onChange={(value) =>
                    setPublicationDraft({ ...publicationDraft, year: value })
                  }
                />
                <TextField
                  label="Tipo"
                  value={publicationDraft.type}
                  onChange={(value) =>
                    setPublicationDraft({ ...publicationDraft, type: value })
                  }
                />
                <TextField
                  label="Revista/evento"
                  value={publicationDraft.venue}
                  onChange={(value) =>
                    setPublicationDraft({ ...publicationDraft, venue: value })
                  }
                />
                <TextField
                  label="Autores"
                  value={publicationDraft.authors}
                  onChange={(value) =>
                    setPublicationDraft({ ...publicationDraft, authors: value })
                  }
                />
                <TextField
                  label="Estado"
                  value={publicationDraft.status}
                  onChange={(value) =>
                    setPublicationDraft({ ...publicationDraft, status: value })
                  }
                />
              </div>
              <label className="mt-5 flex h-10 w-full max-w-sm items-center gap-2 rounded border border-ink/12 px-3 text-sm text-muted">
                <Search size={15} />
                <input
                  className="w-full outline-none"
                  placeholder="Buscar publicacion"
                  value={publicationSearch}
                  onChange={(event) => setPublicationSearch(event.target.value)}
                />
              </label>
              <div className="mt-5 grid gap-3">
                {filteredPublications.map((item) => (
                  <Row
                    key={item.id}
                    title={item.title}
                    meta={`${item.year} · ${item.type} · ${item.authors}`}
                    onDelete={() => data.deletePublication(item.id)}
                  />
                ))}
              </div>
            </form>

            <form
              className="rounded border border-ink/10 bg-white p-6 shadow-soft"
              id="linea-del-tiempo"
              onSubmit={addTimeline}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-bold">Linea del tiempo</h2>
                <button className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ocean px-4 text-sm font-bold text-white">
                  <CalendarClock size={16} />
                  Nuevo hito
                </button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <TextField
                  label="Año"
                  value={timelineDraft.year}
                  onChange={(value) =>
                    setTimelineDraft({ ...timelineDraft, year: value })
                  }
                />
                <TextField
                  label="Titulo"
                  value={timelineDraft.title}
                  onChange={(value) =>
                    setTimelineDraft({ ...timelineDraft, title: value })
                  }
                />
                <SelectField
                  label="Categoria"
                  value={timelineDraft.type}
                  options={[
                    "Formacion",
                    "Docencia",
                    "Investigacion",
                    "Gestion",
                    "Publicaciones",
                    "Actualidad",
                  ]}
                  onChange={(value) =>
                    setTimelineDraft({ ...timelineDraft, type: value })
                  }
                />
                <TextField
                  label="Descripcion"
                  value={timelineDraft.description}
                  onChange={(value) =>
                    setTimelineDraft({ ...timelineDraft, description: value })
                  }
                />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {data.timeline.map((event) => (
                  <Row
                    key={event.id}
                    title={`${event.year} · ${event.title}`}
                    meta={`${event.type} · ${event.description}`}
                    onDelete={() => data.deleteTimelineEvent(event.id)}
                  />
                ))}
              </div>
            </form>

            <section
              className="rounded border border-ink/10 bg-white p-6 shadow-soft"
              id="archivos"
            >
              <h2 className="text-xl font-bold">
                Biblioteca general de archivos
              </h2>
              <p className="mt-1 text-sm text-muted">
                Todos los archivos subidos por curso.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {data.courseFiles.map((file) => (
                  <article
                    className="rounded border border-ink/10 bg-paper p-4"
                    key={file.id}
                  >
                    <p className="text-xs font-bold text-copper">
                      {file.courseCode}
                    </p>
                    <h3 className="mt-1 font-bold">{file.title}</h3>
                    <p className="mt-2 text-sm text-muted">
                      {file.type} · {file.visibility} · {file.uploadedAt}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        className="h-11 rounded border border-ink/12 px-3 font-normal outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <select
        className="h-11 rounded border border-ink/12 bg-white px-3 font-normal outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function FileTable({
  files,
  onDelete,
}: {
  files: ReturnType<typeof useAcademicData>["courseFiles"];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded border border-ink/10 bg-white">
      <div className="grid grid-cols-[1fr_72px_92px_42px] gap-3 border-b border-ink/10 px-4 py-3 text-xs font-bold uppercase text-muted">
        <span>Archivo</span>
        <span>Tipo</span>
        <span>Visibilidad</span>
        <span />
      </div>
      {files.map((file) => (
        <div
          className="grid grid-cols-[1fr_72px_92px_42px] gap-3 border-b border-ink/10 px-4 py-3 text-sm last:border-b-0"
          key={file.id}
        >
          <span className="inline-flex min-w-0 items-center gap-2 font-semibold">
            <FileText className="shrink-0 text-ocean" size={16} />
            <span className="truncate">{file.title}</span>
          </span>
          <span className="font-bold text-copper">{file.type}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-ink/70">
            {file.visibility === "Publico" ? (
              <Eye size={14} />
            ) : (
              <EyeOff size={14} />
            )}
            {file.visibility}
          </span>
          <button
            className="focus-ring text-copper"
            onClick={() => onDelete(file.id)}
            title="Eliminar archivo"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function UploadBlock({
  courseCode,
  category,
  visibility,
  onCategory,
  onVisibility,
  onFile,
}: {
  courseCode: string;
  category: string;
  visibility: "Publico" | "Privado";
  onCategory: (value: string) => void;
  onVisibility: (value: "Publico" | "Privado") => void;
  onFile: (file: File | null) => void;
}) {
  return (
    <div>
      <FolderUp className="text-ocean" size={28} />
      <p className="mt-3 font-bold">Subir a {courseCode}</p>
      <div className="mt-4 grid gap-3">
        <SelectField
          label="Categoria"
          value={category}
          options={[
            "Silabo",
            "Lectura",
            "Practica",
            "Presentacion",
            "Examen",
            "Otro",
          ]}
          onChange={onCategory}
        />
        <SelectField
          label="Visibilidad"
          value={visibility}
          options={["Publico", "Privado"]}
          onChange={(value) => onVisibility(value as "Publico" | "Privado")}
        />
        <label className="focus-ring inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded bg-ink px-4 text-sm font-bold text-white">
          <FolderUp size={16} />
          Elegir archivo
          <input
            className="hidden"
            type="file"
            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>
    </div>
  );
}

function ForumAdmin({
  forumDraft,
  setForumDraft,
  addForum,
  replyDrafts,
  setReplyDrafts,
  replyTargets,
  setReplyTargets,
  addReply,
}: {
  forumDraft: {
    courseCode: string;
    title: string;
    excerpt: string;
    status: CourseForum["status"];
  };
  setForumDraft: (value: {
    courseCode: string;
    title: string;
    excerpt: string;
    status: CourseForum["status"];
  }) => void;
  addForum: (event: FormEvent) => void;
  replyDrafts: Record<string, string>;
  setReplyDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  replyTargets: Record<string, string>;
  setReplyTargets: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  addReply: (forumId: string) => void;
}) {
  const data = useAcademicData();

  return (
    <>
      <form className="flex flex-col gap-4" onSubmit={addForum}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Foros de cursos</h2>
            <p className="mt-1 text-sm text-muted">
              Crear foros y respuestas hasta 3 niveles.
            </p>
          </div>
          <button className="focus-ring inline-flex h-10 items-center gap-2 rounded bg-ocean px-4 text-sm font-bold text-white">
            <MessageSquare size={16} />
            Nuevo foro
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <SelectField
            label="Curso"
            value={forumDraft.courseCode}
            options={data.courses.map((course) => course.code)}
            onChange={(value) =>
              setForumDraft({ ...forumDraft, courseCode: value })
            }
          />
          <TextField
            label="Titulo"
            value={forumDraft.title}
            onChange={(value) => setForumDraft({ ...forumDraft, title: value })}
          />
          <TextField
            label="Descripcion"
            value={forumDraft.excerpt}
            onChange={(value) =>
              setForumDraft({ ...forumDraft, excerpt: value })
            }
          />
          <SelectField
            label="Estado"
            value={forumDraft.status}
            options={["Abierto", "Cerrado", "Solo lectura"]}
            onChange={(value) =>
              setForumDraft({
                ...forumDraft,
                status: value as CourseForum["status"],
              })
            }
          />
        </div>
      </form>

      <div className="mt-6 grid gap-5">
        {data.courseForums.map((forum) => (
          <article
            className="rounded border border-ink/10 bg-paper p-4"
            key={forum.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-copper">
                  {forum.courseCode} · {forum.courseName}
                </p>
                <h3 className="mt-1 font-bold">{forum.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {forum.replies} respuestas · {forum.likes} likes ·{" "}
                  {forum.lastActivity}
                </p>
              </div>
              <button
                className="focus-ring inline-flex h-8 items-center gap-1 rounded bg-white px-2 text-xs font-bold"
                onClick={() => data.likeForum(forum.id)}
              >
                <Heart size={13} />
                Like
              </button>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="grid gap-3">
                {forum.thread.map((reply) => (
                  <div
                    className="rounded border border-ink/10 bg-white p-3"
                    key={reply.id}
                    style={{ marginLeft: `${(reply.level - 1) * 22}px` }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">{reply.author}</p>
                      <span className="rounded bg-paper px-2 py-1 text-xs font-bold text-muted">
                        Nivel {reply.level}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink/68">
                      {reply.body}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                      <button
                        className="focus-ring inline-flex h-8 items-center gap-1 rounded bg-paper px-2 text-ink/72"
                        onClick={() => data.likeReply(forum.id, reply.id)}
                      >
                        <Heart size={13} />
                        {reply.likes}
                      </button>
                      {reply.level < 3 ? (
                        <span className="inline-flex h-8 items-center gap-1 rounded bg-ink px-2 text-white">
                          <Reply size={13} />
                          Responder permitido
                        </span>
                      ) : (
                        <span className="inline-flex h-8 items-center rounded border border-ink/12 px-2 text-ink/72">
                          Solo seguir hilo
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded border border-dashed border-ink/20 bg-white p-4">
                <p className="font-bold">Crear respuesta</p>
                <div className="mt-4 grid gap-3">
                  <SelectField
                    label="Responder a"
                    value={replyTargets[forum.id] ?? ""}
                    options={["", ...forum.thread.map((reply) => reply.id)]}
                    onChange={(value) =>
                      setReplyTargets((current) => ({
                        ...current,
                        [forum.id]: value,
                      }))
                    }
                  />
                  <textarea
                    className="min-h-24 rounded border border-ink/12 bg-paper p-3 text-sm leading-6 outline-none"
                    placeholder="Escribir respuesta..."
                    value={replyDrafts[forum.id] ?? ""}
                    onChange={(event) =>
                      setReplyDrafts((current) => ({
                        ...current,
                        [forum.id]: event.target.value,
                      }))
                    }
                  />
                  <button
                    className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded bg-ink px-4 text-sm font-bold text-white"
                    onClick={() => addReply(forum.id)}
                  >
                    <Reply size={16} />
                    Publicar respuesta
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function Row({
  title,
  meta,
  onDelete,
}: {
  title: string;
  meta: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-ink/10 bg-paper p-4">
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm text-muted">{meta}</p>
      </div>
      <button
        className="focus-ring inline-flex h-9 items-center gap-2 rounded border border-ink/12 px-3 text-sm font-bold text-copper"
        onClick={onDelete}
      >
        <Trash2 size={15} />
        Eliminar
      </button>
    </div>
  );
}
