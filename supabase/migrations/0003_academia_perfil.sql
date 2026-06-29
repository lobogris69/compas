-- Compás — datos de perfil de la academia.
-- Amplía `academias` con ubicación, teléfono de contacto, logo y profesores
-- (cada profesor: nombre + estilos que imparte, guardados como jsonb).

alter table academias add column if not exists ubicacion  text  not null default '';
alter table academias add column if not exists telefono   text  not null default '';
alter table academias add column if not exists logo_url   text;
alter table academias add column if not exists profesores jsonb not null default '[]'::jsonb;
