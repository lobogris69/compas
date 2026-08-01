-- Compás — talleres y reservas.
--
-- Un taller es un evento puntual (o un curso corto) que la academia publica con
-- su cartel, horario, duración e importe, y que cualquiera puede reservar desde
-- una página pública sin tener cuenta.
--
-- La reserva pide el ROL (leader/follower/ambos) a propósito: es lo que
-- convierte esto en Compás y no en un formulario de reservas cualquiera. La
-- academia ve el equilibrio del taller y puede empujar el rol que falte, igual
-- que en las clases.
--
-- El cobro NO es automático: se muestran el Bizum y el IBAN de la academia, el
-- asistente paga por su cuenta y la academia confirma. Cobrar de verdad
-- requeriría una pasarela (Stripe), que es otro asunto.

-- Datos de cobro de la academia (para enseñárselos a quien reserva).
alter table academias add column if not exists bizum text not null default '';
alter table academias add column if not exists iban  text not null default '';

create table if not exists talleres (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  nombre text not null,
  descripcion text not null default '',
  fecha date,                       -- null = sin fecha fija todavía
  hora text not null default '',
  duracion_min int,
  importe numeric(10,2) not null default 0,
  plazas int,                       -- null = sin límite
  cartel_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists talleres_academia_idx on talleres(academia_id, activo);

alter table talleres enable row level security;
-- El taller es público: es lo que se comparte para que la gente reserve.
create policy talleres_select on talleres for select using (true);
create policy talleres_cud on talleres for all
  using (es_dueno_academia(academia_id) or es_profesor_academia(academia_id))
  with check (es_dueno_academia(academia_id) or es_profesor_academia(academia_id));

create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  taller_id uuid not null references talleres(id) on delete cascade,
  nombre text not null,
  email text not null default '',
  telefono text not null default '',
  rol text not null default 'ambos' check (rol in ('leader','follower','ambos')),
  metodo_pago text not null default 'bizum'
    check (metodo_pago in ('bizum','transferencia','efectivo')),
  estado text not null default 'pendiente'
    check (estado in ('pendiente','confirmada','cancelada')),
  notas text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists reservas_taller_idx on reservas(taller_id);
create index if not exists reservas_academia_idx on reservas(academia_id);

alter table reservas enable row level security;

-- Reservar puede cualquiera (no hace falta cuenta), pero solo sobre un taller
-- que exista de verdad y esté activo en esa academia.
create policy reservas_insert on reservas for insert with check (
  exists (
    select 1 from talleres t
    where t.id = reservas.taller_id
      and t.academia_id = reservas.academia_id
      and t.activo
  )
);

-- Las reservas llevan nombre, email y teléfono de gente que puede no ser alumna:
-- solo las ve y las gestiona el equipo de la academia.
create policy reservas_select on reservas for select
  using (es_dueno_academia(academia_id) or es_profesor_academia(academia_id));
create policy reservas_update on reservas for update
  using (es_dueno_academia(academia_id) or es_profesor_academia(academia_id))
  with check (es_dueno_academia(academia_id) or es_profesor_academia(academia_id));
create policy reservas_delete on reservas for delete
  using (es_dueno_academia(academia_id) or es_profesor_academia(academia_id));

-- Cuántas plazas quedan, sin destapar quién ha reservado: la página pública
-- necesita el número, no los nombres.
create or replace function plazas_taller(tid uuid)
returns table (reservadas int, leaders int, followers int)
language sql security definer stable set search_path = public as $$
  select
    count(*)::int,
    count(*) filter (where rol = 'leader')::int,
    count(*) filter (where rol = 'follower')::int
  from reservas
  where taller_id = tid and estado <> 'cancelada';
$$;
grant execute on function plazas_taller(uuid) to anon, authenticated;
