-- Compás — datos de contacto para exportar.
--
-- Email y teléfono no son legibles desde la tabla (0011 y 0012): protegen al
-- alumno. Pero la academia SÍ necesita esos datos: son sus alumnos, y sin poder
-- exportarlos no hay quien adopte el sistema (además del derecho a portabilidad
-- que da el RGPD).
--
-- Igual que con los teléfonos, la comprobación va dentro de la función: solo el
-- dueño o un profesor de esa academia obtienen algo.

create or replace function contacto_academia(aid uuid)
returns table (alumno_id uuid, email text, telefono text)
language sql security definer stable set search_path = public as $$
  select a.id, a.email, a.telefono
  from alumnos a
  where a.academia_id = aid
    and (es_dueno_academia(aid) or es_profesor_academia(aid));
$$;

revoke all on function contacto_academia(uuid) from public, anon;
grant execute on function contacto_academia(uuid) to authenticated;
