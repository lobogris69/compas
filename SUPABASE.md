# Conectar Compás a Supabase (modo real)

> ⚠️ **Proyecto independiente.** Compás NO comparte nada con CuentaClara ni con
> ningún otro proyecto. Crea un **proyecto Supabase NUEVO y exclusivo** para
> Compás. No reutilices la base de datos de otra app.

Compás funciona en **modo local** (localStorage) sin configurar nada. Para
persistencia real multi-academia, conéctalo a su propio Supabase.

## 1. Crear el proyecto y aplicar el esquema
1. Crea un proyecto **nuevo** en [supabase.com](https://supabase.com) (solo para Compás).
2. En el **SQL Editor**, ejecuta en orden:
   - `supabase/migrations/0001_init.sql` (academias, alumnos, clases, asistencias + RLS)
   - `supabase/migrations/0002_videos.sql` (videoteca + RLS)

## 2. Configurar las variables de entorno
Copia `.env.local.example` a `.env.local` y rellena con **las claves de tu
proyecto nuevo** (Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO-COMPAS.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Con esas variables, la app arranca en **modo real** automáticamente
(`isSupabaseEnabled`).

## 3. Auth (dueños de academia)
- Login **email + contraseña** ya implementado (`/entrar`, `src/lib/auth.tsx`).
- En el panel de Supabase, **Authentication → Providers → Email**: decide si
  exiges confirmación de email. Para pruebas puedes desactivarla.
- Al crear una academia logueado, se guarda con `owner = tu usuario`; las
  políticas RLS solo te dejan gestionar **tus** academias.

## 4. Qué hace ya el modo real
- **Store cableado** (`src/lib/store.tsx`): en modo nube no usa demo ni
  localStorage para los datos; carga cada academia desde Supabase bajo demanda
  (`cargarAcademia`) y **persiste cada cambio** (write-through) vía
  `src/lib/remote.ts`. Los ids se generan en cliente (UUID) para que memoria y
  BD coincidan.
- Crear academia, clases, alumnos, RSVP, vídeos y bajas → se guardan en Supabase.

## 5. Pendiente para completar el modo real
- **Subida de archivos de vídeo a Storage** (hoy los vídeos se añaden por enlace).
- Afinar estados de carga/errores con pruebas contra el proyecto real.
- Reglas de Storage y, si se quiere, login también para alumnos.

> Todo el código de modo real está escrito y compila, pero **necesita probarse
> contra tu proyecto Supabase real** para pulir detalles de RLS y Auth.
