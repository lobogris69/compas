-- Compás — acceso de profesores. El dueño invita por email; cuando esa persona
-- entra con ese email, gana permisos de profesor en la academia (subir vídeos,
-- ver estado de clases). No toca ajustes ni borra la academia.

create table if not exists miembros (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  email text not null,
  rol text not null default 'profesor' check (rol in ('profesor')),
  created_at timestamptz not null default now(),
  unique (academia_id, email)
);
create index if not exists miembros_academia_idx on miembros(academia_id);
create index if not exists miembros_email_idx on miembros(lower(email));

alter table miembros enable row level security;

-- Lectura pública (el profe ve su acceso; el dueño lista los suyos).
create policy miembros_select on miembros for select using (true);
-- Gestionar invitaciones: solo el dueño de la academia.
create policy miembros_cud on miembros for all
  using (es_dueno_academia(academia_id))
  with check (es_dueno_academia(academia_id));

-- ¿Es el usuario actual profesor de esta academia? (por el email de su sesión)
create or replace function es_profesor_academia(aid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(
    select 1 from miembros
    where academia_id = aid
      and rol = 'profesor'
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Los profesores también pueden gestionar la videoteca.
drop policy if exists videos_cud on videos;
create policy videos_cud on videos for all
  using (es_dueno_academia(academia_id) or es_profesor_academia(academia_id))
  with check (es_dueno_academia(academia_id) or es_profesor_academia(academia_id));
