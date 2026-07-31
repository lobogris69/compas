-- Compás — login del alumno por enlace mágico (magic link).
--
-- Hasta ahora el alumno no tenía cuenta: su identidad vivía en el localStorage
-- del navegador. Eso causaba tres problemas: (1) no podía editar su perfil en
-- modo nube, porque RLS no podía distinguirlo de un extraño; (2) perdía su
-- identidad al cambiar de móvil o borrar datos; (3) al volver a apuntarse creaba
-- un duplicado que falseaba el balance de la clase.
--
-- El email es OPCIONAL: quien no lo dé sigue apuntándose como hasta ahora.
-- Quien lo dé podrá entrar con un enlace y "reclamar" su ficha.

alter table alumnos add column if not exists email text not null default '';

-- Un mismo email no puede repetirse dentro de la misma academia (los que no dan
-- email quedan fuera del índice y pueden ser varios).
create unique index if not exists alumnos_email_academia_idx
  on alumnos (academia_id, lower(email))
  where email <> '';

create index if not exists alumnos_user_idx on alumnos(user_id);

-- Reclamar la ficha: un usuario autenticado puede vincularse a la ficha de
-- alumno que lleva SU email y que todavía no tiene dueño. Es lo que rompe el
-- círculo vicioso (sin esto no podría escribir su propio user_id).
drop policy if exists alumnos_reclamar on alumnos;
create policy alumnos_reclamar on alumnos for update to authenticated
  using (
    user_id is null
    and email <> ''
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (user_id = auth.uid());

-- A partir de ahí, la política alumnos_update (0009) ya le deja editar su
-- perfil, porque `user_id = auth.uid()` pasa a ser cierto.

-- Con la ficha ya vinculada, el alumno recupera algo que perdió en 0010: puede
-- quitarse él mismo de una clase, porque ahora sí sabemos que es él. Los
-- anónimos siguen sin poder (era la vía para vaciar la plataforma entera).
drop policy if exists matriculas_delete on matriculas;
create policy matriculas_delete on matriculas for delete
  using (
    es_dueno_academia(academia_id)
    or es_profesor_academia(academia_id)
    or exists (
      select 1 from alumnos a
      where a.id = matriculas.alumno_id and a.user_id = auth.uid()
    )
  );

-- El email es dato personal y la tabla `alumnos` todavía es legible por `anon`
-- (se cerrará del todo en la parte 2). Como la app nunca necesita leerlo en el
-- cliente —la vinculación se resuelve en el servidor—, se lo quitamos a `anon`.
--
-- OJO: un `revoke select (email)` NO basta. En Postgres el permiso de columna no
-- anula el de tabla: mientras `anon` tenga SELECT sobre la tabla entera sigue
-- leyendo todas las columnas. Hay que retirar el permiso de tabla y volver a
-- concederlo solo sobre las columnas permitidas (las mismas que pide
-- `remote.alumnosDe`).
revoke select on alumnos from anon;
grant select (
  id, academia_id, user_id, nombre, rol, nivel, sexo, telefono, estilos,
  foto_url, bio, bailando_desde, instagram, visibilidad, created_at
) on alumnos to anon;
