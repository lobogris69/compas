-- Compás — cierre de seguridad (parte 1).
--
-- Contexto: la clave `anon` es pública por diseño (viaja en el bundle), así que
-- lo único que separa a los inquilinos es RLS. Varias políticas quedaron en
-- `using (true)` durante el desarrollo y exponían datos personales y
-- financieros de TODAS las academias, además de permitir borrados anónimos.
--
-- Esta migración cierra lo crítico sin romper el autoservicio del alumno
-- (que hoy no tiene login): las lecturas sensibles pasan a gestores, los
-- borrados masivos también, y las altas anónimas se limitan a datos coherentes
-- dentro de una misma academia.

-- ───────────── Datos financieros: solo el equipo de la academia ─────────────

drop policy if exists pagos_select on pagos;
create policy pagos_select on pagos for select
  using (es_dueno_academia(academia_id) or es_profesor_academia(academia_id));

drop policy if exists planes_select on planes_pago;
create policy planes_select on planes_pago for select
  using (es_dueno_academia(academia_id) or es_profesor_academia(academia_id));

-- ───────────── Emails de profesores: solo el equipo ─────────────
-- Ojo: `es_profesor_academia` compara el email del JWT contra esta misma
-- tabla y es SECURITY DEFINER, así que sigue funcionando aunque la política
-- cierre la lectura directa.

drop policy if exists miembros_select on miembros;
create policy miembros_select on miembros for select
  using (es_dueno_academia(academia_id) or es_profesor_academia(academia_id));

-- ───────────── Borrados masivos: solo gestores ─────────────
-- Antes, cualquier anónimo podía vaciar las matrículas de toda la plataforma.
-- Contrapartida asumida: el alumno ya no se desmatricula solo desde su perfil;
-- lo hace el profe (hasta que exista login de alumno).

drop policy if exists matriculas_delete on matriculas;
create policy matriculas_delete on matriculas for delete
  using (es_dueno_academia(academia_id) or es_profesor_academia(academia_id));

-- ───────────── Altas anónimas: permitidas, pero coherentes ─────────────
-- No podemos identificar al alumno (aún no hay login), pero sí exigir que lo
-- que se inserta pertenezca de verdad a la academia indicada. Esto corta la
-- inyección de basura entre inquilinos.

drop policy if exists alumnos_insert on alumnos;
create policy alumnos_insert on alumnos for insert with check (
  exists (select 1 from academias ac where ac.id = alumnos.academia_id)
);

drop policy if exists matriculas_insert on matriculas;
create policy matriculas_insert on matriculas for insert with check (
  exists (
    select 1 from clases c
    where c.id = matriculas.clase_id and c.academia_id = matriculas.academia_id
  )
  and exists (
    select 1 from alumnos a
    where a.id = matriculas.alumno_id and a.academia_id = matriculas.academia_id
  )
);

drop policy if exists asistencias_insert on asistencias;
create policy asistencias_insert on asistencias for insert with check (
  exists (
    select 1 from clases c
    where c.id = asistencias.clase_id and c.academia_id = asistencias.academia_id
  )
  and exists (
    select 1 from alumnos a
    where a.id = asistencias.alumno_id and a.academia_id = asistencias.academia_id
  )
);

drop policy if exists asistencias_update on asistencias;
create policy asistencias_update on asistencias for update
  using (
    exists (
      select 1 from alumnos a
      where a.id = asistencias.alumno_id and a.academia_id = asistencias.academia_id
    )
  );

-- ───────────── Storage: cada usuario manda en su carpeta ─────────────
-- Antes, cualquier persona registrada podía borrar o sustituir los logos y
-- vídeos de CUALQUIER academia (las políticas concedían acceso a todo el
-- bucket). Ahora la primera carpeta del objeto debe ser el uuid del usuario
-- que sube, y solo él puede modificar o borrar lo suyo.
-- Requiere src/lib/storage.ts subiendo a `<auth.uid()>/<fichero>`.

drop policy if exists "logos subir autenticado" on storage.objects;
drop policy if exists "logos actualizar autenticado" on storage.objects;
drop policy if exists "logos borrar autenticado" on storage.objects;

create policy "logos subir propio" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "logos actualizar propio" on storage.objects for update to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "logos borrar propio" on storage.objects for delete to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "videos subir autenticado" on storage.objects;
drop policy if exists "videos actualizar autenticado" on storage.objects;
drop policy if exists "videos borrar autenticado" on storage.objects;

create policy "videos subir propio" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "videos actualizar propio" on storage.objects for update to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "videos borrar propio" on storage.objects for delete to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ───────────── Pendiente para la parte 2 (necesita cambios de app) ─────────────
--  · Nombres/teléfonos de alumnos siguen siendo legibles por `anon`: cerrarlo
--    requiere login de alumno o mover las lecturas a rutas de servidor.
--  · `asistencias_select` y `matriculas_select` siguen abiertas por el mismo
--    motivo (el alumno anónimo necesita ver su clase).
--  · En Supabase → Authentication → Providers → Email: ACTIVAR "Confirm email".
--    Sin confirmación, cualquiera puede registrarse con el email de un profesor
--    y heredar sus permisos vía es_profesor_academia().
