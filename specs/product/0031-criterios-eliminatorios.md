# 0031 — Criterios eliminatorios

- **Id:** product/0031
- **Estado:** approved
- **Tipo:** product
- **Fecha:** 2026-08-30
- **Specs relacionadas:** product/0012, product/0018, product/0020, product/0022,
  product/0023, product/0027, product/0029, product/0030
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

## Contexto

El presupuesto es hoy el único filtro duro de la aplicación: un techo en
euros que, con «Ocultar los que superan el presupuesto» activo, saca coches
de la clasificación antes de mostrarla. Todo lo demás que un comprador
considera innegociable —que quepa en el garaje, que el maletero llegue para
lo que hace falta, que el suelo no raspe, que un eléctrico llegue a donde
tiene que llegar— solo se puede leer en la ficha, columna a columna, sin que
la aplicación lo aplique como filtro.

El resultado es que un coche puede ganar por puntos aunque incumpla algo que
para quien decide no es negociable: un maletero de 460 L cuando el viaje que
se hace exige 500, o un largo que no entra en la plaza de garaje que se
tiene. La nota no lo penaliza —no tiene por qué: `viaje` puntúa en una escala
continua, no contra un umbral personal— pero tampoco hay ningún mecanismo
que diga «este coche no es una opción, gane lo que gane».

Precedente directo: `product/0030` resolvió el mismo problema de forma para
las decisiones humanas —un registro que filtra sin tocar la nota—. Esta spec
resuelve la versión mecánica: un umbral sobre una magnitud, no una decisión
escrita.

## Objetivo

Que la persona que compara pueda declarar, por magnitud, un umbral
imprescindible —un mínimo o un máximo—, y que la aplicación separe la
clasificación entre quién lo cumple y quién no, sin que ese umbral toque la
puntuación de ningún coche.

## Alcance

- Un conjunto de reglas eliminatorias, cada una magnitud + operador (mínimo
  o máximo) + valor, sobre cualquiera de las veinticuatro magnitudes de la
  ficha (`FICHA_FIELDS`).
- El presupuesto (`budgetEur`) se enseña y se edita como la primera fila de
  ese mismo panel, con el mismo estado que ya tiene en «Supuestos» —dos
  controles sobre el mismo dato, precedente de «Comparar» en la ficha
  (`technical/0010`)—, y no se convierte en una regla más de la lista: sigue
  siendo el mecanismo ya existente (`car.overBudget`).
- La clasificación partida en dos tramos: quién cumple presupuesto y todas
  las reglas activas, y quién no.
- Un interruptor que oculta el segundo tramo entero, sustituyendo a «Ocultar
  los que superan el presupuesto».
- Persistencia en `AppConfig`, compartible por enlace, con degradación por
  regla.
- Una marca de incumplimiento en la cabecera de columna de la ficha y en la
  tarjeta de la vista de duelo, para candidatos, nunca para la referencia ni
  para el modelo fijado como comparación.
- Un párrafo en «Cómo se calcula todo» que explique que esto filtra, no
  puntúa.
- Un coche que no declara la magnitud de una regla no cumple ni incumple esa
  regla.

## Fuera de alcance

- **Tocar la nota.** Ninguna regla entra en `scoreCatalog`. Un coche que
  incumple se puntúa exactamente igual que si la regla no existiera (mismo
  criterio que `product/0030`, ADR 0004).
- **Un cuarto operador o una regla compuesta.** Solo mínimo o máximo, uno por
  magnitud; no hay «entre A y B» ni combinación de dos reglas sobre el mismo
  campo.
- **Regla categórica sobre `technology`** («solo EV/PHEV»). El catálogo
  distingue tecnología, pero una regla eliminatoria de esta spec es siempre
  numérica; una regla por tecnología es una forma distinta, para una spec
  propia si hace falta.
- **El texto de ayuda «esta regla deja fuera al líder actual».** Da
  contexto de verdad, pero exige recalcular la clasificación sin la regla en
  cada tecleo para nombrar a quién excluye; se deja para una iteración
  futura, anotada en `docs/roadmap.md`.
