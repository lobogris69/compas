-- Compás — matrículas: qué alumno va a qué clase (puede ir a varias).
-- Habilita contar "alumnos de la clase" frente a los que confirman asistencia.

create table if not exists matriculas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  clase_id uuid not null references clases(id) on delete cascade,
  alumno_id uuid not null references alumnos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (clase_id, alumno_id)
);
create index if not exists matriculas_academia_idx on matriculas(academia_id);
create index if not exists matriculas_clase_idx on matriculas(clase_id);
create index if not exists matriculas_alumno_idx on matriculas(alumno_id);

alter table matriculas enable row level security;

-- Lectura dentro de la academia (pública, como el resto de datos visibles).
create policy matriculas_select on matriculas for select using (true);
-- Auto-servicio del alumno (sin login) y gestión por dueño/profe: insert/delete
-- abiertos, igual que alumnos y asistencias.
create policy matriculas_insert on matriculas for insert with check (true);
create policy matriculas_delete on matriculas for delete using (true);
