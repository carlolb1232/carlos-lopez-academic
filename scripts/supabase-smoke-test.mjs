import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} = process.env;

if (
  !NEXT_PUBLIC_SUPABASE_URL ||
  !NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  !ADMIN_EMAIL ||
  !ADMIN_PASSWORD
) {
  throw new Error("Faltan variables para ejecutar la prueba de Supabase.");
}

const client = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { realtime: { transport: WebSocket } },
);
const publicClient = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { realtime: { transport: WebSocket } },
);

const auth = await client.auth.signInWithPassword({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
});

if (auth.error) throw auth.error;

const suffix = Date.now();
const storagePath = `tests/functional-check-${suffix}.pdf`;
const rowId = `functional-check-${suffix}`;
const forumId = `functional-forum-${suffix}`;
const replyIds = [1, 2, 3, 4].map(
  (level) => `functional-reply-${suffix}-${level}`,
);

try {
  const upload = await client.storage
    .from("academic-files")
    .upload(
      storagePath,
      Buffer.from("%PDF-1.4\n% functional storage check\n"),
      { contentType: "application/pdf" },
    );

  if (upload.error) throw upload.error;

  const insert = await client.from("academic_files").insert({
    id: rowId,
    course_code: "CUR-401",
    title: "Prueba funcional temporal",
    file_type: "PDF",
    visibility: "Privado",
    category: "Otro",
    storage_path: storagePath,
  });

  if (insert.error) throw insert.error;

  const verify = await client
    .from("academic_files")
    .select("id,storage_path")
    .eq("id", rowId)
    .single();

  if (verify.error) throw verify.error;

  const forum = await client.from("course_forums").insert({
    id: forumId,
    course_code: "CUR-401",
    title: "Prueba funcional temporal",
    description: "Validacion automatica del foro.",
    status: "Abierto",
  });

  if (forum.error) throw forum.error;

  const anonymousReply = await publicClient.from("forum_replies").insert({
    id: `anonymous-${replyIds[0]}`,
    forum_id: forumId,
    parent_reply_id: null,
    author_name: "Anonimo",
    body: "Esta respuesta debe ser rechazada.",
    depth: 1,
  });

  if (!anonymousReply.error) {
    throw new Error("Un visitante anonimo pudo publicar en el foro.");
  }

  for (let level = 1; level <= 3; level += 1) {
    const reply = await client.from("forum_replies").insert({
      id: replyIds[level - 1],
      forum_id: forumId,
      parent_reply_id: level === 1 ? null : replyIds[level - 2],
      author_name: "Prueba automatica",
      body: `Respuesta temporal de nivel ${level}.`,
      depth: level,
    });

    if (reply.error) throw reply.error;
  }

  const forbiddenReply = await client.from("forum_replies").insert({
    id: replyIds[3],
    forum_id: forumId,
    parent_reply_id: replyIds[2],
    author_name: "Prueba automatica",
    body: "Esta respuesta de cuarto nivel debe ser rechazada.",
    depth: 3,
  });

  if (!forbiddenReply.error) {
    throw new Error("El foro acepto incorrectamente una respuesta de nivel 4.");
  }

  const anonymousLike = await publicClient.rpc("increment_forum_like", {
    target_id: forumId,
  });

  if (!anonymousLike.error) {
    throw new Error("Un visitante anonimo pudo dar like.");
  }

  const like = await client.rpc("increment_forum_like", {
    target_id: forumId,
  });

  if (like.error) throw like.error;

  const forumCheck = await publicClient
    .from("course_forums")
    .select("likes")
    .eq("id", forumId)
    .single();

  if (forumCheck.error || forumCheck.data.likes !== 1) {
    throw forumCheck.error ?? new Error("El like del foro no se registro.");
  }

  console.log("Supabase smoke test: auth, storage, base de datos y foros OK.");
} finally {
  await client.from("course_forums").delete().eq("id", forumId);
  await client.from("academic_files").delete().eq("id", rowId);
  await client.storage.from("academic-files").remove([storagePath]);
  await client.auth.signOut();
}
