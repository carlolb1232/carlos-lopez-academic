create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id text primary key,
  full_name text not null,
  role text not null default '',
  institution text not null default '',
  location text not null default '',
  email text not null default '',
  bio text not null default '',
  photo_url text,
  interests jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  code text primary key,
  name text not null,
  school text not null default '',
  period text not null,
  status text not null check (status in ('Actual', 'Historico')),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.publications (
  id text primary key,
  title text not null,
  publication_year int not null,
  publication_type text not null,
  venue text not null default '',
  authors text not null default '',
  doi text,
  external_url text,
  abstract text,
  file_url text,
  status text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timeline_events (
  id text primary key,
  event_year text not null,
  title text not null,
  category text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academic_files (
  id text primary key,
  course_code text not null references public.courses(code) on delete cascade,
  title text not null,
  file_type text not null default 'FILE',
  visibility text not null default 'Publico' check (visibility in ('Publico', 'Privado')),
  category text not null default 'Otro',
  file_url text,
  storage_path text unique,
  uploaded_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.course_forums (
  id text primary key,
  course_code text not null references public.courses(code) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'Abierto' check (status in ('Abierto', 'Cerrado', 'Solo lectura')),
  likes int not null default 0 check (likes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_replies (
  id text primary key,
  forum_id text not null references public.course_forums(id) on delete cascade,
  parent_reply_id text references public.forum_replies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  author_name text not null check (char_length(author_name) between 2 and 100),
  body text not null check (char_length(body) between 2 and 4000),
  depth int not null check (depth between 1 and 3),
  likes int not null default 0 check (likes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.forum_replies
  add column if not exists user_id uuid references auth.users(id) on delete set null default auth.uid();

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_likes (
  forum_id text not null references public.course_forums(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (forum_id, user_id)
);

create table if not exists public.reply_likes (
  reply_id text not null references public.forum_replies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (reply_id, user_id)
);

insert into public.app_admins (user_id)
select id from auth.users where lower(email) = 'carlolb1232@gmail.com'
on conflict (user_id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins where user_id = auth.uid()
  );
$$;

create or replace function public.validate_reply_depth()
returns trigger
language plpgsql
as $$
declare
  parent_depth int;
begin
  if new.parent_reply_id is null then
    new.depth := 1;
    return new;
  end if;

  select depth into parent_depth
  from public.forum_replies
  where id = new.parent_reply_id and forum_id = new.forum_id;

  if parent_depth is null then
    raise exception 'La respuesta padre no existe en este foro';
  end if;

  if parent_depth >= 3 then
    raise exception 'El foro permite un maximo de 3 niveles';
  end if;

  new.depth := parent_depth + 1;
  return new;
end;
$$;

drop trigger if exists forum_reply_depth_guard on public.forum_replies;
create trigger forum_reply_depth_guard
before insert or update of parent_reply_id, forum_id
on public.forum_replies
for each row execute function public.validate_reply_depth();

create or replace function public.increment_forum_like(target_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para dar like';
  end if;

  insert into public.forum_likes (forum_id, user_id)
  values (target_id, auth.uid())
  on conflict do nothing;

  if found then
    update public.course_forums
    set likes = likes + 1, updated_at = now()
    where id = target_id;
  end if;
end;
$$;

create or replace function public.increment_reply_like(target_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion para dar like';
  end if;

  insert into public.reply_likes (reply_id, user_id)
  values (target_id, auth.uid())
  on conflict do nothing;

  if found then
    update public.forum_replies
    set likes = likes + 1, updated_at = now()
    where id = target_id;
  end if;
end;
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
revoke all on function public.increment_forum_like(text) from public, anon;
revoke all on function public.increment_reply_like(text) from public, anon;
grant execute on function public.increment_forum_like(text) to authenticated;
grant execute on function public.increment_reply_like(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.publications enable row level security;
alter table public.timeline_events enable row level security;
alter table public.academic_files enable row level security;
alter table public.course_forums enable row level security;
alter table public.forum_replies enable row level security;
alter table public.app_admins enable row level security;
alter table public.forum_likes enable row level security;
alter table public.reply_likes enable row level security;

drop policy if exists "Public read profile" on public.profiles;
create policy "Public read profile" on public.profiles for select using (true);
drop policy if exists "Public read courses" on public.courses;
create policy "Public read courses" on public.courses for select using (true);
drop policy if exists "Public read publications" on public.publications;
create policy "Public read publications" on public.publications for select using (true);
drop policy if exists "Public read timeline" on public.timeline_events;
create policy "Public read timeline" on public.timeline_events for select using (true);
drop policy if exists "Public read public files" on public.academic_files;
create policy "Public read public files" on public.academic_files
  for select using (visibility = 'Publico' or public.is_admin());
drop policy if exists "Public read forums" on public.course_forums;
create policy "Public read forums" on public.course_forums for select using (true);
drop policy if exists "Public read replies" on public.forum_replies;
create policy "Public read replies" on public.forum_replies for select using (true);
drop policy if exists "Public create replies" on public.forum_replies;
drop policy if exists "Authenticated create replies" on public.forum_replies;
create policy "Authenticated create replies" on public.forum_replies
  for insert to authenticated with check (
    user_id = auth.uid()
    and
    author_name = coalesce(
      nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
      split_part(auth.jwt() ->> 'email', '@', 1)
    )
    and
    exists (
      select 1 from public.course_forums
      where id = forum_id and status = 'Abierto'
    )
  );

drop policy if exists "Admin manage profile" on public.profiles;
create policy "Admin manage profile" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin manage courses" on public.courses;
create policy "Admin manage courses" on public.courses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin manage publications" on public.publications;
create policy "Admin manage publications" on public.publications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin manage timeline" on public.timeline_events;
create policy "Admin manage timeline" on public.timeline_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin manage files" on public.academic_files;
create policy "Admin manage files" on public.academic_files
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin manage forums" on public.course_forums;
create policy "Admin manage forums" on public.course_forums
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin manage replies" on public.forum_replies;
create policy "Admin manage replies" on public.forum_replies
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'academic-files',
  'academic-files',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Read public academic files" on storage.objects;
create policy "Read public academic files" on storage.objects
  for select using (
    bucket_id = 'academic-files'
    and (
      auth.role() = 'authenticated'
      and public.is_admin()
      or exists (
        select 1 from public.academic_files
        where storage_path = name and visibility = 'Publico'
      )
    )
  );
drop policy if exists "Admin upload academic files" on storage.objects;
create policy "Admin upload academic files" on storage.objects
  for insert to authenticated with check (bucket_id = 'academic-files' and public.is_admin());
drop policy if exists "Admin update academic files" on storage.objects;
create policy "Admin update academic files" on storage.objects
  for update to authenticated
  using (bucket_id = 'academic-files' and public.is_admin())
  with check (bucket_id = 'academic-files' and public.is_admin());
drop policy if exists "Admin delete academic files" on storage.objects;
create policy "Admin delete academic files" on storage.objects
  for delete to authenticated using (bucket_id = 'academic-files' and public.is_admin());

grant usage on schema public to anon, authenticated;

grant select on table
  public.profiles,
  public.courses,
  public.publications,
  public.timeline_events,
  public.academic_files,
  public.course_forums,
  public.forum_replies
to anon, authenticated;

revoke insert on table public.forum_replies from anon;
grant insert on table public.forum_replies to authenticated;

grant insert, update, delete on table
  public.profiles,
  public.courses,
  public.publications,
  public.timeline_events,
  public.academic_files,
  public.course_forums,
  public.forum_replies
to authenticated;

grant execute on function public.increment_forum_like(text) to authenticated;
grant execute on function public.increment_reply_like(text) to authenticated;

insert into public.profiles (
  id, full_name, role, institution, location, email, bio, interests, metrics
)
values (
  'main',
  'Carlos Fernando López Rengifo',
  'Docente universitario',
  'Universidad Nacional del Centro del Perú',
  'Huancayo, Perú',
  'correo.institucional@uncp.edu.pe',
  'Perfil academico para presentar trayectoria docente, investigacion, materiales de cursos y produccion cientifica en un solo lugar.',
  '["Docencia universitaria","Investigacion aplicada","Gestion academica","Produccion cientifica"]'::jsonb,
  '[{"label":"Cursos historicos","value":"24+"},{"label":"Publicaciones","value":"18+"},{"label":"Años de docencia","value":"20+"},{"label":"Recursos academicos","value":"120+"}]'::jsonb
)
on conflict (id) do update set
  full_name = excluded.full_name,
  institution = excluded.institution,
  location = excluded.location;

insert into public.courses (code, name, period, status, school, description)
values
  ('CUR-401', 'Seminario de Investigacion', '2026-I', 'Actual', 'Facultad UNCP', 'Materiales, silabo, lecturas base, formatos de avance y recursos para trabajos de investigacion.'),
  ('CUR-302', 'Metodologia Cientifica', '2026-I', 'Actual', 'Facultad UNCP', 'Guias de clase, rubricas, practicas y bibliografia organizada por unidad.'),
  ('CUR-215', 'Curso Historico de Especialidad', '2025-II', 'Historico', 'Facultad UNCP', 'Curso archivado con materiales disponibles para consulta y referencia de estudiantes.')
on conflict (code) do nothing;

insert into public.publications (id, title, publication_year, publication_type, venue, authors, status)
values
  ('publication-2025-article', 'Articulo cientifico sobre investigacion aplicada', 2025, 'Articulo', 'Revista academica', 'Carlos F. López Rengifo; coautores por confirmar', 'Publicado'),
  ('publication-2024-congress', 'Trabajo presentado en congreso universitario', 2024, 'Ponencia', 'Congreso nacional', 'Carlos F. López Rengifo', 'Disponible'),
  ('publication-2023-report', 'Informe tecnico de proyecto academico', 2023, 'Informe', 'Repositorio institucional', 'Equipo de investigacion', 'Archivo')
on conflict (id) do nothing;

insert into public.timeline_events (id, event_year, title, category, description)
values
  ('timeline-2002', '2002', 'Inicio de trayectoria academica', 'Formacion', 'Registro inicial de estudios superiores, especializacion y primeras experiencias profesionales.'),
  ('timeline-2008', '2008', 'Ingreso a la docencia universitaria', 'Docencia', 'Inicio de cursos universitarios, asesorias y trabajo directo con estudiantes.'),
  ('timeline-2014', '2014', 'Consolidacion en investigacion', 'Investigacion', 'Participacion en proyectos, articulos y presentaciones academicas.'),
  ('timeline-2018', '2018', 'Gestion academica y comisiones', 'Gestion', 'Participacion en coordinaciones, comites y mejora de procesos universitarios.'),
  ('timeline-2022', '2022', 'Repositorio academico personal', 'Publicaciones', 'Organizacion de articulos, trabajos cientificos y materiales de cursos para consulta publica.'),
  ('timeline-2026', '2026', 'Perfil profesional digital', 'Actualidad', 'Lanzamiento de una web academica con CV, cursos, historico, publicaciones y administracion propia.')
on conflict (id) do nothing;

insert into public.course_forums (id, course_code, title, description, status, likes)
values
  ('forum-401-01', 'CUR-401', 'Dudas sobre el planteamiento del problema', 'Espacio para discutir formulacion del problema, variables, objetivos e hipotesis del proyecto.', 'Abierto', 16),
  ('forum-302-01', 'CUR-302', 'Bibliografia para enfoque cuantitativo', 'Recomendaciones de lecturas, normas de citacion y ejemplos para trabajos de metodologia.', 'Abierto', 11),
  ('forum-215-01', 'CUR-215', 'Consulta sobre materiales historicos', 'Foro archivado para conservar preguntas frecuentes y respuestas utiles de ciclos anteriores.', 'Solo lectura', 24)
on conflict (id) do nothing;

insert into public.forum_replies (id, forum_id, parent_reply_id, author_name, body, depth, likes)
values
  ('reply-401-1', 'forum-401-01', null, 'Estudiante', 'Profesor, si mi tema tiene dos variables, debo plantear un problema general o dos problemas especificos?', 1, 5),
  ('reply-401-2', 'forum-401-01', 'reply-401-1', 'Carlos F. López Rengifo', 'Parte por un problema general que integre ambas variables. Luego formula problemas especificos para cada relacion que quieras observar.', 2, 9),
  ('reply-401-3', 'forum-401-01', 'reply-401-2', 'Estudiante', 'Entonces los objetivos especificos deben corresponder uno a uno con esos problemas especificos.', 3, 3),
  ('reply-302-1', 'forum-302-01', null, 'Estudiante', 'Comparto una duda sobre que autores conviene usar para justificar el enfoque cuantitativo.', 1, 4),
  ('reply-302-2', 'forum-302-01', 'reply-302-1', 'Carlos F. López Rengifo', 'Usen autores base del silabo y complementen con articulos recientes del area de aplicacion.', 2, 7),
  ('reply-215-1', 'forum-215-01', null, 'Egresado', 'El material de lecturas sigue siendo util como referencia para tesis?', 1, 6),
  ('reply-215-2', 'forum-215-01', 'reply-215-1', 'Carlos F. López Rengifo', 'Si, pero revisen si existen ediciones mas recientes antes de citar.', 2, 10),
  ('reply-215-3', 'forum-215-01', 'reply-215-2', 'Estudiante', 'Seria bueno mantener el hilo con enlaces actualizados.', 3, 8)
on conflict (id) do nothing;
