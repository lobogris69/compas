# 💃 Compás

> La app SaaS multi-academia que **cuadra las clases de baile**: equilibra
> leaders y followers en cada clase y llama a refuerzos automáticamente.

Proyecto **nuevo e independiente** (no forma parte de CuentaClara). Stack:
**Next.js 14 + TypeScript + Tailwind + Supabase**.

## Estado actual (MVP funcional, modo local)

La app **funciona sin backend**: usa `localStorage` (modo local) y se siembra con
una academia de demo al abrirla, para verla viva al instante. Supabase queda
preparado para el modo nube multi-academia.

### Funciona ya
- 🏠 **Landing** con propuesta de valor.
- 🪄 **Alta de academia** (asistente): identidad, estilos, primera clase.
- ⚖️ **Panel con semáforo de balance** por clase (verde/ámbar/rojo).
- 🔍 **Detalle de clase**: balance en vivo, reparto de "ambos" al rol en minoría,
  y **sugerencia de refuerzos** del rol que falta.
- 🙋 **Registro de alumno** con rol (leader/follower/ambos), nivel y **perfil
  opcional** (privacidad opt-in).
- 🪪 **Directorio de comunidad** filtrable por rol.
- 🔗 **Enlace + QR** para que la academia invite a sus alumnos.

## Cómo arrancar

```bash
cd compas
npm install
npm run dev        # http://localhost:3000
```

No hace falta configurar nada: arranca en modo local. Para el modo nube, copia
`.env.local.example` a `.env.local` y rellena las claves de Supabase.

## Arquitectura

```
src/
  app/
    page.tsx                     Landing
    academia/nueva/page.tsx      Alta de academia (wizard)
    a/[slug]/panel/page.tsx      Panel admin (semáforo de balance)
    a/[slug]/clase/[id]/page.tsx Detalle de clase + refuerzos
    a/[slug]/unirse/page.tsx     Registro de alumno
    a/[slug]/alumnos/page.tsx    Directorio de comunidad
  components/ui.tsx              Primitivas (Button, Card, RolBadge, BalanceBar…)
  lib/
    types.ts                     Modelo de datos
    balance.ts                   ⭐ Motor de balance y refuerzos
    store.tsx                    Estado local-first (localStorage)
    demo.ts                      Datos de demostración
    supabase.ts                  Cliente Supabase (modo nube)
supabase/
  migrations/0001_init.sql       Esquema multi-tenant + RLS (modo nube)
```

El **motor de balance** (`src/lib/balance.ts`) es independiente de la UI y del
almacenamiento: recibe asistentes y reglas, y devuelve el equilibrio, a quién
asignar de los "ambos" y a quién avisar de refuerzo.

## Siguientes pasos
Ver `PROGRESO.md` para el detalle de lo hecho y lo que viene.
