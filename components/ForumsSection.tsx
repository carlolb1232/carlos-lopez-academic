"use client";

import { Heart, LogIn, MessageSquare, Reply, Workflow } from "lucide-react";
import { useState } from "react";
import { makeId, useAcademicData } from "@/components/AcademicDataProvider";
import { useCommunityAuth } from "@/components/CommunityAuthProvider";

export function ForumsSection() {
  const { addForumReply, courseForums, likeForum, likeReply } =
    useAcademicData();
  const { displayName, openAuth, requireAuth, user } = useCommunityAuth();
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [targets, setTargets] = useState<Record<string, string>>({});

  async function publishReply(forumId: string) {
    if (!requireAuth()) return;
    const forum = courseForums.find((item) => item.id === forumId);
    const body = bodies[forumId]?.trim();
    if (!forum || !body || forum.status !== "Abierto") return;
    const target = forum.thread.find((reply) => reply.id === targets[forumId]);
    const level = (target ? Math.min(target.level + 1, 3) : 1) as 1 | 2 | 3;
    await addForumReply(forumId, {
      id: makeId("reply"),
      author: displayName,
      body,
      likes: 0,
      level,
      parentId: target?.id,
    });
    setBodies((current) => ({ ...current, [forumId]: "" }));
  }

  function selectReplyTarget(forumId: string, replyId: string) {
    if (!requireAuth()) return;
    setTargets((current) => ({ ...current, [forumId]: replyId }));
  }

  function handleForumLike(forumId: string) {
    if (!requireAuth()) return;
    void likeForum(forumId);
  }

  function handleReplyLike(forumId: string, replyId: string) {
    if (!requireAuth()) return;
    void likeReply(forumId, replyId);
  }

  return (
    <section className="bg-white py-20" id="foros">
      <div className="section-shell">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-moss">
              Foros por curso
            </p>
            <h2 className="mt-3 break-words text-3xl font-bold text-ink sm:text-4xl">
              Conversaciones con respuestas hasta 3 niveles.
            </h2>
            <p className="mt-4 text-base leading-7 text-ink/68">
              Cada curso puede tener foros activos o archivados. Al llegar al
              tercer nivel, el hilo continua con seguimiento y likes, sin crear
              mas profundidad.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded border border-ink/12 bg-paper px-3 py-2 text-sm font-bold text-ink/72">
            <Workflow size={16} />
            Maximo 3 niveles
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {courseForums.map((forum) => (
            <article
              className="rounded border border-ink/10 bg-paper p-5 shadow-soft"
              key={forum.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-copper">
                    {forum.courseCode} · {forum.courseName}
                  </p>
                  <h3 className="mt-2 text-xl font-bold leading-7">
                    {forum.title}
                  </h3>
                </div>
                <span className="rounded bg-white px-2 py-1 text-xs font-bold text-ocean">
                  {forum.status}
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-ink/68">
                {forum.excerpt}
              </p>

              <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-ink/68">
                <span className="inline-flex items-center gap-2">
                  <MessageSquare size={15} />
                  {forum.replies} respuestas
                </span>
                <button
                  className="focus-ring inline-flex items-center gap-2 rounded bg-white px-2 py-1"
                  onClick={() => handleForumLike(forum.id)}
                >
                  <Heart size={15} />
                  {forum.likes} likes
                </button>
                <span>{forum.lastActivity}</span>
              </div>

              <div className="mt-5 grid gap-3 border-t border-ink/10 pt-4">
                {forum.thread.map((reply) => (
                  <div
                    className="rounded border border-ink/10 bg-white p-3"
                    key={reply.id}
                    style={{ marginLeft: `${(reply.level - 1) * 18}px` }}
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
                        onClick={() => handleReplyLike(forum.id, reply.id)}
                      >
                        <Heart size={13} />
                        {reply.likes}
                      </button>
                      {reply.level < 3 ? (
                        <button
                          className="focus-ring inline-flex h-8 items-center gap-1 rounded bg-ink px-2 text-white"
                          onClick={() => selectReplyTarget(forum.id, reply.id)}
                        >
                          <Reply size={13} />
                          Responder
                        </button>
                      ) : (
                        <button className="focus-ring inline-flex h-8 items-center gap-1 rounded border border-ink/12 px-2 text-ink/72">
                          Seguir hilo
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {forum.status === "Abierto" ? (
                <div className="mt-4 grid gap-3 border-t border-ink/10 pt-4">
                  {user ? (
                    <>
                      <p className="text-sm font-semibold text-ink/68">
                        Participas como{" "}
                        <span className="font-bold text-ink">
                          {displayName}
                        </span>
                      </p>
                      <select
                        className="h-10 rounded border border-ink/12 bg-white px-3 text-sm outline-none"
                        value={targets[forum.id] ?? ""}
                        onChange={(event) =>
                          setTargets((current) => ({
                            ...current,
                            [forum.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">Responder al foro</option>
                        {forum.thread
                          .filter((reply) => reply.level < 3)
                          .map((reply) => (
                            <option key={reply.id} value={reply.id}>
                              Responder a {reply.author} · nivel {reply.level}
                            </option>
                          ))}
                      </select>
                      <textarea
                        className="min-h-24 rounded border border-ink/12 bg-white p-3 text-sm leading-6 outline-none"
                        placeholder="Escribe tu respuesta..."
                        value={bodies[forum.id] ?? ""}
                        onChange={(event) =>
                          setBodies((current) => ({
                            ...current,
                            [forum.id]: event.target.value,
                          }))
                        }
                      />
                      <button
                        className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded bg-ink px-4 text-sm font-bold text-white"
                        onClick={() => void publishReply(forum.id)}
                      >
                        <Reply size={15} />
                        Publicar respuesta
                      </button>
                    </>
                  ) : (
                    <button
                      className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded border border-ink/12 bg-white px-4 text-sm font-bold text-ocean"
                      onClick={() => openAuth("login")}
                    >
                      <LogIn size={16} />
                      Inicia sesión para participar
                    </button>
                  )}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
