# ADRs: el porqué

> Este documento manda sobre **cómo se registra una decisión estructural**.
> Qué se construye lo mandan las specs; cómo es el sistema hoy, los docs de
> estado. Aquí solo vive la razón.

Cada decisión relevante —técnica, de dominio o **de proceso**— se registra
como ADR ligero: un fichero por decisión en `docs/decisions/`, nombrado
`NNNN-titulo-en-kebab-case.md`, con numeración incremental desde `0001` que
**no se reutiliza**.

## Plantilla

La plantilla está en `docs/decisions/TEMPLATE.md` y tiene esta forma:

```markdown
# NNNN — Título de la decisión

- **Estado:** draft | approved | superseded | rejected
- **Fecha:** AAAA-MM-DD
- **Nivel:** 🟢 | 🟡 | 🔴

## Contexto
## Decisión
## Alternativas consideradas
## Consecuencias
```

## Qué hace bueno a un ADR aquí

- Las **alternativas consideradas** son obligatorias y se explica *por qué se
  descartan*. Un ADR sin alternativas es un comunicado, no una decisión. La CI
  comprueba que la sección exista y no esté vacía.
- Cuando se aplaza algo, se registra el **disparador explícito** que lo
  reactivará. Ver `ci-y-guardarrailes.md`, §Calibración.
- Un ADR se **corrige por addendum fechado o por otro ADR que lo sustituya**,
  nunca reescribiendo la historia. Un ADR sustituido pasa a `superseded` y
  enlaza a quien lo sustituye.

## Relación con las specs

Una spec no puede pasar a `approved` con decisiones de calado sin registrar.
Si al redactar una spec aparece una decisión estructural, sale de la spec y
entra en un ADR, y la spec lo enlaza en su campo *ADRs relacionados*. Así la
spec describe el cambio y el ADR describe la razón, sin duplicarse.

## Nivel del ADR

El campo *Nivel* indica la autonomía con la que se tomó la decisión, según el
eje de `CLAUDE.md` §3. Sirve para auditar después si algo que debía
consultarse se decidió solo: un ADR marcado 🔴 sin rastro de validación humana
es una señal, no un detalle de formato.
