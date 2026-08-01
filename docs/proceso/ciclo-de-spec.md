# Ciclo de vida de la spec

> Este documento manda sobre **cómo nace, se aprueba, se implementa y se
> verifica una spec**. La consolidación —el paso final— tiene su propio
> documento: `consolidacion.md`.

## 1. Dónde viven y cómo se nombran

**Dos niveles, no tres**: `specs/product/` (qué hace el negocio) y
`specs/technical/` (cómo se implementa). No existe un tercer nivel de «detalle
de implementación» pensado para que un modelo barato lo transcriba sin
criterio propio — ver `enrutado-de-modelos.md`, es una falsa economía. Una
spec `approved` es la **unidad de trabajo completa**, tanto para el gate
humano como para el enrutado de modelo.

- Nombrado: `NNNN-titulo-en-kebab-case.md`.
- Numeración incremental **dentro de cada carpeta**, desde `0001`. El `NNNN`
  **no se reutiliza** nunca, ni siquiera si la spec se abandona.
- La relación producto ↔ técnica es **N:M**, no 1:1. El mismo `NNNN` en las
  dos carpetas **no implica correspondencia**: son secuencias independientes.
  La relación real se declara en el campo *Specs relacionadas*.
- Toda spec parte de `specs/TEMPLATE.md` y declara su **Doc de estado**: dónde
  se consolidará su efecto.

## 2. Estados y transiciones

| Estado | Significado | La transición la hace |
| --- | --- | --- |
| `draft` | En redacción, abierta a cambios | IA o humano 🟢 |
| `approved` | Validada y lista para implementar | **Humano** 🔴 |
| `implemented` | Existe código derivado de la spec | IA 🟢 |
| `verified` | La implementación cumple los criterios de aceptación | IA 🟢 |
| `consolidated` | Su efecto está plegado en el doc de estado; la spec queda congelada como registro | IA 🟢 |
| `superseded` | Sustituida por otra spec (enlazar cuál) | Humano 🔴 |

`consolidated` es el estado **terminal del camino feliz**. Una spec no está
cerrada hasta que el comportamiento que introdujo se puede leer en los docs de
estado **sin abrir la spec**.

## 3. El gate humano

`draft → approved` es el **único punto donde el proceso se detiene a esperar a
una persona**, y es innegociable:

- La IA **nunca** aprueba una spec ni implementa sin aprobación previa.
- **Mecánica:** el campo `Estado:` pasa a `approved` en un commit del humano
  —o de la IA **solo tras confirmación explícita**— y **nunca en el mismo
  cambio que introduce la implementación**. Un diff que aprueba e implementa a
  la vez ha convertido el gate en un trámite.

**Criterios para pasar a `approved`:**

- [ ] Objetivo y alcance claros, con *fuera de alcance* **explícito**.
- [ ] Criterios de aceptación concretos y **verificables de forma objetiva**.
- [ ] Sin *decisiones abiertas* pendientes (o movidas a un ADR / a otra spec).
- [ ] Las decisiones de calado registradas como ADR.

Una spec sin criterios de aceptación **no puede** pasar a `approved`: son el
ancla de la fase de verificación, y sin ellos `verified` no significa nada.
La CI comprueba mecánicamente estas dos últimas condiciones — ver
`ci-y-guardarrailes.md` —, pero el juicio sobre si el alcance es claro es
humano y no se automatiza.

## 4. Implementación

Al existir código derivado de la spec, esta pasa a `implemented` y se estampa
el **aviso A** descrito en `consolidacion.md`. A partir de ese momento la
sección *Contexto* de la spec es falsa, y el aviso lo dice explícitamente.

## 5. Verificación

Para pasar a `verified` se comprueba **cada** criterio de aceptación —por
test, ejecución o revisión, según el criterio—. Si alguno falla, la spec
**vuelve** a `implemented`; si el problema es la propia spec, vuelve a
`draft`. No existe «verificado con salvedades»: o se cumplen los criterios o
no se cumplen.

## 6. Plantilla

La plantilla única está en `specs/TEMPLATE.md`. No se redacta una spec desde
cero ni se recorta la plantilla: los campos de cabecera son los que hacen la
spec navegable para un agente sin memoria, y la CI los valida.
