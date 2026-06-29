# 04 — Comercialización

Cómo se vende y cómo logras que cada academia lo monte sola. Son dos cosas distintas:
**autoservicio** (que se implementen solas) y **go-to-market** (cómo llegas a ellas).

## 4.1 Autoservicio (resumen)
Ver detalle en [02 — Onboarding](02-onboarding-autoservicio.md). La academia no instala
software: rellena un wizard, personaliza desde un panel y recibe su enlace/QR.

| Lo que crees que necesitas | Lo que de verdad necesitas |
|---|---|
| Instalar la app en cada academia | **Una sola app multi-academia en la nube** |
| Un técnico por cliente | **Un asistente de alta autoservicio** |
| Personalizar con código | **Un panel donde suben fotos/logo/precios** |
| Vender "software" | **Vender que se les cuadran las clases solas** |

## 4.2 El argumento de venta
No vendas "una app". Vendes **resolver un dolor concreto**:
- *"¿Cuántas clases se te desequilibran porque vienen 12 chicos y 4 chicas? La app te
  avisa antes y llama a refuerzos automáticamente."*
- *"Tus alumnos ven horarios, precios y eventos sin escribirte por WhatsApp 50 veces al día."*

El **balance leader/follower** es el gancho diferencial: ninguna app de gestión genérica
lo tiene.

## 4.3 Modelo de precios (recurrente = negocio sano)
- **Gratis** hasta X alumnos / 1 academia → prueban sin miedo.
- **De pago** (suscripción mensual) al crecer: más alumnos, multi-sede, pagos integrados,
  branding propio.
- Ingreso **recurrente**; la academia paga poco al mes. Stripe ya está en el repo.

## 4.4 Canales para llegar a las academias
1. **Demo en vivo**: monta 2-3 academias de ejemplo y enséñaselas. Ver vende.
2. **Boca a boca del sector**: las academias se conocen; hay festivales y congresos de
   salsa/bachata.
3. **Instagram / TikTok**: el mundo del baile vive ahí. Un vídeo "mira cómo cuadra la clase
   sola" se mueve solo.
4. **Embajadores**: primeras academias gratis a cambio de recomendación.

## 4.5 Por qué el repo ya está bien posicionado
Stack actual (Supabase + Next.js + Stripe + `join/[token]`) ya aporta los cimientos:
multi-tenant con aislamiento por academia, alta por enlace y cobros. Falta el **wizard de
alta**, el **panel de personalización** y la **integración de WhatsApp**.
