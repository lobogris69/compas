# 06 — Perfiles de alumno y comunidad

## 6.1 El problema que resuelve
En clase de baile en pareja la gente **rota constantemente** pero **no se conoce**: bailas
con alguien y no sabes su nombre, su nivel ni si lleva mucho. Hay mucho desconocimiento de
quién es quién en clase. Un **perfil opcional con foto** lo resuelve y, además, **refuerza
el motor de balance**: cuando invitas a alguien de refuerzo, ver una cara y un nombre
reduce la fricción de aceptar y de presentarse.

## 6.2 Principio rector: privacidad primero (opt-in)
- El perfil es **opcional y voluntario**: el alumno decide si lo rellena y qué muestra.
- **Nada se publica por defecto.** El alumno activa lo que quiere enseñar.
- **No es una app de citas**: es comunidad de academia. El tono y las funciones evitan
  derivar en "ligue"; el foco es conocerse para bailar mejor.
- **RGPD**: consentimiento explícito para foto y datos, derecho a ocultar/borrar, y
  consideración especial con **menores** (perfiles limitados o desactivados según política
  de la academia).

## 6.3 Qué contiene un perfil

| Campo | Tipo | Notas |
|-------|------|-------|
| Foto | opcional | Avatar; el alumno puede subirla o no |
| Nombre / apodo | recomendado | Puede mostrar solo nombre o apodo |
| Rol | leader / follower / ambos | Ya existe en el modelo; útil verlo en el perfil |
| Nivel | principiante / medio / avanzado | Ayuda a saber con quién bailas |
| Estilos | multi | Salsa, bachata, tango… |
| "Bailando desde" | opcional | Antigüedad / experiencia |
| Bio corta | opcional | Un par de líneas para presentarse |
| Contacto social | opcional | Instagram u otro, **solo si el alumno quiere** |

## 6.4 Control de visibilidad (por alumno)
El alumno elige **quién ve su perfil**:
- **Solo yo** (perfil privado, no aparece en el directorio).
- **Mis compañeros de clase** (solo quienes coinciden en sus clases).
- **Toda la academia** (aparece en el directorio del tenant).

> Importante: la visibilidad **nunca cruza academias**. Un perfil solo existe dentro de su
> `academia_id` (mismo aislamiento multi-tenant que el resto de datos).

## 6.5 Cómo se usa (interacción)
- **Directorio de la academia**: lista/galería de alumnos que han hecho público su perfil,
  filtrable por rol, nivel y estilo.
- **"¿Quién hay en esta clase?"**: desde la clase del día, ver las caras/nombres de quienes
  asisten (respetando la visibilidad de cada uno). Resuelve directamente el desconocimiento.
- **Ficha al reforzar**: cuando el motor invita a alguien de refuerzo, el invitado ve quién
  organiza/qué clase es; y la academia ve un mini-perfil del candidato.
- **Saludo ligero**: opcional, "encantado de bailar contigo" o marcar compañeros conocidos.
  Sin mensajería pesada en la primera versión (evita moderación compleja).

## 6.6 Cómo refuerza el resto del producto
- **Balance/refuerzos**: poner cara al rol leader/follower hace que la gente acepte antes
  venir de refuerzo y que la clase sea más acogedora → menos abandono.
- **Retención**: sentirse parte de una comunidad (no un desconocido) es de los mayores
  motores de permanencia en academias de baile.
- **Branding de la academia**: una comunidad viva con perfiles hace que la app se sienta
  "suya" y diferencia frente a apps de gestión frías.

## 6.7 Riesgos y cómo se mitigan
| Riesgo | Mitigación |
|--------|-----------|
| Privacidad / fotos no deseadas | Opt-in estricto, visibilidad granular, borrado fácil |
| Uso como app de citas | Sin DMs en v1, foco en comunidad, reglas de la academia |
| Menores | Perfiles limitados/desactivados según política de la academia |
| Contenido inapropiado | La academia (admin) puede ocultar/moderar perfiles de su tenant |

## 6.8 Encaje en el roadmap
- **No es de la fase 0-1.** Primero, lo que da valor inmediato (info, asistencia, balance).
- Encaja bien en la **Fase 4** (incentivos + retención + branding), como capa de
  **comunidad** que aumenta la permanencia una vez el núcleo funciona.
- Versión mínima: perfil opcional (foto, rol, nivel, estilos) + "¿quién hay en esta clase?"
  + directorio con visibilidad granular. Mensajería y funciones sociales avanzadas, más
  adelante.
