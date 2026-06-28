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

### Backend (preparado, aún no conectado)
- Esquema **Supabase multi-tenant + RLS** (`supabase/migrations/0001_init.sql`):
  academias, alumnos, clases, asistencias.

## 🔜 Siguiente (ideas para continuar)
- Conectar el modo nube (Supabase) detrás del store, sin tocar componentes.
- Edición de perfil del alumno (foto real con subida a storage).
- **Avisos de refuerzo**: simulación del mensaje (texto listo para WhatsApp) y,
  más adelante, envío real (ver `docs/academia-baile/03-whatsapp.md`).
- Autenticación real (dueño de academia vs alumno).
- Branding aplicado (usar el color de la academia en toda su área).
- Onboarding por pasos (wizard multi-pantalla) y plantillas por estilo.
- Página pública de la academia (horarios, precios, eventos).

## Cómo verlo
```bash
cd compas && npm install && npm run dev
```
Abre http://localhost:3000 → "Ver demo" lleva al panel con la clase descompensada.
