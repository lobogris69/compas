# Conectar Compás a Supabase (modo nube)

Compás funciona en **modo local** (localStorage) sin configurar nada. Para
persistencia real y multi-academia de verdad, conéctalo a Supabase.

## 1. Crear el proyecto y aplicar el esquema
1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, pega y ejecuta `supabase/migrations/0001_init.sql`.
   Crea las tablas `academias`, `alumnos`, `clases`, `asistencias` con sus
   políticas RLS (aislamiento por academia).

## 2. Configurar las variables de entorno
Copia `.env.local.example` a `.env.local` y rellena:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Con esas variables, `isSupabaseEnabled` (en `src/lib/supabase.ts`) pasa a `true`.

## 3. Lo que ya está listo
- `src/lib/supabase.ts` — cliente singleton.
- `src/lib/remote.ts` — **adaptador de datos** tipado contra el esquema
  (academias, alumnos, clases, asistencias) con mapeo snake_case ↔ camelCase.

## 4. Paso pendiente: cablear el store
El store (`src/lib/store.tsx`) es hoy **síncrono** (local). Para usar el modo
nube hay que migrarlo a **asíncrono** y, cuando `isSupabaseEnabled`, delegar en
`remote.ts` en lugar de en localStorage. La API pública del store ya está
pensada para ese cambio (mismos nombres de métodos):

| Store (local) | Remoto (`remote.ts`) |
|---|---|
| `academiaPorSlug` | `academiaPorSlug` (async) |
| `crearAcademia` | `crearAcademia` (async) |
| `alumnosDe` / `crearAlumno` | idem (async) |
| `clasesDe` / `crearClase` | idem (async) |
| `asistenciasDe` / `responder` | idem (async, upsert) |

Recomendación: mantener el modo local como *fallback* offline y cachear lecturas,
igual que hace CuentaClara.

## 5. Autenticación
El esquema ya contempla `auth.users` (columna `owner` en academias, `user_id` en
alumnos) y las políticas RLS para que **solo el dueño** gestione su academia.
Falta añadir el login (Supabase Auth) y rellenar esas columnas al crear.