- **El mensaje de vacío que nombra «la regla más restrictiva».** Cuando
  ningún coche cumple, el mensaje no intenta identificar cuál de las reglas
  activas pesa más —requeriría recalcular la clasificación una vez por
  regla retirada—; se limita a decirlo y a ofrecer quitarlas todas.
- **Marca a nivel de celda o de fila de duelo.** La marca de esta spec vive
  en la cabecera de columna y en la tarjeta de duelo —dice «este candidato
  no cumple»—; no señala la celda concreta de la tabla ni la fila concreta
  del duelo. Quien fija el umbral ya sabe qué magnitud ha escrito, y el
  tramo de la clasificación nombra la regla y el valor exactos.
- **Editar reglas desde la ficha.** Se editan solo desde el panel de la
  clasificación; la ficha únicamente muestra la marca.
- **El puente con `product/0030`** («Descartar por este motivo», con el
  motivo ya escrito a partir de la regla incumplida). Encaja de forma
  natural más adelante; no es necesario para que esta spec cumpla su
  objetivo.

## Requisitos / comportamiento esperado

### 1. La regla

1.1. Una regla eliminatoria es `{ field, operator, value }`: `field` es una
de las veinticuatro claves de `FICHA_FIELDS` (`src/domain/ficha.ts`);
`operator` es `'min'` o `'max'`; `value` es un número.

1.2. El operador **no se elige libremente en los dieciocho campos con
polaridad direccional declarada** (`POLARITY` en `src/domain/ficha.ts`): en
los once `moreIsBetter` (maletero, anchura de hombros, litros por m²,
potencia, autonomía eléctrica, valor residual, fiabilidad OCU, garantía,
extensión de garantía, estética exterior e interior) la regla es siempre
`'min'`; en los siete `moreIsWorse` (longitud, anchura, peso, aceleración,
consumo, precio, mantenimiento) es siempre `'max'`. Los seis campos
`neutral` —generación, retoque, altura, altura libre al suelo, batalla y
batería— ofrecen las dos opciones. La interfaz nunca deja construir una
combinación que contradiga la polaridad declarada.

1.3. A lo sumo una regla por magnitud. Añadir una regla sobre un campo que ya
tiene una la sustituye; no se acumulan dos umbrales sobre el mismo dato.

1.4. Un coche que no declara la magnitud de una regla —campo ausente en el
catálogo, `FichaCell` de tipo `'missing'`— **ni la cumple ni la incumple**:
esa regla no cuenta para él, ni a favor ni en contra. Mismo criterio que la
Δ «no disponible» de la ficha: no hay dato, no hay comparación posible.

1.5. «Altura de acceso», que P4 nombraba, no es una magnitud propia del
catálogo. Se aproxima con «Altura libre al suelo» (`groundClearanceMm`), y
el panel lo dice en su texto de ayuda.

### 2. El presupuesto

2.1. `budgetEur` (`docs/estado/dominio.md`) sigue siendo el mecanismo que ya
existe —`car.overBudget`, calculado en `scoreCatalog`— y no se duplica como
`EliminatoryRule`. El panel de reglas lo enseña como su primera fila, fija y
no eliminable, con el mismo valor y el mismo `onBudgetChange` que el control
de «Supuestos»: dos controles, un solo dato, precedente de «Comparar»
(`technical/0010`).

2.2. Un coche fuera de presupuesto entra en el segundo tramo de la
clasificación (requisito 4) exactamente igual que un coche que incumple una
regla nueva: no hay dos mecanismos con dos comportamientos.

### 3. Persistencia y enlace

3.1. Las reglas viven en `AppConfig.eliminatoryRules: EliminatoryRule[]`, el
mismo objeto que pesos, supuestos y presupuesto — se comparten por el mismo
enlace.

3.2. **`hideOverBudget` se renombra a `hideFailingRules`** y generaliza su
significado: oculta el tramo entero de quien no cumple, presupuesto o
cualquier regla. Es un cambio de forma incompatible de `AppConfig`, así que
`CONFIG_VERSION` sube de `1` a `2`: una configuración guardada con la versión
anterior se descarta entera y cae a los valores por defecto, con el mismo
criterio de siempre (`restoreConfig`, «una versión desconocida no es un dato
parcial que rescatar»). Se documenta como el efecto secundario esperado, no
como una migración.

