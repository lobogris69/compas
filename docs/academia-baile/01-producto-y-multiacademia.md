# 01 — Producto y modelo multi-academia

## 1.1 Visión y norte de experiencia
- **Visión**: la plataforma de referencia para academias de baile en pareja, centrada en
  **mantener las clases equilibradas** (leader/follower) sin trabajo manual.
- **Norte de la academia**: *registrarse → personalizar → configurar clases → funcionar*,
  en 10 minutos y sin tocar código.
- **Norte del alumno**: *apuntarse → decir si vengo → (a veces) venir de refuerzo*, en
  segundos y desde el móvil.
- **Regla de oro**: si una función potente parece complicada, se rediseña hasta parecer
  simple. La academia no es técnica.

## 1.2 Modelo de roles
Cada alumno tiene un rol de baile:

| Rol | Descripción |
|-----|-------------|
| **Leader** | Lleva / guía. |
| **Follower** | Sigue. |
| **Ambos** | Baila los dos roles. **Es el comodín de oro**. |

- Los alumnos **"ambos"** se asignan automáticamente al rol que esté en **minoría** en
  cada clase, para cuadrarla sin pedir refuerzos externos.
- Un "ambos" puede fijar **preferencia del día** ("hoy quiero bailar de follower"); el
  motor la respeta si no rompe el balance.
- Otros parámetros del alumno: **nivel** (principiante / medio / avanzado), **sexo**
  (opcional, informativo), estilos que practica, y datos de contacto.

## 1.3 Los 3 pilares de producto

1. **Información al alumno** — horarios, tarifas, eventos, cursos. Rápido de construir,
   da valor visible ya, baja la fricción de adopción.
2. **Asistencia + semáforo de balance** — el alumno confirma asistencia (RSVP) y la
   academia ve en vivo el ratio leader/follower de cada clase.
3. **Motor de refuerzos** — detecta déficit, invita a quien puede equilibrar, controla
   cupos e incentivos. **El diferenciador real.**

## 1.4 Motor de balance (parametrizable por academia)
Todo configurable desde el panel, **sin tocar código**, con valores por defecto sensatos:

| Parámetro | Por defecto | Qué controla |
|-----------|-------------|--------------|
| Ratio objetivo | 50/50 | Equilibrio deseado leader/follower |
| Tolerancia | ±2 | Cuánto desbalance se admite antes de actuar |
| Antelación de aviso | 3 h | Cuándo se lanza la petición de refuerzo |
| Niveles compatibles | configurable | Qué niveles pueden mezclarse al reforzar |
| Cupo de refuerzos | configurable | Máximo de invitados externos por clase |
| Incentivos | opcional | Karma / descuento por venir de refuerzo |

Funciona igual para una academia de 30 alumnos que para una de 800.

## 1.5 Modelo multi-academia (multi-tenant)
- **Una sola app en la nube** da servicio a todas las academias.
- **Cada academia = un tenant** aislado por `academia_id` (RLS de Supabase). Una academia
  nunca ve datos de otra.
- El alumno entra a **su** academia por **código/QR/enlace** (patrón `join/[token]`), sin
  saber que comparte plataforma.
- **Branding por academia**: logo, color, nombre, textos. Parece "su" app.
- **Plantillas por tipo** (salsa/bachata, tango, swing, kizomba…) para que el 90% de la
  config venga ya rellena.

## 1.6 Flujos clave que deben ser perfectos

**A. La academia se da de alta (< 10 min)** — ver [02 — Onboarding](02-onboarding-autoservicio.md).

**B. El alumno se apunta (< 1 min)**
1. Escanea el QR / abre el enlace de su academia.
2. Indica rol (leader/follower/ambos), nivel y datos mínimos.
3. Queda registrado en el tenant correcto.

**C. El alumno confirma asistencia (segundos)**
1. Recibe/abre la clase del día → "¿Vienes?" → Sí / No.
2. El semáforo de balance de la academia se actualiza al instante.

**D. Refuerzo automático**
1. El motor detecta déficit (p. ej. faltan 4 followers, tolerancia superada).
2. Invita a alumnos "ambos" o followers de nivel compatible que no vienen ese día.
3. Quien acepta cuadra la clase; opcionalmente gana incentivo.

## 1.7 Fuera de alcance (de momento)
- Reproducción de música / coreografías, red social pública, facturación fiscal completa,
  reserva de salas de terceros.
