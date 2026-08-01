-- Compás — registro de avisos de refuerzo.
--
-- El sugeridor era determinista, así que las mismas personas recibían TODOS los
-- avisos, siempre. En tres semanas silencian a la academia. Guardando a quién se
-- avisó y cuándo, podemos repartir la carga y dejar descansar a quien ya fue
-- avisado hace poco.

create table if not exists avisos_refuerzo (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  clase_id uuid not null references clases(id) on delete cascade,
  alumno_id uuid not null references alumnos(id) on delete cascade,
  fecha date not null,
  created_at timestamptz not null default now()
);
create index if not exists avisos_academia_idx on avisos_refuerzo(academia_id);
create index if not exists avisos_alumno_idx on avisos_refuerzo(alumno_id, created_at desc);

alter table avisos_refuerzo enable row level security;

-- Solo el equipo avisa, y solo el equipo ve a quién se avisó.
create policy avisos_select on avisos_refuerzo for select
  using (es_dueno_academia(academia_id) or es_profesor_academia(academia_id));
create policy avisos_cud on avisos_refuerzo for all
  using (es_dueno_academia(academia_id) or es_profesor_academia(academia_id))
  with check (es_dueno_academia(academia_id) or es_profesor_academia(academia_id));
