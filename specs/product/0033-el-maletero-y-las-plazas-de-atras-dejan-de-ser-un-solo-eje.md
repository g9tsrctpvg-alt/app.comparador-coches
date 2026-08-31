# 0033 — El maletero y las plazas de atrás dejan de ser un solo eje

- **Id:** product/0033
- **Estado:** verified
- **Tipo:** product
- **Fecha:** 2026-08-31
- **Specs relacionadas:** product/0001, product/0005, product/0011,
  product/0012, product/0017, product/0026, product/0029, product/0034,
  technical/0011
- **ADRs relacionados:** 0004, 0010
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

El eje `viaje` —«Espacio y confort en viaje»— puntúa hoy
`0,5×escala(maletero) + 0,25×escala(batalla) + 0,25×escala(anchura de
hombros)`, y es el de mayor peso por defecto de los seis (10). El reparto
interno tiene un razonamiento escrito, consolidado en
`docs/estado/dominio.md`:

> El maletero pesa 0,5 porque es **la restricción que se incumple** —el
> equipaje cabe o no cabe, y si no cabe se deja en casa—, mientras que el
> espacio de atrás es gradual.

**Ese razonamiento deja de valer en cuanto entra en la ecuación un cofre de
techo.** Con baca, la carga de viaje pasa a ser una restricción *comprable*
—entre 300 y 500 litros por unos cientos de euros, montados solo los días
que hacen falta— mientras que el sitio para las piernas y los hombros de
quien va detrás sigue sin poder comprarse de ninguna manera. El cofre no
cambia cuánto vale un maletero grande: derriba el argumento del 0,5.

Al derribarlo aparece lo que ese 0,5 tapaba. Medido el 2026-08-31 sobre los
dieciocho candidatos publicados:

| Correlación dentro del eje | r |
| --- | --- |
| maletero ↔ habitabilidad (batalla y hombros combinadas) | **+0,28** |
| maletero ↔ batalla | +0,23 |
| maletero ↔ anchura de hombros | +0,28 |
| batalla ↔ anchura de hombros | +0,68 |

Las dos mitades del eje son **casi independientes**: batalla y hombros van
juntas —miden lo mismo en dos direcciones, y así se declaró en
`product/0017`—, pero el maletero no va con ninguna de las dos. El eje suma
dos cosas que no se acompañan y las gobierna con **un solo peso, el más alto
del modelo**. La consecuencia práctica es que hoy no se puede expresar la
preferencia que motiva esta spec: bajar `viaje` porque el maletero importa
menos tira también, y en la misma proporción, el espacio de atrás.

No es el fallo de 2026-08-04 —aquel eje medía otra cosa (r = 0,77 con la
estética interior) y se corrigió en `product/0005`—, pero es de la misma
familia y lo detecta la misma comprobación:
`docs/proceso/calibracion-de-escalas.md` §4.

**Se midieron tres formas de adaptarlo antes de elegir esta** (registradas
como propuesta P16 en `docs/roadmap.md`):

1. **Sumar los litros del cofre al dato de maletero.** Descartada con
   medición: con +400 L a los dieciocho, la desviación típica de esa subnota
   cae de **1,26 a 0,22** y todos se apilan entre 9,15 y 10. La magnitud deja
   de decir nada, que es el fallo que corrige el ADR 0010 visto por el otro
   extremo. Además rompe la invariante de `SourcedNumber`: un valor
   calculado no tiene fuente que declarar.
2. **Hacer editable el reparto interno de `viaje`**, como ya lo son
   `ponderacionAnchoDiario` y `mezclaEstetica`. Aritméticamente equivalente
   a partir el eje —ver requisito 4—, y más barata.
3. **Partir el eje en dos**, que es lo que esta spec hace. Se elige sobre la
   anterior por una razón de producto y no de cálculo: la decisión se toma
   **en la interfaz**, y un supuesto escondido en un panel de supuestos no
   es el sitio donde se decide cuánto pesa el maletero. Dos ejes traen dos
   deslizadores, dos colores, dos iconos y dos líneas en el reparto de la
   diferencia de `product/0029`.

El detonante es concreto: el Honda ZR-V —380 L de maletero y 145 cm de
hombros, el segundo mejor del catálogo en esa magnitud— no se puede valorar
hoy sin que una de las dos cosas mienta sobre la otra.

## Objetivo

