# 0014 — El estado terminal de una spec que no se va a verificar

- **Id:** technical/0014
- **Estado:** draft
- **Tipo:** technical
- **Fecha:** 2026-09-04
- **Specs relacionadas:** technical/0003, technical/0006, product/0014
- **ADRs relacionados:** 0013
- **Doc de estado:** `docs/proceso/ciclo-de-spec.md`,
  `docs/proceso/consolidacion.md`, `docs/estado/interfaz.md`

## Contexto

El ciclo de vida vigente tiene seis estados —`draft`, `approved`,
`implemented`, `verified`, `consolidated`, `superseded`— y una regla que no
admite término medio: «no existe *verificado con salvedades*» (§5). Una spec
implementada a la que le queda un criterio incumplido no tiene, hoy, ninguna
transición legítima: se queda en `implemented` indefinidamente, con su aviso
A diciendo que no es referencia de nada, y bloqueando el cierre de su fase.

`technical/0006` es ese caso, y es el único que queda. De sus tres criterios
abiertos, dos se cierran sin tocar código —revisado el 2026-09-04—:

- El de composición del primitivo está escrito como **disyunción**: «…**o**,
  si el contenedor necesita algo que ningún primitivo actual cubre, la
  diferencia queda documentada aquí, no en el código sin más». La spec
  documenta esa diferencia por extenso, con el hallazgo de `technical/0005`
  detrás —la composición entre ficheros de CSS Modules resuelve los
  conflictos a favor del primitivo, así que el fondo persistente de la
  pastilla activa perdería siempre—. Su segunda rama se cumple; dejarlo sin
  marcar fue un error de contabilidad.
- El del despliegue esperaba un `push` a `main` que desde entonces ha
  ocurrido decenas de veces. Comprobado contra el sitio público: sirve
  `index-DEvpBliU.js` e `index-gCKKUTLA.css`, los mismos hashes que produce
  `npm run build`, ambos con `200`.

Queda **uno realmente incumplido**: la cabecera necesita `overflow-x: auto`
a 320px, porque la marca y el `<select>` suman 407px sobre los 320
disponibles, y justo en el borde de 592px le faltan 31px.

Hay además un cabo suelto que impide cerrarla tal cual: **la mitad de lo que
`technical/0006` introdujo no está en el doc de estado.** La sección «Shell
de aplicación y navegación» de `docs/estado/interfaz.md` describe las
pastillas y sus estados, pero **no menciona el `<select>` de móvil** ni que
los dos marcados se rendericen siempre, decidiendo el CSS cuál se ve a cada
lado de `--bp-columna`. Eso es el anti-patrón 6 —la verdad solo en el
código— y hay que resolverlo antes de congelar nada.

## Objetivo

Dar al ciclo de vida un final honesto para una spec implementada que no se va
a verificar, y aplicarlo a `technical/0006`, que es el único caso vivo.

## Alcance

- **El estado `closed`** en el ciclo de vida: su significado, sus cinco
  condiciones y quién hace la transición, según decide el **ADR 0013**.
- **El aviso C**, propio de ese estado, que dice qué no se verificó.
- **`docs/proceso/ciclo-de-spec.md`**: el estado en su tabla y una sección
  propia que remite al ADR 0013.
- **`docs/proceso/consolidacion.md`**: su §2 gana el aviso C y su §3 —«una
  spec consolidada no se edita»— pasa a hablar de los **dos** estados
  terminales.
- **`scripts/validateDocs.ts`**: `closed` como estado válido, con criterios y
  *Decisiones abiertas* cerradas exigidos como en los demás estados
  avanzados, y las reglas de aviso.
- **La consolidación de lo que falta de `technical/0006`** en
  `docs/estado/interfaz.md`: el `<select>` de navegación y el mecanismo de
  los dos marcados.
- **El cierre de `technical/0006`**: marcar sus dos criterios cumplidos con
  su evidencia, llevar el criterio incumplido a *Aplazamientos con
  disparador*, y ponerla en `closed`.

## Fuera de alcance

