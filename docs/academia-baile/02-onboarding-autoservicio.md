# 02 — Onboarding autoservicio (la academia se lo monta sola)

La clave del SaaS universal: **la academia nunca toca código ni servidores**. Tú tienes
**una sola app en la nube** y cada academia se crea su cuenta mediante un asistente.

> No es "instalar software". Es "rellenar un formulario bonito". Esa es la diferencia que
> lo hace vendible a gente no técnica.

## 2.1 Wizard de alta (en pasos sencillos)

| Paso | Qué pide | Detalle |
|------|----------|---------|
| 1 | **Identidad** | Nombre, logo (sube su foto), color de marca |
| 2 | **Estilos** | Salsa, bachata, tango… (elige de una lista) |
| 3 | **Clases** | Nombre, nivel, día/hora, sala, aforo, ratio objetivo (50/50 por defecto) |
| 4 | **Reglas de balance** | Tolerancia ±2, aviso 3 h antes, niveles compatibles (valores por defecto) |
| 5 | **Alumnos** | Subir Excel/CSV, pegar contactos, o que se autoregistren por QR |

Al terminar, la academia **ya tiene su app funcionando, con su marca**.

### Plantillas por tipo de academia
Para que el 90% de la config venga rellena: plantillas de **salsa/bachata, tango, swing,
kizomba…**. La academia solo retoca lo suyo.

## 2.2 Personalización sin programar (panel de administración)
Todo se edita desde el panel, asociado a **su** `academia_id`:
- Logo, colores, nombre, textos.
- Precios / tarifas.
- Horarios y clases.
- Eventos y cursos.
- Reglas del motor de balance.

Nada de "te mando un técnico".

## 2.3 Su propio enlace / QR
Cada academia recibe un enlace tipo `tuapp.com/salsa-madrid` o un **QR**. Lo ponen en
Instagram o en recepción y sus alumnos entran directos a **su** espacio (pre-rellena el
`academia_id`).

## 2.4 Qué automatiza el programa vs qué hace la academia

| Lo hace la academia (una vez) | Lo automatiza el programa |
|-------------------------------|---------------------------|
| Rellenar el wizard (marca, clases, reglas) | Crear el tenant aislado y aplicar RLS |
| Subir logo/fotos y lista de alumnos | Generar enlace/QR de la academia |
| (WhatsApp) un único gesto de conexión — ver [03](03-whatsapp.md) | Webhooks, recepción de mensajes, guardado de alumnos, avisos |

> El único punto que **siempre** requiere un gesto del dueño es **conectar WhatsApp**
> (login en Meta o escanear un QR), por seguridad. Todo lo demás es automático.
