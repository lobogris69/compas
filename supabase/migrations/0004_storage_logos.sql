-- Compás — almacenamiento de logos en Supabase Storage.
-- Bucket público (lectura libre) donde los dueños suben el logo de su academia.
-- Guardamos solo la URL pública en academias.logo_url, no el archivo en la BD.

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Lectura pública de los logos.
drop policy if exists "logos lectura publica" on storage.objects;
create policy "logos lectura publica"
  on storage.objects for select
  using (bucket_id = 'logos');

-- Subir: cualquier usuario autenticado (dueño).
drop policy if exists "logos subir autenticado" on storage.objects;
create policy "logos subir autenticado"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'logos');

-- Actualizar / borrar: usuario autenticado.
drop policy if exists "logos actualizar autenticado" on storage.objects;
create policy "logos actualizar autenticado"
  on storage.objects for update to authenticated
  using (bucket_id = 'logos');

drop policy if exists "logos borrar autenticado" on storage.objects;
create policy "logos borrar autenticado"
  on storage.objects for delete to authenticated
  using (bucket_id = 'logos');
