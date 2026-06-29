-- Compás — recordatorios de pago. Teléfono del alumno (para WhatsApp) y
-- mensaje de recordatorio configurable por la academia.

alter table alumnos add column if not exists telefono text not null default '';
alter table academias add column if not exists recordatorio_pago text not null default '';

-- Los profesores también pueden completar/editar datos del alumno (p. ej. el
-- teléfono que falte), no solo el dueño o el propio alumno.
drop policy if exists alumnos_update on alumnos;
create policy alumnos_update on alumnos for update
  using (
    user_id = auth.uid()
    or es_dueno_academia(academia_id)
    or es_profesor_academia(academia_id)
  );
