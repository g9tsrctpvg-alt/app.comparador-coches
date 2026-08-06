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
## Historial
```

## Qué hace bueno a un ADR aquí

- Las **alternativas consideradas** son obligatorias y se explica *por qué se
  descartan*. Un ADR sin alternativas es un comunicado, no una decisión. La CI
  comprueba que la sección exista y no esté vacía.
- Cuando se aplaza algo, se registra el **disparador explícito** que lo
  reactivará. Ver `ci-y-guardarrailes.md`, §Calibración.
- El **historial** es obligatorio y la CI comprueba que exista y no esté
  vacío, igual que las alternativas. Ver la sección siguiente.

## Un ADR describe lo que rige hoy

Un ADR es un **documento de estado**, no un delta. Se corrige **en su sitio**:
lo que se lee es lo que está en vigor, sin tener que reconstruirlo leyendo
acotaciones en orden cronológico. Lo decide el ADR 0005.

Cada corrección deja una entrada fechada en `## Historial`, diciendo qué
cambió y por qué. La entrada resume; el diff verbatim vive en git, que es
donde le corresponde. Sin esa entrada no se distinguiría una corrección menor
de una marcha atrás silenciosa, y el campo *Nivel* dejaría de ser auditable.

**Corregir un matiz es editar; cambiar la decisión es un ADR nuevo.** Cuando
otra decisión reemplaza a esta por entero, el ADR pasa a `superseded` y enlaza
a quien lo sustituye. Ahí no se edita: la decisión vieja se queda como estaba
y el enlace lleva a la vigente.

Esto **no** aplica a las specs. Una spec sigue siendo un delta fechado, sigue
congelándose al consolidar y una spec `consolidated` no se edita nunca. Las
dos naturalezas están descritas en `estructura-documental.md`; los ADR están
del lado del estado y las specs del lado del delta.

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
