-- Compás — pagos. Cada academia define sus planes (modalidades) y se registran
-- los pagos de los alumnos contra ellos. Habilita saber quién está al día.

-- Planes de cobro que define cada academia (modalidades).
create table if not exists planes_pago (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('mensual','trimestral','semestral','anual','bono')),
  importe numeric(10,2) not null default 0,
  clases int,            -- solo para bonos (nº de clases que incluye)
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists planes_pago_academia_idx on planes_pago(academia_id);

alter table planes_pago enable row level security;
create policy planes_select on planes_pago for select using (true);
-- Configurar planes: solo el dueño.
create policy planes_cud on planes_pago for all
  using (es_dueno_academia(academia_id))
  with check (es_dueno_academia(academia_id));

-- Pagos registrados de los alumnos.
create table if not exists pagos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  alumno_id uuid not null references alumnos(id) on delete cascade,
  plan_id uuid references planes_pago(id) on delete set null,
  concepto text not null default '',
  tipo text not null check (tipo in ('mensual','trimestral','semestral','anual','bono')),
  importe numeric(10,2) not null default 0,
  fecha_pago date not null default now(),
  cubre_desde date,
  cubre_hasta date,
  clases int,            -- solo para bonos
  created_at timestamptz not null default now()
);
create index if not exists pagos_academia_idx on pagos(academia_id);
create index if not exists pagos_alumno_idx on pagos(alumno_id);

alter table pagos enable row level security;
create policy pagos_select on pagos for select using (true);
-- Registrar pagos: dueño o profesor.
create policy pagos_cud on pagos for all
  using (es_dueno_academia(academia_id) or es_profesor_academia(academia_id))
  with check (es_dueno_academia(academia_id) or es_profesor_academia(academia_id));
