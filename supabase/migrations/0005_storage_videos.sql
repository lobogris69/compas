-- Compás — almacenamiento de vídeos en Supabase Storage.
-- Bucket público con límite de tamaño (100 MB) y tipos de vídeo permitidos.
-- Guardamos solo la URL pública en videos.url.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos', 'videos', true,
  104857600, -- 100 MB
  array['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = excluded.public;

-- Lectura pública de los vídeos.
drop policy if exists "videos lectura publica" on storage.objects;
create policy "videos lectura publica"
  on storage.objects for select
  using (bucket_id = 'videos');

-- Subir: cualquier usuario autenticado (dueño).
drop policy if exists "videos subir autenticado" on storage.objects;
create policy "videos subir autenticado"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'videos');

-- Actualizar / borrar: usuario autenticado.
drop policy if exists "videos actualizar autenticado" on storage.objects;
create policy "videos actualizar autenticado"
  on storage.objects for update to authenticated
  using (bucket_id = 'videos');

drop policy if exists "videos borrar autenticado" on storage.objects;
create policy "videos borrar autenticado"
  on storage.objects for delete to authenticated
  using (bucket_id = 'videos');
