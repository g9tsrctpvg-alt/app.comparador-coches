# Estructura documental

> Este documento manda sobre **qué artefacto responde a qué pregunta y dónde
> vive**. Si hay duda sobre dónde escribir algo, gana lo que diga aquí.

## Los cuatro artefactos y su autoridad

| Artefacto | Responde a | Es fuente de verdad de |
| --- | --- | --- |
| **Spec** | *qué* se construye y *qué cambió* | el **cambio** |
| **ADR** | *por qué* de una decisión estructural | la **razón** |
| **Doc de estado** | *cómo es el sistema **hoy*** | el **estado** |
| **Código** | *cómo*, derivado de una spec aprobada | nada por sí solo |

No hay contradicción entre las dos primeras «fuentes de verdad»: la spec manda
sobre *qué se va a construir*, el doc de estado sobre *qué hay construido*. Se
consultan en momentos distintos — la spec al abrir un cambio, el doc al
necesitar contexto de lo que ya existe.

## Árbol del repositorio

```text
CLAUDE.md                 # índice operativo: principios, autonomía, mapa
docs/proceso/             # el contrato de trabajo, partido en satélites
docs/estado/              # cómo funciona el sistema hoy
docs/decisions/           # ADRs: el porqué de cada decisión estructural
docs/roadmap.md           # fases, tareas y deudas abiertas
specs/product/            # qué hace el negocio (dominio, comportamiento)
specs/technical/          # cómo se implementa (contratos, integraciones)
specs/TEMPLATE.md         # plantilla única de spec
```

`docs/` se separa en dos subcarpetas con reglas distintas y no
intercambiables:

- **`docs/proceso/`** son satélites del índice: describen **cómo se trabaja**.
  Se editan cuando cambia el proceso, y ese cambio se registra como ADR.
- **`docs/estado/`** son docs de estado: describen **qué hay construido**. Solo
  se editan al consolidar una spec, y son el destino declarado en el campo
  *Doc de estado* de cada spec.

Mezclarlos en una carpeta plana obligaría a recordar cuáles se rigen por las
reglas de consolidación y cuáles no. El motivo de la separación está en
`docs/decisions/0002-adopcion-del-modelo-de-trabajo.md`.

## Regla de ligereza del índice

`CLAUDE.md` es un índice, no un manual: principios, niveles de autonomía y
mapa de navegación. Si una sección supera ~15 líneas, se mueve a un satélite y
en el índice queda solo el enlace. Un índice que crece se convierte en
documentación que nadie relee entera.

El mapa de navegación usa etiquetas neutras — `Pendiente` · `Base` ·
`Definido` · `Activo` —. Los símbolos 🟢/🟡/🔴 se reservan **solo** para
niveles de autonomía: reutilizar la misma simbología para dos ejes distintos
es la clase de ambigüedad que este modelo persigue.

## Cada doc de estado empieza diciendo qué manda

El doc de estado de un área es la autoridad de esa área: si hay duda entre dos
formas de hacer algo, gana lo que diga el doc, no la preferencia del agente ni
el precedente más cercano en el código.

## Docs por app en monorepo

Si el repositorio llega a alojar varias aplicaciones, cada una lleva su propio
`CLAUDE.md` con las convenciones de su stack, y `specs/` y `docs/` siguen
siendo **comunes a la raíz** — muchas specs son de contrato y afectan a varias
apps a la vez.

Esta decisión está abierta: depende del stack. Ver `docs/roadmap.md`.

## Por qué «delta vs estado» no es un tecnicismo

La sección *Contexto* de una spec retrata el sistema **anterior** al cambio.
En cuanto la spec se implementa, esa sección **no queda obsoleta: queda
falsa**, y sigue leyéndose como si fuera actual. Un agente que reconstruye el
estado del sistema leyendo N specs en orden cronológico trabaja sobre una foto
que nunca existió.

De ahí que exista la consolidación (`consolidacion.md`) y la regla de lectura
que prohíbe usar specs cerradas como contexto.
