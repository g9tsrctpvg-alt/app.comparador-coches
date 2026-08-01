# Estado: dominio

> Este documento es la **autoridad sobre qué modela el negocio hoy**:
> conceptos, invariantes, reglas y vocabulario. Si hay duda sobre cómo se
> llama algo o qué reglas cumple, gana lo que diga este documento, no el
> nombre que aparezca en el código.

**Estado:** Pendiente — el dominio no está modelado.

## Situación actual

No hay conceptos de dominio definidos ni vocabulario acordado. El nombre del
repositorio sugiere un comparador de coches, pero **el alcance del negocio no
está especificado**: qué se compara, con qué datos, para quién y con qué
criterios son preguntas abiertas.

Este documento no las responde por su cuenta. El modelado de dominio es 🟡:
se propone y se valida, y llega por spec de producto.

## Qué lo desbloquea

La primera spec en `specs/product/`, que fije alcance y comportamiento del
negocio. Al consolidarse, este documento pasa a describir en presente:

- Glosario de conceptos, con el término único que se usa en código y en
  documentación.
- Invariantes y reglas de negocio vigentes.
- Relaciones entre conceptos y sus límites.
- Qué queda fuera del dominio y por qué.

Seguimiento en `docs/roadmap.md`.

## Regla ya vigente

El vocabulario del dominio se fija **una vez** y se usa igual en documentación
(español) y en identificadores de código (inglés). La correspondencia entre
ambos términos se registra en el glosario de este documento cuando exista: un
concepto que se llama de dos maneras es un concepto que nadie busca bien.