Que el maletero y el espacio de las plazas traseras sean **dos ejes
independientes**, con su propio peso, para que quien compara pueda declarar
en la interfaz que lleva cofre —bajando la carga sin tocar la habitabilidad—
y que el cambio, por sí solo, no mueva ninguna nota.

## Alcance

- **`viaje` desaparece** y lo sustituyen dos ejes: `carga` y
  `habitabilidad`. El modelo pasa de seis ejes a siete.
- **Las tres magnitudes y sus seis anclajes siguen siendo los mismos**, y
  siguen puntuando contra la escala absoluta del ADR 0010 con la misma curva
  en S.
- **Pesos por defecto que dejan la clasificación intacta**, con la
  equivalencia demostrada en el requisito 4.
- **Una versión nueva de la configuración persistida**, con la migración de
  ese único campo.
- **Un séptimo color y un séptimo icono de eje** (`technical/0011`), y el
  contenido de la página de explicación para los dos ejes nuevos.

## Fuera de alcance

- **Mover ningún anclaje.** Los seis siguen siendo los del mercado que fijó
  `product/0026`. Esta spec cambia cómo se agrupan las magnitudes, no contra
  qué se puntúan.
- **Modelar el cofre como dato o como supuesto**: ni litros sumados al
  maletero, ni un `cofre` booleano en `GlobalAssumptions`. El cofre no entra
  en ninguna fórmula; lo que entra es la libertad de pesar la carga aparte.
  El motivo está medido en el *Contexto*.
- **La carga máxima sobre el techo** como magnitud del catálogo: es
  `product/0034`, que va aparte porque es un dato de ficha y no un cambio de
  puntuación.
- **Elegir por el usuario cuánto debe pesar cada mitad.** Los valores por
  defecto son los que no cambian nada (requisito 4); qué pesos usar con
  cofre es una decisión de interfaz, tomada con los deslizadores.
- **Dar de alta el Honda ZR-V.** Es trabajo de catálogo con la skill
  `add-model`, posterior a esta spec y sin gate de spec propio.
- **Retirar `travelComfort` o cualquier resto del eje subjetivo.** No queda
  ninguno: `product/0005` lo eliminó por completo.

## Requisitos / comportamiento esperado

### 1. Los dos ejes nuevos

1.1. `AxisId` deja de incluir `'viaje'` y pasa a incluir `'carga'` y
`'habitabilidad'`. `AXIS_ORDER` los coloca **en primer y segundo lugar**, en
ese orden, que es el hueco que ocupaba `viaje`.

1.2. Las etiquetas son «Capacidad de carga» y «Espacio para los de atrás».

1.3. `carga` puntúa **una sola magnitud**:

```text
nota = escala(maletero), 10 desde 910 L, 0 hasta 185 L
```

Es el primer eje del modelo con un solo sumando, y por tanto sin reparto
interno que declarar. Su `AxisBreakdown` sigue llevando su
`subcomponents` con un único elemento: la forma del desglose no cambia
porque haya uno en vez de dos.

1.4. `habitabilidad` puntúa las otras dos, **a partes iguales**:

```text
nota = 0,5×escala(batalla) + 0,5×escala(anchura de hombros)
escala(batalla): 10 desde 3.200 mm, 0 hasta 2.400 mm
escala(hombros): 10 desde 1.460 mm, 0 hasta 1.260 mm
```

El 50/50 no es nuevo: es exactamente la proporción que las dos magnitudes ya
tenían entre sí dentro de `viaje` (0,25 y 0,25), con el razonamiento que
`product/0017` escribió y que sigue siendo cierto —ninguna de las dos es
mejor proxy que la otra del espacio de quien va detrás—.

1.5. Ninguno de los dos lleva penalización condicional. La única del modelo
sigue siendo la de `diario` por eléctrico sin carga en casa.

### 2. Descripción de fórmula

2.1. `VIAJE_FORMULA` desaparece y la sustituyen `CARGA_FORMULA` y
`HABITABILIDAD_FORMULA`, cada una con sus anclajes interpolados desde las
constantes, como hoy.

2.2. La frase que justificaba el 0,5 —«el maletero pesa más porque es la
restricción que se incumple»— **no se traslada a ninguna de las dos**. Deja
de ser cierta al desaparecer el reparto que explicaba, y arrastrarla sería
dejar en pantalla el razonamiento de una fórmula que ya no existe.

### 3. Color, icono y tema

