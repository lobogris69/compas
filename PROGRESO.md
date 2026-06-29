# Progreso de Compás

Registro de lo construido durante el desarrollo autónomo. Estado vivo.

## 📌 Requisitos confirmados por el dueño
- **Perfiles de alumno con datos básicos y foto** para que los miembros de una
  clase / academia **se conozcan mejor entre ellos**. ✅ *Implementado*:
  `/a/[slug]/perfil` (rol, nivel, Instagram, bio, visibilidad opt-in) +
  **directorio de comunidad** `/a/[slug]/alumnos`. Las fotos también salen en
  "quién viene" del detalle de clase.
- **Videoteca**: los profes suben vídeos (clases, figuras, eventos, actuaciones),
  los **organizan por categoría** y los **renombran**; los alumnos los **buscan
  por nombre** (p. ej. "El Sombrero"), los **ven y descargan**. ✅ *Implementado*:
  `/a/[slug]/videos` (búsqueda + filtro de categorías + ver/descargar; alta,
  renombrar y borrar solo para el dueño). En modo local los vídeos se añaden por
  **enlace**; la **subida de archivo** a almacenamiento llega con el modo nube
  (tabla `videos` + RLS en `0002_videos.sql`, adaptador en `remote.ts`).
- **Baja de alumnos**: cuando alguien deja la escuela, el dueño puede **darlo de
  baja** fácilmente. ✅ *Implementado*: botón "Dar de baja" en el directorio
  (solo dueño); elimina al alumno y limpia sus respuestas de asistencia.

## ✅ Hecho

### Cimientos
- Proyecto Next.js 14 + TypeScript + Tailwind **nuevo e independiente** (`compas/`),
  separado por completo de CuentaClara.
- Modo **local-first**: funciona sin backend (localStorage) y se siembra con una
  academia de demo (Salsa Studio Madrid, con una clase descompensada a propósito).
- Build de producción y typecheck **en verde**.

### Motor de balance (`src/lib/balance.ts`) — el corazón
- Calcula leaders/followers de una sesión repartiendo los **"ambos"** al rol en minoría.
- Estado **verde / ámbar / rojo** según la tolerancia configurada.
- Dice **cuántos faltan y de qué rol**.
- **Sugerencia de refuerzos**: alumnos compatibles (rol + nivel) que no vienen ese día.

### Pantallas
- **Landing** (`/`) con propuesta de valor.
- **Alta de academia** (`/academia/nueva`): identidad (nombre, emoji, color),
  estilos y primera clase. Genera slug y enlace propio.
- **Panel de la academia** (`/a/[slug]/panel`): semáforo de balance por clase,
  enlace + **QR** de invitación, accesos a alumnos y ajustes.
- **Detalle de clase** (`/a/[slug]/clase/[id]`): balance en vivo, reparto de
  "ambos", **panel de refuerzos** con botón "Apuntar", y lista de asistentes.
- **Home del alumno** (`/a/[slug]`): identidad ligera, **RSVP Sí/No** a las
  próximas clases (mueve el balance al instante).
- **Registro de alumno** (`/a/[slug]/unirse`): rol (leader/follower/ambos),
  nivel y **perfil opcional** con visibilidad opt-in.
- **Comunidad** (`/a/[slug]/alumnos`): directorio filtrable por rol.
- **Configuración** (`/a/[slug]/config`): editar reglas del motor de balance
  (tolerancia, antelación, cupo, niveles) y añadir clases.

### Avisos de refuerzo (el gancho) — `src/lib/aviso.ts`
- Genera el **mensaje de refuerzo** (grupal y directo) listo para enviar.
- Botón **"Enviar aviso por WhatsApp"** y enlace directo por candidato
  (enlace `wa.me` con el texto ya escrito).

### Perfil y comunidad
- **Edición de perfil** del alumno (`/a/[slug]/perfil`): rol, nivel, instagram,
  bio, visibilidad y **foto** (modo local, dataURL).
- La foto aparece en el directorio de comunidad.

### Calidad
- **8 tests** del motor de balance con vitest (`npm test`), todos en verde:
  equilibrio, reparto de "ambos", déficit, estados, refuerzos y compatibilidad
  de nivel.

### Permisos y branding
- **Modelo de propiedad** (modo local): `soyDueno(academiaId)`. La demo te marca
  como dueño. La **configuración** está gateada solo al dueño; "Ajustes" se
  oculta a los no-dueños.
- **Branding por academia**: barra superior con el color de la academia en toda
  su área (layout de segmento).
- **Página pública de horarios** (`/a/[slug]/horarios`) para compartir.

### Backend (modo nube — preparado, falta cablear el store)
- Esquema **Supabase multi-tenant + RLS** (`supabase/migrations/0001_init.sql`).
- **Adaptador de datos** tipado (`src/lib/remote.ts`): CRUD contra el esquema
  con mapeo snake_case ↔ camelCase.
- Guía de conexión en `SUPABASE.md`. Paso pendiente: migrar el store a asíncrono
  y delegar en `remote.ts` cuando haya credenciales.

## 🔜 Siguiente (ideas para continuar)
- Cablear el store a `remote.ts` (modo nube) y añadir login (Supabase Auth).
- Onboarding por pasos (wizard multi-pantalla) y plantillas por estilo.
- Precios/eventos en la página pública.
- **Envío real de avisos** (API de Meta o no oficial; requiere credenciales —
  ver `docs/academia-baile/03-whatsapp.md`).

## Cómo verlo
```bash
cd compas && npm install && npm run dev
```
Abre http://localhost:3000 → "Ver demo" lleva al panel con la clase descompensada.
