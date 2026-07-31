-- Compás — asistencia real ("pasar lista").
--
-- Hasta ahora solo se guardaba el RSVP (quién DICE que viene). Nunca quién vino
-- de verdad. Sin eso no hay histórico, ni fiabilidad por alumno, ni informes que
-- vender, ni forma de predecir el balance antes de que la clase se descompense.
--
-- `asistio` es null mientras no se pase lista; true/false después.

alter table asistencias add column if not exists asistio boolean;

create index if not exists asistencias_alumno_idx on asistencias(alumno_id);

-- Pasar lista es un dato de la academia, no del alumno: nadie puede marcarse a
-- sí mismo como presente. Se retiran los permisos de tabla (recuerda: un permiso
-- de columna no anula el de tabla) y se conceden solo las columnas del RSVP.
-- `asistio` queda fuera, así que solo puede escribirlo la función de abajo.
revoke insert, update on asistencias from anon, authenticated;
grant insert (
  id, academia_id, clase_id, alumno_id, fecha, estado, rol_en_clase,
  es_refuerzo, updated_at
) on asistencias to anon, authenticated;
grant update (estado, rol_en_clase, es_refuerzo, updated_at)
  on asistencias to anon, authenticated;

-- Marcar si un alumno vino. Crea la fila si no había RSVP (alguien que aparece
-- sin avisar) y respeta el RSVP existente si ya lo había.
create or replace function marcar_asistencia(
  aid uuid, cid uuid, alid uuid, f date, vino boolean
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (es_dueno_academia(aid) or es_profesor_academia(aid)) then
    raise exception 'solo el equipo de la academia puede pasar lista';
  end if;

  insert into asistencias (
    academia_id, clase_id, alumno_id, fecha, estado, asistio, updated_at
  )
  values (
    aid, cid, alid, f,
    case when vino then 'si' else 'no' end,
    vino, now()
  )
  on conflict (clase_id, alumno_id, fecha)
  do update set asistio = excluded.asistio, updated_at = now();
end;
$$;

revoke all on function marcar_asistencia(uuid, uuid, uuid, date, boolean)
  from public, anon;
grant execute on function marcar_asistencia(uuid, uuid, uuid, date, boolean)
  to authenticated;