- **Arreglar el `overflow-x` de la cabecera.** Acortar la marca o esconderla
  por debajo de `--bp-columna` es un cambio de diseño que nadie ha pedido y
  que necesitaría su propia spec. Aquí se aplaza con disparador, no se hace.
- **Cualquier otro cambio de la cabecera, del conmutador o de la aplicación.**
  Ni una línea de `src/` cambia por esta spec.
- **Revisar el resto de specs del repositorio** buscando criterios sin
  marcar. `technical/0006` es el único caso vivo; una revisión general sería
  otro trabajo.
- **Automatizar la comprobación de que cada criterio sin marcar tiene
  destino.** Aplazada por el ADR 0013 con su disparador.
- **`product/0014`.** Se resolvió el 2026-09-04 como `superseded`, que es lo
  que le correspondía, y no usa este estado.
- **Cerrar la fase 4 o la fase 5.** Es una decisión aparte, que esta spec
  desbloquea pero no toma.

## Requisitos / comportamiento esperado

### 1. El estado

1.1 `closed` es un estado terminal del ciclo de vida, hermano de
`consolidated` y `superseded`. Significa: **la spec no se va a verificar; el
comportamiento vigente vive en el doc de estado y lo que quedó sin cumplir
vive como deuda o aplazamiento.**

1.2 Las cinco condiciones del ADR 0013 son obligatorias y se comprueban antes
de la transición: estado `implemented`; 21 días naturales o más sin llegar a
`verified`; comportamiento legible en el doc de estado; **cada criterio sin
marcar con destino escrito**; y transición hecha por una persona 🔴.

1.3 Los criterios sin marcar **se quedan sin marcar**. Nada en esta spec
autoriza a marcar un criterio que no se cumplió.

1.4 Una spec `closed` **no se edita**, igual que una `consolidated`: un cambio
posterior de ese comportamiento es una spec nueva.

### 2. El aviso C

2.1 Al pasar a `closed` se estampa, en el mismo sitio que los avisos A y B y
sustituyendo al A:

> ⚠️ **Spec cerrada sin verificar (AAAA-MM-DD).** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy es histórica. Para el estado actual, ver el **Doc de estado**
> indicado arriba. **No llegó a `verified`**: los criterios que siguen sin
> marcar no se cumplieron, y cada uno tiene su destino escrito en
> `docs/roadmap.md`. Se congela aquí como registro, con el ADR 0013 detrás.

2.2 El aviso C excluye al A y al B: una spec lleva exactamente uno.

### 3. Los documentos de proceso

3.1 `ciclo-de-spec.md` §2 añade la fila de `closed` a su tabla de estados, con
«**Humano** 🔴» como responsable de la transición.

3.2 `ciclo-de-spec.md` §5 deja de terminar en «o se cumplen los criterios o no
se cumplen» sin salida: mantiene esa regla —que no cambia— y remite al ADR
0013 para el caso de una spec que no va a alcanzarlos.

3.3 `consolidacion.md` §2 documenta el aviso C junto a los otros dos, y §3
pasa a decir que **ninguno de los dos estados terminales** se edita.

3.4 Ningún otro documento de proceso cambia.

### 4. El validador

4.1 `SPEC_STATES` acepta `closed`.

4.2 `STATES_NEEDING_CRITERIA` incluye `closed`: exige al menos un criterio,
*Decisiones abiertas* cerradas y *Doc de estado* declarado, igual que los
demás estados avanzados.

4.3 Reglas de aviso: `closed` exige el aviso C y prohíbe el A y el B;
`implemented` y `verified` siguen exigiendo el A y pasan a prohibir el C;
`consolidated` sigue exigiendo el B y pasa a prohibir el C; `draft` y
`approved` siguen sin poder llevar ninguno.

4.4 Cada regla nueva lleva su test en `scripts/validateDocs.test.ts`, con el
mismo patrón que las existentes: un caso que pasa y uno que falla con el
mensaje exacto.

### 5. Lo que falta de `technical/0006` en el doc de estado

