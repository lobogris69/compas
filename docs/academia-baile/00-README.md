# Academia de Baile — App SaaS multi-academia (estudio)

> Documento maestro. Estado: **estudio / ideación**. No se ha escrito código todavía.
> Última actualización: 2026-06-23.

App SaaS **universal y multi-academia**: una sola plataforma en la nube que cualquier
academia de baile da de alta ella sola, personaliza con su marca y usa para gestionar
alumnos, clases y —el diferenciador— **el equilibrio leader/follower** de cada clase,
con avisos y refuerzos por WhatsApp.

> _"La academia se registra, sube su logo, configura sus clases y en 10 minutos tiene
> su propia app. Cuando una clase se desequilibra (12 leaders, 4 followers), el sistema
> lo detecta y llama a refuerzos solo."_

## Índice de entregables

| Doc | Contenido |
|-----|-----------|
| [01 — Producto y multi-academia](01-producto-y-multiacademia.md) | Visión, roles leader/follower/ambos, motor de balance, modelo multi-tenant |
| [02 — Onboarding autoservicio](02-onboarding-autoservicio.md) | Cómo la academia se da de alta y personaliza sola (wizard) |
| [03 — Integración con WhatsApp](03-whatsapp.md) | Las 3 vías (Meta oficial, no oficial/n8n, web+avisos), "¿solo meter el número?" |
| [04 — Comercialización](04-comercializacion.md) | Modelo de negocio, precios, canales, guion de venta |
| [05 — Roadmap por fases](05-roadmap.md) | Orden recomendado de construcción |
| [06 — Perfiles y comunidad](06-perfiles-y-comunidad.md) | Perfiles opcionales con foto, "¿quién hay en clase?", privacidad |

## Resumen ejecutivo del diferenciador

Las apps de gestión de academias resuelven **horarios y cobros**. Ninguna resuelve el
dolor real de una academia de baile en pareja: **que las clases queden descompensadas**
de leaders y followers. Nuestro gancho:

1. **Roles leader / follower / ambos** — los "ambos" son el comodín que cuadra la clase.
2. **Semáforo de balance en vivo** — la academia ve en tiempo real cómo va cada clase.
3. **Motor de refuerzos automático** — detecta déficit e invita a quien puede equilibrar.
4. **Avisos por WhatsApp** — "falta gente de follower el jueves, ¿te vienes?".
5. **Autoservicio multi-academia** — cada academia se lo monta sola, con su marca.
6. **Comunidad con perfiles** — perfiles opcionales con foto para que los alumnos sepan
   con quién bailan; resuelve el desconocimiento en clase y mejora la retención.

## Cimientos que ya existen en el repo

El stack actual (Next.js + Supabase + Stripe + ruta `join/[token]`) ya da:
- **Multi-tenant** con aislamiento por `academia_id` (RLS de Supabase).
- **Alta por enlace/QR** (patrón `join/[token]` reutilizable).
- **Cobros** (Stripe) para el modelo de suscripción.

No falta tecnología de base; faltan el **wizard de alta**, el **panel de personalización**
y la **integración con WhatsApp**.

## Decisiones abiertas (pendientes del dueño)

- **Canal del alumno**: ¿todo por WhatsApp, o web para registro + WhatsApp solo para avisos?
- **Vía de WhatsApp**: Meta oficial (estable, de pago) vs no oficial/n8n (gratis, frágil).
- **Modelo de precios**: freemium con límite de alumnos vs suscripción plana por academia.

Ver el detalle y la recomendación de cada una en los documentos correspondientes.
