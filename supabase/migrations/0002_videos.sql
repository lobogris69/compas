-- Compás — videoteca de la academia.
-- Los profes suben vídeos (clases, figuras, eventos, actuaciones), los organizan
-- por categoría y los alumnos los buscan/ven/descargan.
-- En modo nube, `url` apunta a Supabase Storage o a un enlace externo.

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  titulo text not null,
  categoria text not null default 'Sin categoría',
  url text not null,
  descripcion text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists videos_academia_idx on videos(academia_id);
create index if not exists videos_categoria_idx on videos(academia_id, categoria);

alter table videos enable row level security;

-- Lectura pública (los alumnos repasan); gestiona solo el dueño de la academia.
create policy videos_select on videos for select using (true);
create policy videos_cud on videos for all
  using (es_dueno_academia(academia_id))
  with check (es_dueno_academia(academia_id));
