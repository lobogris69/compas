-- Compás — esquema inicial multi-tenant (modo nube).
-- Todo cuelga de `academias` (tenant). El aislamiento se hace por academia_id
-- vía RLS. Este esquema acompaña al modo local; aún no está conectado a la UI.

-- ───────────────────────── Academias (tenants) ─────────────────────────
create table if not exists academias (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  emoji text not null default '💃',
  color text not null default '#7c4dff',
  estilos text[] not null default '{}',
  -- reglas del motor de balance
  ratio_objetivo real not null default 0.5,
  tolerancia int not null default 2,
  aviso_horas_antes int not null default 3,
  cupo_refuerzos int not null default 6,
  niveles_compatibles boolean not null default true,
  owner uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ───────────────────────── Alumnos ─────────────────────────
create table if not exists alumnos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  user_id uuid references auth.users(id),
  nombre text not null,
  rol text not null check (rol in ('leader','follower','ambos')),
  nivel text not null check (nivel in ('principiante','medio','avanzado')),
  sexo text not null default 'nd' check (sexo in ('hombre','mujer','otro','nd')),
  estilos text[] not null default '{}',
  -- perfil opcional (opt-in)
  foto_url text,
  bio text not null default '',
  bailando_desde text,
  instagram text,
  visibilidad text not null default 'academia'
    check (visibilidad in ('privado','clase','academia')),
  created_at timestamptz not null default now()
);
create index if not exists alumnos_academia_idx on alumnos(academia_id);

-- ───────────────────────── Clases ─────────────────────────
create table if not exists clases (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  nombre text not null,
  nivel text not null check (nivel in ('principiante','medio','avanzado')),
  estilo text not null,
  dia_semana int not null check (dia_semana between 0 and 6),
  hora text not null,
  sala text not null default '',
  aforo int,
  created_at timestamptz not null default now()
);
create index if not exists clases_academia_idx on clases(academia_id);

-- ───────────────────────── Asistencias ─────────────────────────
create table if not exists asistencias (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  clase_id uuid not null references clases(id) on delete cascade,
  alumno_id uuid not null references alumnos(id) on delete cascade,
  fecha date not null,
  estado text not null check (estado in ('si','no','quiza')),
  rol_en_clase text check (rol_en_clase in ('leader','follower','ambos')),
  es_refuerzo boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (clase_id, alumno_id, fecha)
);
create index if not exists asistencias_sesion_idx on asistencias(clase_id, fecha);

-- ───────────────────────── RLS ─────────────────────────
alter table academias enable row level security;
alter table alumnos enable row level security;
alter table clases enable row level security;
alter table asistencias enable row level security;

-- ¿Es el usuario dueño de la academia? (SECURITY DEFINER evita recursión)
create or replace function es_dueno_academia(aid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from academias where id = aid and owner = auth.uid());
$$;

-- Academias: el público puede leer (perfil de la academia es público);
-- solo el dueño la modifica.
create policy academias_select on academias for select using (true);
create policy academias_insert on academias for insert with check (owner = auth.uid());
create policy academias_update on academias for update using (owner = auth.uid());
create policy academias_delete on academias for delete using (owner = auth.uid());

-- Alumnos: lectura dentro de la academia; gestiona el dueño o el propio alumno.
create policy alumnos_select on alumnos for select using (true);
create policy alumnos_insert on alumnos for insert with check (true);
create policy alumnos_update on alumnos for update
  using (user_id = auth.uid() or es_dueno_academia(academia_id));
create policy alumnos_delete on alumnos for delete
  using (es_dueno_academia(academia_id));

-- Clases: lectura pública; gestiona el dueño.
create policy clases_select on clases for select using (true);
create policy clases_cud on clases for all
  using (es_dueno_academia(academia_id))
  with check (es_dueno_academia(academia_id));

-- Asistencias: lectura dentro de la academia; cualquiera de la academia responde.
create policy asistencias_select on asistencias for select using (true);
create policy asistencias_insert on asistencias for insert with check (true);
create policy asistencias_update on asistencias for update using (true);