3.3. Restauración con **degradación por regla**, mismo criterio que
`restoreOverrides`: una regla con `field` que no es una `FichaField`
conocida, `operator` que no es `'min'`/`'max'`, `value` no numérico, o un
`operator` que contradice la polaridad declarada del campo (requisito 1.2)
se descarta sola y se registra; las demás reglas sobreviven. Un `field`
repetido conserva solo la primera aparición (requisito 1.3).

3.4. En el enlace compartible, un parámetro por regla activa,
`r_<field>=<operator>:<value>` (por ejemplo `r_trunkLiters=min:500`), en la
misma familia de nombres cortos que `w_`/`a_`/`o_`; y `hideFailingRules=1`
cuando el interruptor está activo. Con cero reglas y el interruptor apagado
no se añade ningún parámetro nuevo — la URL limpia sigue siendo la URL
limpia.

### 4. La clasificación en dos tramos

4.1. La clasificación calcula, para cada coche que pasa el filtro de
decisión (`product/0030`), si cumple presupuesto y todas las reglas activas.
Los que cumplen forman el **tramo elegible**, ordenado por `total`
descendente igual que hoy, con el mismo tratamiento de podio
(`product/0022`) y la misma `LeaderCard` calculada solo sobre este tramo.

4.2. Los que no cumplen —por presupuesto, por una regla, o por las dos— caen
en el **tramo no elegible**, una sección plegable («No cumplen tus
imprescindibles (N)»), plegada por defecto, bajo el tramo elegible. Cada
fila de este tramo enseña el nombre del coche, su `percentage` y su barra, y
la razón del incumplimiento: qué regla, con el valor pedido y el valor real
(«Maletero: pides ≥ 500 L, tiene 466 L»), o «Fuera de presupuesto» cuando
aplica. Sin número de posición: no está en una clasificación de la que este
tramo está fuera.

4.3. **`hideFailingRules` activo** oculta el tramo no elegible entero —ni
siquiera aparece la sección plegable—, con el mismo criterio con que
«Ocultar los que superan el presupuesto» ocultaba antes. Apagado, la sección
existe siempre que haya al menos un coche en ese tramo.

4.4. Si el tramo elegible queda **vacío** habiendo al menos un coche que
pasa el filtro de decisión, la clasificación no renderiza un `<ol>` vacío:
un mensaje que dice que ningún coche cumple los imprescindibles vigentes y
un botón para quitarlos todos (`eliminatoryRules` a `[]`; el presupuesto no
se toca, porque no es una regla que este botón gestione). Esto sustituye el
límite conocido que documentaba `docs/estado/interfaz.md` —una lista vacía
por presupuesto con el filtro de decisión en «Todos» no se distinguía de
nada—: a partir de esta spec, se distingue.

4.5. El filtro de decisión se aplica **antes** de partir en tramos, con el
mismo criterio de siempre: un coche descartado no aparece en ninguno de los
dos tramos si el filtro de decisión lo excluye primero.

### 5. La ficha

5.1. La cabecera de columna de un candidato que no cumple —presupuesto o
alguna regla activa— lleva una marca de texto, en la línea de `DecisionMark`
(`product/0030`): nunca solo color. La tarjeta de la vista de duelo
(`product/0023`) lleva la misma marca para el candidato enfocado.

5.2. La marca **no aparece nunca** en la referencia (`references.json`, sin
decisión ni presupuesto propio) ni en el modelo fijado como comparación
(`comparisonId`), con el mismo criterio que `DecisionMark` en la cabecera de
columna de `product/0030`.

5.3. La marca es informativa, no un control: a diferencia de la marca de
decisión, no abre ningún diálogo. Las reglas se editan solo desde el panel
de la clasificación (fuera de alcance, punto correspondiente).

### 6. Dónde se explica

6.1. «Cómo se calcula todo» (`ExplicacionPage`) gana un párrafo, en la
misma familia que la explicación de penalizaciones y limitaciones, que dice:
un imprescindible filtra la clasificación, nunca la nota; el presupuesto es
uno de ellos; un coche que no declara la magnitud de una regla no cuenta
como incumplimiento.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Un test comprueba que un coche que incumple una regla puntúa
      exactamente igual que si esa regla no existiera, para el catálogo real
      con pesos y supuestos por defecto (ADR 0004).
