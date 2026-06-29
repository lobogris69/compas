# 05 — Roadmap por fases

> **Roadmap de construcción vigente (jun 2026).** La app ya está en modo real
> (Supabase: auth, CRUD, RLS, Storage de logos y vídeos). Roles definidos como
> capas acumulativas: 🛡️ Plataforma ⊃ 🏫 Dueño ⊃ 🧑‍🏫 Profesor ⊃ 🧑‍🎓 Alumno
> (el dueño suele ser también profesor; puede ser dueño-profesor único).
>
> | Fase | Qué | Estado |
> |---|---|---|
> | **1** | **Matrícula** alumno↔clases (multi-clase; editable por alumno y por profe/dueño). | ✅ hecho |
> | **2** | **Resumen súper-visual** por clase: matriculados · confirmados · leaders · followers · equilibrio + refuerzos. | ✅ hecho |
> | **3** | **Acceso de profesores**: el dueño invita por email; vista reducida (subir vídeos + ver estado). | ✅ hecho |
> | **4** | **`/admin` de plataforma** (email del fundador): todas las academias y sus números. | ✅ hecho (solo lectura; suspender/borrar pendiente) |
> | **5** | **Pagos**: planes configurables (mensual/trimestral/semestral/anual/bono) + control al día/pendiente + recordatorios WhatsApp manuales. | ✅ hecho (envío automático programado: pendiente, necesita API WhatsApp) |
>
> El motor de balance/refuerzos (déficit, nivel compatible, aviso WhatsApp, "Apuntar")
> ya está implementado en `src/lib/balance.ts` y la pantalla de clase.

---

## Roadmap estratégico original

Orden recomendado de construcción. Todo en **estudio**; nada comprometido aún.

| Fase | Qué entrega | Por qué en este orden |
|------|-------------|------------------------|
| **0. Cimientos multi-tenant** | Academias, alumnos, roles, RLS por tenant | Sin esto nada es "universal" |
| **1. Info al alumno** | Horarios, tarifas, eventos, cursos | Rápido, valor visible ya, baja fricción de adopción |
| **2. Asistencia + semáforo de balance** | RSVP + panel leader/follower en vivo | El dolor central |
| **3. Motor de refuerzos** | Detección de déficit + invitación + cupo | El diferenciador real |
| **4. Incentivos + pagos + branding** | Karma, Stripe, logos | Monetización y retención |

## Recomendación de arranque
- **Fase 0 + 1 juntas** como primer entregable real: da una app instalable y demostrable a
  academias rápido.
- **Fases 2–3** son el "wow" que cierra ventas (balance + refuerzos).

## Pista sobre WhatsApp en el roadmap
- En **validación** (alrededor de Fase 2–3): **n8n + Evolution API** para probar avisos de
  refuerzo barato. Ver [03 — WhatsApp](03-whatsapp.md).
- En **negocio** (Fase 4): migrar a **Meta oficial** con Embedded Signup por estabilidad.
- Meter parámetros del alumno: **formulario web**; WhatsApp para **avisos**.

## Decisiones a cerrar antes de construir
1. **Canal del alumno**: ¿todo WhatsApp o web + avisos WhatsApp?
2. **Vía de WhatsApp**: Meta oficial vs no oficial/n8n (por fase).
3. **Precios**: freemium con límite de alumnos vs suscripción plana.

Cuando estas tres estén cerradas, se define el **MVP** (alcance + backlog priorizado) y se
empieza desarrollo.
