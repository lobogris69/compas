-- Compás — cerrar los datos de contacto de los alumnos (parte 2 de seguridad).
--
-- Hasta ahora el teléfono de cualquier alumno era legible por cualquiera con la
-- anon key. Lo cerramos por permisos de columna: la tabla `alumnos` deja de ser
-- legible "entera" y solo se conceden las columnas que la app necesita para
-- pintar la comunidad y calcular el balance.
--
-- El teléfono se sirve aparte, por una función que comprueba que quien pregunta
-- es del equipo de esa academia. Así ni siquiera un alumno con sesión iniciada
-- puede sacar la agenda de teléfonos de sus compañeros.

-- Columnas públicas del alumno (sin email ni teléfono).
revoke select on alumnos from anon, authenticated;
grant select (
  id, academia_id, user_id, nombre, rol, nivel, sexo, estilos,
  foto_url, bio, bailando_desde, instagram, visibilidad, created_at
) on alumnos to anon, authenticated;

-- Teléfonos: solo para el dueño o los profesores de esa academia.
create or replace function telefonos_academia(aid uuid)
returns table (alumno_id uuid, telefono text)
language sql security definer stable set search_path = public as $$
  select a.id, a.telefono
  from alumnos a
  where a.academia_id = aid
    and (es_dueno_academia(aid) or es_profesor_academia(aid));
$$;

-- Ojo: Supabase concede EXECUTE a `anon` por privilegios por defecto, y un
-- `revoke ... from public` no retira esa concesión explícita. Hay que nombrar al
-- rol. (Aunque pudiera llamarla, la propia función no le devolvería nada: el
-- filtro de dueño/profesor va dentro. Esto es defensa en profundidad.)
revoke all on function telefonos_academia(uuid) from public, anon;
grant execute on function telefonos_academia(uuid) to authenticated;
