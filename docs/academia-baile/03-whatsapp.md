# 03 — Integración con WhatsApp

El alumno (y/o la academia) interactúa por WhatsApp: el alumno mete parámetros
(rol, nivel, sexo…) y recibe avisos de refuerzo. Hay **tres vías**, con compromisos muy
distintos. Este documento las compara y aterriza la pregunta clave:
**"¿la academia solo mete su número y el programa hace el resto?"**

## 3.1 Cómo el alumno "mete parámetros" sin frustrarse
No se le pide texto libre ("escribe tu nivel"). Se usan componentes interactivos:

- **Botones y listas**: el bot manda preguntas con botones tocables.
  > 🤖 ¿Cómo bailas? [ Leader ] [ Follower ] [ Ambos ]
  El alumno **toca**, no escribe; cada toque se guarda en Supabase.
- **WhatsApp Flows** ⭐ (solo API oficial): un **formulario dentro del chat** donde rellena
  **todos los campos de una** (nivel, rol, sexo, nombre) y envía. Ideal para varios
  parámetros a la vez.

> Matiz para nuestro caso: meter varios parámetros por chat paso a paso es incómodo de
> mantener (muchos if/else de conversación). Suele salir mejor con **formulario web** y
> dejar WhatsApp para lo que de verdad brilla: **los avisos de refuerzo**.

## 3.2 Las tres vías

### Vía A — API oficial de Meta (WhatsApp Cloud API)
La plataforma oficial. Tu servidor recibe y responde mensajes solo (webhook). Es lo
correcto para un producto que **cobras**.
- ✅ Estable, escalable, diseñada para multi-academia.
- ✅ WhatsApp Flows, botones, listas.
- ⚠️ De pago por conversación (hay tramo gratis al mes).
- ⚠️ Avisos que **inicia la academia** requieren **plantillas pre-aprobadas**.
- ⚠️ Ventana de 24 h para responder gratis tras un mensaje del alumno; fuera, plantilla.
- ⚠️ Necesita cuenta de **Meta Business verificada**.

### Vía B — No oficial / n8n (Evolution API, WAHA, Baileys, whatsapp-web.js)
Simula un **WhatsApp Web**: se escanea un **QR** una vez y el programa pilota la cuenta
normal. Muy usado en tutoriales de n8n.
- ✅ Gratis, sin aprobaciones de Meta.
- ✅ Puede **iniciar conversaciones** libremente (avisos) sin plantillas.
- ✅ Montaje rápido para **prototipar y validar**.
- ⚠️ **Va contra las condiciones de uso de WhatsApp.**
- ⚠️ **Riesgo de baneo** del número (Meta detecta patrones de bot).
- ⚠️ **Frágil**: se rompe cuando WhatsApp Web cambia; la sesión hay que mantenerla viva.
- ⚠️ **No escala** bien: 1 sesión/QR por academia = 50 academias, 50 sesiones que vigilar.

### Vía C — Web + WhatsApp solo para avisos (híbrido)
El registro con muchos parámetros se hace en una **web bonita** (que ya sabes montar) y
WhatsApp se usa **solo para los avisos** ("falta gente, ¿vienes?").
- ✅ Más barato, más flexible, mucho menos trabajo.
- ✅ Mejor experiencia para meter parámetros (formulario web > chat paso a paso).
- ✅ WhatsApp brilla donde aporta de verdad: el aviso de refuerzo.

## 3.3 "¿La academia solo mete su número y el programa hace el resto?"

**Teclear solo el número y ya → ❌ no existe en ninguna vía.** WhatsApp exige que el dueño
**demuestre que el número es suyo** (login en Meta o escanear QR). Es por seguridad: si no,
cualquiera secuestraría números ajenos.

**Un par de clics / un escaneo y el resto automático → ✅ sí es posible**, y así funcionan
los SaaS serios. Lo demás (webhooks, recibir mensajes, guardar alumnos, mandar avisos) **lo
hace el programa solo**.

| | Lo que hace la academia | Lo que automatiza el programa | Mantenimiento |
|---|---|---|---|
| **Meta oficial** | Pulsa "Conectar" + login Meta (**Embedded Signup**) | Credenciales, webhooks, todo | Bajo (estable) |
| **Evolution/n8n** | Escanea un **QR** | Crea instancia, webhooks, todo | Alto (sesiones frágiles) |

### Embedded Signup de Meta ⭐
Un botón "Conectar mi WhatsApp" en tu app abre una ventana de Meta donde la academia hace
login, elige su número y autoriza tu app; al terminar, **tu programa recibe las credenciales
automáticamente**. Es lo más cercano al ideal de "solo conectar": son **clics, no técnico**.
Tú verificas tu app de Meta **una sola vez**, no por academia.

## 3.4 Comparativa de decisión

| | Meta oficial | Evolution/n8n | Web + avisos |
|---|---|---|---|
| Coste | De pago/conversación | Gratis | Bajo |
| Aprobación Meta | Sí (verificación) | No | Solo si usa WhatsApp oficial |
| Iniciar avisos | Plantillas + pago | Libre | Según canal de aviso |
| Riesgo de baneo | Ninguno | **Alto** | Ninguno/según canal |
| Estabilidad | Sólida | Frágil | Sólida |
| Escalar a 50 academias | Diseñado para eso | Difícil | Fácil |
| Bueno para… | **Producto que cobras** | **Prototipar/validar** | **Empezar barato** |

## 3.5 Recomendación
Dos fases, no un "o lo uno o lo otro":

- **Validación (ahora):** **n8n + Evolution API** con tu número o el de una academia amiga.
  Gratis, rápido, comprueba si el flujo gusta. Encaja con la fase de estudio.
- **Negocio (cuando cobras):** migra a **Meta oficial** con **Embedded Signup**. Cuando una
  academia paga, no puedes permitirte que Meta le banee el número.

Y para "meter parámetros" (rol, nivel, sexo): **formulario web** > chat paso a paso.
Reserva WhatsApp para **los avisos de refuerzo**, que es el gancho.
