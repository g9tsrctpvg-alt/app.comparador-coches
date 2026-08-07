---
name: unpublish-model
description: Saca un coche del catálogo de comparador-coches sin borrar sus datos — pone `published: false` en `src/data/cars.json` para que deje de verse en el ranking, la ficha técnica, la ficha completa y la página de explicación, conservando fuentes, fotos y notas. Úsala en cuanto el usuario pida "quitar", "despublicar", "ocultar", "sacar de la comparativa" o "dejar de comparar" un coche que ya está en el catálogo — aunque no use la palabra "despublicar" literalmente. No la uses para dar de alta un coche nuevo (`add-model`) ni para borrar datos de verdad: esta skill nunca elimina nada del JSON, solo cambia un campo.
---

# Despublicar un modelo

Reproduce, para un coche que ya está en el catálogo, el mecanismo que fija
`product/0015`: `published` pasa a `false` y el coche desaparece de la
aplicación entera sin perder ni una fuente, ni una foto, ni una nota. Es
reversible con la skill hermana `republish-model`.

## Antes de nada

Confirma qué coche exactamente —por `id` o por nombre reconocible— y **por
qué** se despublica, si el usuario no lo ha dicho ya. El motivo no es
opcional ni se inventa: va a quedar escrito en el catálogo, y una nota como
"despublicado" sin más no ayuda a nadie que lo lea dentro de seis meses.

Localiza el registro en `src/data/cars.json` por su `id`. Si el `id` no
existe, dilo y para ahí — no adivines cuál era el coche que el usuario
quería decir.

## Qué cambiar

En el registro del coche:

1. `published: false`. Si el campo no existía (el catálogo actual no lo
   necesita explícito porque el valor por defecto es `true`), añádelo.
2. Una entrada nueva en `notes` —el array ya existe en todo coche—, con la
   fecha de hoy y el motivo, en el estilo que ya usa el catálogo para otras
   notas: frase directa, sin relleno. Por ejemplo:
   `"Despublicado el 2026-08-07: descatalogado por el fabricante."`

No toques ninguna otra magnitud, fuente ni foto del coche. Despublicar no
es una excusa para "aprovechar y arreglar" otra cosa del registro — si algo
más necesita corrección, es una tarea aparte.

## Antes de comitear

La misma secuencia que exige `add-model` antes de dar nada por terminado:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run arch:check
npm run test:coverage   # exige 100% de cobertura
```

`npm run test` va a incluir el test de `App.test.tsx` que comprueba que un
coche despublicado no aparece en ninguna vista — si falla, es la señal de
que el filtro de `product/0015` no está haciendo su trabajo, no algo que
haya que silenciar.

## El commit

Un commit, en una rama propia para esta unidad de trabajo
(`docs/proceso/trazabilidad.md`), con el mensaje
`data(web): unpublish <marca> <modelo>`, en inglés, que solo toque el
registro del coche en `src/data/cars.json`. No hagas `push` ni abras PR por
tu cuenta salvo que el usuario lo pida explícitamente en esa conversación.

Al terminar, dile al usuario qué coche se ha despublicado, con qué motivo
quedó escrito, y recuérdale que sigue en el catálogo —solo oculto— y que
`republish-model` lo devuelve a la comparativa cuando haga falta.
