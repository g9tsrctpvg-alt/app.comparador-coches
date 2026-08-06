# 0005 — Los ADR son documentos de estado, no deltas

- **Estado:** approved
- **Fecha:** 2026-08-06
- **Nivel:** 🟡

## Contexto

`docs/proceso/estructura-documental.md` separa dos naturalezas: un **delta**
describe un cambio fechado y se congela; un **doc de estado** describe cómo
funciona el sistema hoy y se corrige en su sitio. Las specs son deltas. Los
docs de `docs/estado/` son estado.

Los ADR quedaron del lado de los deltas: `docs/proceso/adrs.md` obliga a
corregirlos «por addendum fechado o por otro ADR que lo sustituya, nunca
reescribiendo la historia».

En la práctica eso los rompe como fuente de verdad. Tres de los cinco ADR ya
arrastran acotaciones —0001 y 0002 llevan addendum, 0003 remite a uno—, y el
0004 acaba de recibir el suyo. Un lector que quiera saber **qué rige hoy**
tiene que leer el documento entero en orden cronológico y reconstruir el
estado restando lo que cada addendum acota.

Eso choca de frente con el primer principio de `CLAUDE.md`: la documentación
se escribe «para un agente que no recuerda la sesión anterior», y «si un
documento admite dos lecturas, es un bug del documento». Un ADR con tres
addenda admite cuatro lecturas, y solo una es la correcta.

La razón por la que un ADR se congelaba —preservar por qué se decidió algo con
la información de entonces— es buena, pero no exige inmutabilidad del fichero:
exige que el cambio quede registrado.

## Decisión

**Un ADR describe la decisión en vigor hoy.** Se corrige en su sitio, como un
doc de estado. Lo que se leas es lo que rige: no hay que reconstruir nada.

Cada ADR lleva una sección **`## Historial`** al final, con una entrada
fechada por cada corrección: qué cambió y por qué. La entrada resume; el
detalle verbatim vive en el historial de git, que es donde le corresponde.

`superseded` se mantiene, y sigue significando lo que significaba: la decisión
entera queda reemplazada por otro ADR, al que se enlaza. Corregir un matiz es
editar; cambiar la decisión es un ADR nuevo.

## Alternativas consideradas

- **Seguir con el addendum obligatorio.** Es lo que hay. Descartada por el
  problema de arriba: el documento deja de decir qué rige y pasa a decir qué
  se fue decidiendo, que es justo lo que hace un delta. Si los ADR fueran
  deltas tendrían que consolidarse en algún doc de estado, y no existe tal
  doc: el ADR *es* el sitio donde vive el porqué.
- **Reescribir libremente, sin historial.** Lo más simple de leer. Descartada
  porque destruye la auditoría: sin una entrada que diga qué cambió, no se
  distingue una corrección de menor importancia de una marcha atrás
  silenciosa, y el campo *Nivel* —que existe para poder revisar después si algo
  🔴 se decidió solo— deja de ser comprobable. Git guarda el diff, pero
  obligar a bajar a git para saber si una decisión cambió es exactamente la
  fricción que este proceso evita.
- **Mover las decisiones a los docs de estado y eliminar los ADR.** Tentador
  porque deja una sola clase de documento. Descartada porque un doc de estado
  dice **cómo funciona** el sistema, no **por qué se eligió así**; las
  alternativas descartadas no caben en él sin convertirlo en otra cosa. Sin un
  sitio para el porqué, las decisiones se vuelven a discutir cada seis meses.
- **Congelar solo las secciones *Contexto* y *Alternativas*, y dejar editables
  *Decisión* y *Consecuencias*.** Preserva el razonamiento de origen donde de
  verdad importa. Descartada por frágil: la frontera es difícil de recordar y
  de validar mecánicamente, y un contexto que envejece mal es tan engañoso
  como una decisión que envejece mal.

## Consecuencias

- **Un ADR leído hoy es cierto hoy**, sin reconstrucción. Es el objetivo.
- **Se pierde el texto original verbatim dentro del fichero.** Queda en git y
  resumido en `Historial`. Coste asumido y consciente: se cambia fidelidad
  literal por legibilidad, que es la moneda de este repositorio.
- **`docs/proceso/adrs.md` cambia su regla de corrección**, y la plantilla
  `docs/decisions/TEMPLATE.md` gana la sección `Historial`.
- **El validador pasa a exigir `Historial`** en todo ADR, como ya exige
  *Contexto*, *Decisión*, *Alternativas consideradas* y *Consecuencias*. Es
  una sección más en `ADR_SECTIONS`.
- **Los cuatro addenda vigentes se convierten**: 0001, 0002 y 0004 llevan
  addendum propio y 0003 remite al de 0001. Su contenido se pliega en la
  sección que corrija y deja una entrada de `Historial`. Es trabajo mecánico y
  acotado, pero hay que hacerlo entero: dos convenciones conviviendo serían
  peor que cualquiera de las dos.
- **No cambia nada para las specs.** Siguen siendo deltas, siguen
  congelándose al consolidar, y la regla de que una spec `consolidated` no se
  edita se mantiene intacta. Esta decisión distingue las dos naturalezas; no
  las acerca.

## Historial

- **2026-08-06** — ADR creado. Estrena el formato que él mismo decide, para
  que no haya que convertirlo después.