3.1. `carga` **hereda el color y el icono de `viaje`**: `#2a6f8f` y la
maleta. Es la mitad que la maleta ya representaba, y heredarlos evita
reaprender un eje que no ha cambiado de contenido.

3.2. `habitabilidad` estrena token `--color-axis-habitabilidad` e icono
propio (asiento trasero ocupado). El color debe cumplir lo mismo que los
seis de `technical/0011`: ≥ 4,5:1 sobre `card` y sobre `paper`, y no
convertirse en el par más confundible de la paleta, ni en visión normal ni
bajo protanopia.

3.3. **Candidato medido:** `#2d4b03`. Contraste 9,30:1 sobre `card` y 8,48:1
sobre `paper`; L\* 28,4, que **extiende** el rango de luminosidad declarado
(29 a 44) por abajo en vez de comprimirlo; ΔE2000 mínimo contra los otros
seis de 21,7 (`coste`) y contra `signal` de 40,1; bajo protanopia su peor
par es 11,2, por encima del peor par que la paleta ya tiene hoy. La
elección final del tono es de implementación siempre que pase el gate de
`scripts/validateContrast.ts`, que gana a este número.

3.4. Los dos pares nuevos —`axis-habitabilidad` sobre `card` y sobre
`paper`— se añaden a `DECLARED_PAIRS`, con umbral de texto normal, igual
que los doce que ya hay.

### 4. Pesos por defecto: el cambio no mueve ninguna nota

4.1. Los pesos por defecto pasan a ser `carga: 5` y `habitabilidad: 5`,
conservando los otros cinco ejes sin tocar. La suma de pesos sigue siendo
40, así que el `percentage` de `product/0009` conserva su techo.

4.2. **Esto no es una elección de gusto, es la única pareja que deja la
clasificación de hoy intacta.** Con `h = 0,5×escala(batalla) +
0,5×escala(hombros)`:

```text
aportación de viaje     = w × (0,5×maletero + 0,25×batalla + 0,25×hombros)
                        = w × (0,5×maletero + 0,5×h)
aportación de los dos   = (w/2)×maletero + (w/2)×h
                        = w × (0,5×maletero + 0,5×h)
```

Son la misma cifra, no una aproximación. El acotado a 0-10 no interviene:
las dos notas son combinaciones convexas de valores que ya están en 0-10.
Con `w = 10`, la mitad es 5 y es entera.

4.3. Consecuencia buscada: **partir el eje, por sí solo, no cambia el
orden ni la nota de ningún coche.** Todo movimiento posterior en la
clasificación será el que produzca el usuario separando los dos
deslizadores, y eso lo hace auditable.

### 5. Configuración persistida y enlace compartible

5.1. `CONFIG_VERSION` sube de 2 a 3: `AxisWeightsSchema` cambia de forma de
manera incompatible.

5.2. **Una configuración guardada con `version: 2` no se descarta entera:**
se migra, moviendo su peso de `viaje` a los dos ejes nuevos a la mitad cada
uno, y conservando intactos supuestos, presupuesto, reglas eliminatorias,
filtro y valoraciones sobrescritas. Es una **enmienda puntual al requisito 2
de `product/0012`** —«una configuración guardada con otra versión se
descarta entera: no se intenta adivinar qué campos siguen valiendo»— con el
precedente de `product/0016` sobre `product/0014` y de `product/0024` sobre
el requisito 13 de `product/0012`. Se enmienda porque la premisa de aquella
regla no se cumple aquí: no hay nada que adivinar, la equivalencia está
demostrada en 4.2 y es exacta. Descartar borraría las valoraciones de
estética escritas a mano, que son el dato más caro de reponer de toda la
configuración.

5.3. La migración se aplica **solo** al salto de 2 a 3. Cualquier otra
versión desconocida sigue cayendo entera a los valores por defecto, como
hasta hoy, y sigue registrando su descarte.

5.4. Un peso de `viaje` impar produce un peso migrado con media unidad
(por ejemplo 7 → 3,5 y 3,5). Es válido —`AxisWeightsSchema` acota el rango,
no el escalón— y el deslizador, con `step` 1, lo redondeará en cuanto
alguien lo mueva. Se acepta a propósito: preferir un entero exigiría alterar
la nota migrada, que es justo lo que 4.2 evita.

5.5. En la URL, los parámetros `w_viaje` desaparecen y aparecen `w_carga` y
`w_habitabilidad`. Un enlace antiguo con `w_viaje` y `v=2` cae en la misma
migración de 5.2.