5.1 La sección «Shell de aplicación y navegación» de
`docs/estado/interfaz.md` describe, en presente, que la navegación se
presenta de dos formas —pastillas por encima de `--bp-columna`, `<select>`
con nombre accesible por debajo—, que **los dos marcados se renderizan
siempre** y que cuál se ve lo decide el CSS con `display`, sin estado de
React ni dos componentes.

5.2 Se escribe también el límite conocido: la cabecera conserva
`overflow-x: auto` porque a 320px la marca y el `<select>` no caben, con su
medición.

### 6. El cierre de `technical/0006`

6.1 Se marcan sus dos criterios cumplidos, cada uno con la evidencia que lo
cierra —la rama documentada de la disyunción, y la comprobación del sitio
público con sus hashes—.

6.2 El criterio del `overflow-x` **se queda sin marcar** y su contenido pasa a
*Aplazamientos con disparador*, en `docs/roadmap.md` y en
`docs/proceso/ci-y-guardarrailes.md` §7, con este disparador: **que la
cabecera cambie de contenido —marca o destinos— por cualquier motivo, o que
el desplazamiento a 320px estorbe de verdad al usarla.**

6.3 Se estampa el aviso C, se pone `Estado: closed` y se registra en
`docs/roadmap.md`: la fila de la fase 5, la de la deuda —que se cierra— y el
índice de *Abierto hoy*.

6.4 Los pasos 6.1 a 6.3 van en un commit propio, separado del que cambia el
proceso y el validador.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `docs/proceso/ciclo-de-spec.md` §2 lista `closed` con «**Humano** 🔴», y
      §5 remite al ADR 0013 sin relajar la regla de que no existe
      «verificado con salvedades».
- [ ] `docs/proceso/consolidacion.md` §2 recoge el aviso C literal y §3 habla
      de los dos estados terminales.
- [ ] Una spec en `closed` **sin** aviso C falla la validación con el mensaje
      `Estado 'closed' requires notice C`; con él, pasa. Test en
      `scripts/validateDocs.test.ts`.
- [ ] Una spec en `closed` que lleve el aviso A o el B falla la validación.
      Test.
- [ ] Una spec en `implemented`, `verified` o `consolidated` que lleve el
      aviso C falla la validación. Test.
- [ ] Una spec en `closed` sin criterios de aceptación, con *Decisiones
      abiertas* sin cerrar, o sin *Doc de estado*, falla la validación con
      los tres mensajes que ya existen para los demás estados avanzados.
      Test.
- [ ] `docs/estado/interfaz.md` describe en presente las dos formas de la
      navegación, que los dos marcados se renderizan siempre, que el CSS
      decide cuál se ve, y el límite del `overflow-x` con su medición.
      Revisión del texto.
- [ ] `technical/0006` queda en `closed`, con el aviso C, con sus dos
      criterios marcados y con el del `overflow-x` sin marcar.
- [ ] El criterio del `overflow-x` aparece en *Aplazamientos con disparador*
      de `docs/roadmap.md` y en `docs/proceso/ci-y-guardarrailes.md` §7, con
      su disparador escrito.
- [ ] `docs/roadmap.md` no deja ninguna fila que siga diciendo que
      `technical/0006` espera verificación.
- [ ] Ni un fichero de `src/` cambia: `git diff --stat` sobre la rama no
      toca `src/`, y `scoreCatalog.snapshot.test.ts` sigue en verde sin
      modificar un valor.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan en
      local, con la cobertura intacta.

## Dependencias y supuestos

- **Depende del ADR 0013**, que es quien decide el estado y sus condiciones.
  Esta spec lo implementa; no vuelve a decidirlo.
- **Depende de `technical/0003`**, que trajo el validador a TypeScript: los
  cambios del requisito 4 son sobre ese código y sus tests.
- Asume que `technical/0006` cumple las cinco condiciones del ADR en el
  momento de cerrarla: está en `implemented` desde el 2026-08-12 —23 días—,
  su comportamiento quedará en el doc de estado por el requisito 5, y su
  único criterio incumplido tendrá destino por el requisito 6.2.
- Asume que `product/0014` **no** usa este estado: se cerró como `superseded`
  el 2026-09-04, que es lo que le correspondía.

## Decisiones abiertas

Ninguna.