- [ ] Un test comprueba que un coche sin la magnitud de una regla no cuenta
      como fallo de esa regla (ni entra en sus «cumplen»).
- [ ] Un test comprueba, para cada campo con polaridad `moreIsBetter` o
      `moreIsWorse`, que el operador forzado coincide con la dirección
      declarada en `POLARITY`.
- [ ] Un test comprueba la degradación por regla: un `field` desconocido, un
      `operator` inválido, un `value` no numérico y un operador que
      contradice la polaridad se descartan solos sin afectar a las demás
      reglas del mismo `AppConfig`; un `field` repetido conserva solo la
      primera regla.
- [ ] Un test comprueba que una configuración guardada con `version: 1` se
      descarta entera tras el cambio de `CONFIG_VERSION` a `2` y cae a los
      valores por defecto.
- [ ] Un test comprueba el enlace compartible: cero reglas y
      `hideFailingRules` apagado no añaden parámetros; una regla activa
      viaja como `r_<field>=<operator>:<value>` y se restaura idéntica.
- [ ] Un test comprueba que el tramo elegible y el no elegible se reparten
      correctamente sobre un catálogo conocido, combinando presupuesto y una
      regla a la vez, y que el filtro de decisión se aplica antes del
      reparto.
- [ ] Un test comprueba que, con el tramo elegible vacío y al menos un coche
      en el catálogo visible, se renderiza el mensaje y no una lista vacía.
- [ ] Un test comprueba que `hideFailingRules` activo hace desaparecer el
      tramo no elegible de la clasificación, y que apagado lo deja plegado
      pero presente.
- [ ] Un test comprueba que la marca de incumplimiento en la ficha aparece
      en la cabecera de un candidato que no cumple y **no** aparece en la
      referencia ni en el modelo fijado como comparación.
- [ ] La secuencia de CI pasa entera en local
      (`docs/proceso/ci-y-guardarrailes.md`, §4), con cobertura al 100 % en
      `src/domain/`, `src/data/` y `src/logging/`.
- [ ] Verificación manual sobre el *build* de producción: crear una regla,
      ver el reparto en dos tramos, ocultar el tramo no elegible, copiar el
      enlace y comprobar que se abre igual, ver la marca en la ficha y en la
      vista de duelo por debajo de `--bp-columna`.

## Dependencias y supuestos

- **No depende de ninguna spec sin implementar.** Se apoya en piezas ya
  consolidadas: `AppConfig` y su enlace compartible (`product/0012`), la
  tabla de polaridad y `FICHA_FIELDS` (`product/0018`), el podio
  (`product/0022`), la vista de duelo (`product/0023`), el orden por
  cualquier magnitud (`product/0027`) y el precedente de filtro-sin-tocar-
  la-nota (`product/0030`).
- **Rompe deliberadamente la compatibilidad de `AppConfig`** (requisito
  3.2): quien tenga guardada una configuración de antes de esta spec la
  pierde al cargar, y vuelve a los valores por defecto. Se asume porque el
  proyecto no tiene cuentas ni sincronización — es local a un navegador — y
  la alternativa, mantener `hideOverBudget` con un significado ensanchado a
  escondidas, deja el nombre del campo mintiendo sobre lo que hace.
  Anotación del propio `config.ts`.
- **El ADR 0004 sigue mandando**: la nota de un coche no depende de qué
  reglas eliminatorias haya activas. El requisito 4 filtra qué se ve, nunca
  qué se calcula.
- **Supone que una persona construye sus propios umbrales.** No hay reglas
  sugeridas ni un catálogo de imprescindibles típicos; el panel nace vacío,
  como los pesos no nacían en cero.
- **El alcance recortado frente a la propuesta original de UX** —el hint de
  a quién excluye una regla, el mensaje que nombra la regla más
  restrictiva, las marcas a nivel de celda y de fila de duelo, el puente
  con `product/0030`, la regla categórica sobre tecnología— fue aprobado
  explícitamente por el propietario del proyecto en la conversación que
  originó esta spec, junto con el resto del diseño, el 2026-08-30.

## Decisiones abiertas

Ninguna.