### 6. Interfaz

6.1. El panel de pesos muestra **siete** deslizadores, cada uno con su color
y su icono, sin cambiar su forma ni su interacción.

6.2. El desglose de cada coche, el reparto de la diferencia de
`product/0029` y su cálculo de sensibilidad muestran siete ejes sin ningún
cambio propio: los tres recorren `AXIS_ORDER`.

6.3. La página «Cómo se calcula todo» gana la prosa de los dos ejes nuevos
en `AXIS_CONTENT`, con un `anchorReasoning` por subcomponente —uno en
`carga`, dos en `habitabilidad`—. El razonamiento de cada anclaje se
conserva tal cual está escrito hoy, **menos** la parte que explicaba el
reparto 0,5 / 0,25 / 0,25, que se retira por lo dicho en 2.2.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `AXIS_ORDER` tiene siete ejes, empieza por `carga` y `habitabilidad`,
      y no existe ningún `AxisId` `'viaje'` en el código.
- [ ] `carga` puntúa `escala(maletero)` con los anclajes 910 L y 185 L, y su
      desglose declara un único subcomponente.
- [ ] `habitabilidad` puntúa `0,5×escala(batalla) + 0,5×escala(hombros)` con
      los anclajes 3.200/2.400 mm y 1.460/1.260 mm.
- [ ] Con los pesos por defecto, la nota total y el porcentaje de **los
      dieciocho candidatos publicados** coinciden con los de antes del
      cambio hasta el último decimal, y el orden de la clasificación es
      idéntico. Verificado contra el *snapshot* vigente de `scoreCatalog`,
      que no debe cambiar de valores.
- [ ] `DEFAULT_WEIGHTS` declara `carga: 5` y `habitabilidad: 5`, y la suma de
      los siete pesos por defecto es 40.
- [ ] `CONFIG_VERSION` es 3, y una configuración `version: 2` con
      `weights.viaje = W` se restaura con `carga = W/2`, `habitabilidad =
      W/2` y el resto de sus campos —supuestos, presupuesto, reglas, filtro
      y valoraciones— intactos.
- [ ] Una configuración con una versión distinta de 2 y de 3 sigue cayendo
      entera a los valores por defecto y registra el descarte.
- [ ] Un enlace con `w_viaje=7&v=2` se restaura con `carga = 3,5` y
      `habitabilidad = 3,5`; `configToParams` emite `w_carga` y
      `w_habitabilidad` y nunca `w_viaje`.
- [ ] `axisTheme.module.css` declara una clase por cada uno de los siete
      ejes, y `axisTheme.test.ts` lo comprueba contra `AXIS_ORDER`.
- [ ] `AxisIcon` devuelve un icono distinto para cada uno de los siete ejes.
- [ ] `scripts/validateContrast.ts` comprueba catorce pares de eje y los
      catorce pasan 4,5:1.
- [ ] `AXIS_CONTENT` declara los siete ejes, y el número de
      `anchorReasoning` de cada uno coincide con su número de
      subcomponentes.
- [ ] Ninguna cadena de la interfaz ni de las descripciones de fórmula
      afirma que el maletero pese más que las otras dos magnitudes.
- [ ] La CI entera pasa en local: `typecheck`, `lint`, `format:check`,
      `arch:check`, `test:coverage` con el suelo de cobertura vigente,
      `check:photos` y el lint de Markdown.

## Dependencias y supuestos

- **Depende de que los anclajes vigentes sigan siendo los del ADR 0010.**
  Si `product/0026` se revisara, esta spec no se ve afectada: no toca
  ninguno de los seis números.
- **No depende de `product/0034`.** Las dos pueden implementarse en
  cualquier orden; `0034` declara un dato de ficha que ningún eje lee.
- **Supone que el reparto 50/50 de `habitabilidad` se hereda, no se
  redecide.** Si alguna vez se demuestra que la anchura de hombros es mejor
  proxy que la batalla, será otra spec; hoy `product/0017` dice que no lo
  es, y la correlación medida entre ambas (r = 0,68) no aporta motivo para
  separarlas.
- **Supone que siete ejes siguen cabiendo en el panel de pesos y en el
  reparto sin rediseño.** Los tres sitios que pintan ejes recorren
  `AXIS_ORDER` y no tienen ningún número seis escrito; el único efecto
  visible es una línea más y un resumen de panel más largo.

## Decisiones abiertas

Ninguna.
