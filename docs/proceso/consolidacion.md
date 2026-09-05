# Consolidación

> Este documento manda sobre **cómo se pliega el efecto de una spec en los
> docs de estado** y sobre **cuándo se puede leer una spec y para qué**.

Es el paso que la mayoría de procesos spec-driven omiten, y el que evita que
la documentación se convierta en un archivo arqueológico.

## 1. Mecánica

1. **Actualizar el/los doc(s) de estado** declarados en el campo *Doc de
   estado*, de forma que describan el comportamiento vigente **en presente** y
   sin referencias al cambio ni al estado anterior.
   **Se lleva el porqué, no solo el qué.** Una constante sin su razonamiento
   es un número mágico: quien la lea después no sabrá si puede moverla. Si la
   spec justificaba un valor —un anclaje, un umbral, un reparto—, esa
   justificación viaja con él al doc de estado. Lo que se queda atrás en una
   spec congelada se pierde a efectos prácticos.
2. **Estampar el aviso** correspondiente en la spec, inmediatamente después de
   la cabecera de campos y **antes** de cualquier nota de revisión previa.
3. **Poner `Estado: consolidated`.**

Los tres pasos van **en el mismo commit**. Una spec marcada `consolidated`
cuyo doc de estado no se actualizó es **peor** que no haberla consolidado:
afirma una propiedad falsa sobre dónde vive la verdad.

## 2. Los tres avisos

Son tres, según lo que sea cierto en cada momento. Se copian literalmente: la
CI comprueba que el aviso presente corresponde al estado declarado, y que no
hay dos a la vez.

**A — al pasar a `implemented`.** El *Contexto* ya no es cierto, pero los docs
de estado aún no recogen el cambio:

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

**B — al consolidar.** Sustituye al aviso A:

> ⚠️ **Spec consolidada (AAAA-MM-DD).** Describe un cambio en el momento en
> que se redactó; su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy es histórica. Para el estado actual, ver `<doc de estado>`.
> Vigentes aquí solo los **criterios de aceptación**, como registro de
> verificación.

**C — al cerrar sin verificar** (ADR 0013, `ciclo-de-spec.md` §6). Sustituye
al aviso A en la spec que no llegó a `verified` y no va a llegar:

> ⚠️ **Spec cerrada sin verificar (AAAA-MM-DD).** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy es histórica. Para el estado actual, ver el **Doc de estado**
> indicado arriba. **No llegó a `verified`**: los criterios que siguen sin
> marcar no se cumplieron, y cada uno tiene su destino escrito en
> `docs/roadmap.md`. Se congela aquí como registro, con el ADR 0013 detrás.

La diferencia importa: **el aviso B afirma que el estado vigente ya se puede
leer en los docs**, y eso solo es cierto una vez hecha la consolidación.
Estamparlo antes es exactamente el fallo que este flujo persigue. El aviso C
afirma lo mismo sobre el doc de estado —por eso cerrar exige haberlo
consolidado— pero **no** afirma que los criterios se cumplieran: dice justo
lo contrario, y por eso no se puede sustituir por el B.

## 3. Regla de lectura

- Una spec `consolidated` **no se lee para obtener contexto** sobre cómo
  funciona el sistema. Se consulta **solo para auditoría**: qué cambió,
  cuándo, con qué criterios y contra qué ADR.
- **Ninguno de los dos estados terminales se edita** —ni `consolidated` ni
  `closed`—. Si el comportamiento vuelve a cambiar, eso es una **spec
  nueva**, que a su vez se consolidará sobre el mismo doc de estado. En una
  spec `closed` la regla es si acaso más estricta: sus criterios sin marcar
  son el registro de qué no se cumplió, y marcarlos después borraría la única
  señal que queda.
- Antes de tocar código de un área, **lee su doc de estado**, no sus specs.

## 4. Qué doc recibe qué

El campo *Doc de estado* de cada spec lo declara explícitamente. Cada área
funcional tiene un único doc responsable, y **el reparto de áreas de este
proyecto lo fija el ADR 0007** (`docs/decisions/0007-reparto-de-areas-de-estado.md`),
que es la tabla vigente. No se repite aquí: un reparto escrito en dos sitios
se desincroniza, y el ADR es quien manda.

Lo que sí manda este documento es **cuándo se crea un doc de estado nuevo**:

- Un doc de estado responde a un **área**, no a un artefacto. La pregunta ante
  una spec que no encaja no es «¿merece esto un doc?», sino «¿de qué área es,
  y quién manda sobre esa área?». Un doc por componente, por vista o por
  fichero es el camino a un doc de estado por pantalla.
- Un área declarada **pendiente de crear** obtiene su doc cuando la primera
  spec que la afecte lo declare como destino; hasta entonces no existiría más
  que como stub vacío. El seguimiento está en `docs/roadmap.md`.
- Un área declarada **no aplica** vuelve a existir con la spec que la traiga,
  y entonces trae su doc con ella.

Solo cuando la respuesta a «¿de qué área es esto?» sea **de ninguna**, falta
un doc de estado — y eso es una corrección del ADR 0007, con su entrada en el
historial.
