# Progreso de Compás

Registro de lo construido durante el desarrollo autónomo. Estado vivo.

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

### Backend (preparado, aún no conectado)
- Esquema **Supabase multi-tenant + RLS** (`supabase/migrations/0001_init.sql`):
  academias, alumnos, clases, asistencias.

## 🔜 Siguiente (ideas para continuar)
- Conectar el modo nube (Supabase) detrás del store, sin tocar componentes.
- Autenticación real (dueño de academia vs alumno).
- Branding aplicado (usar el color de la academia en toda su área).
- Onboarding por pasos (wizard multi-pantalla) y plantillas por estilo.
- Página pública de la academia (horarios, precios, eventos).
- Envío real de avisos (API de Meta o no oficial; ver
  `docs/academia-baile/03-whatsapp.md`).

## Cómo verlo
```bash
cd compas && npm install && npm run dev
```
Abre http://localhost:3000 → "Ver demo" lleva al panel con la clase descompensada.
