# 0013 — Los defectos que la revisión encontró en la calibración

- **Id:** technical/0013
- **Estado:** draft
- **Tipo:** technical
- **Fecha:** 2026-09-02
- **Specs relacionadas:** product/0035, product/0036
- **ADRs relacionados:** 0011
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

## Contexto

Una revisión de código posterior a la consolidación de `product/0036`
—dos pasadas independientes, que coinciden en dos hallazgos— encontró **seis
defectos reales** en el código que esa spec y `product/0035` introdujeron.
Ninguno es un cambio de comportamiento de una spec consolidada, así que no se
editan: se corrigen aquí, con el mismo precedente con que `technical/0002`
corrigió los cinco defectos que otra revisión encontró en `product/0001`.

Los seis, verificados uno a uno contra el código antes de aceptarlos:

**1. El aviso de contradicción cuenta desigualdades, no respuestas.** Desde
`product/0036`, una respuesta puede aportar **dos** desigualdades (la
preferencia y su atribución), y `contradicted` las cuenta por separado — es lo
que manda el requisito 2.4 de esa spec—. Pero la interfaz sigue redactando esa
cifra como si fueran respuestas: con **una sola** respuesta y una atribución
imposible, `calibrate` devuelve `contradicted: 1` y la pantalla dice «Una de
tus respuestas no encaja **con las demás**», cuando no hay ninguna otra. Además
culpa a la elección de coche, no a la atribución, que es lo que de verdad no
encaja. Antes de `product/0036` la frase no podía darse con una sola respuesta:
ningún par del catálogo domina a otro en los siete ejes a la vez, así que una
preferencia suelta nunca se contradecía sola. El comentario de
`CalibrationState.contradicted` (`src/domain/calibration.ts`) arrastra la misma
inexactitud: dice «cuántas respuestas contradice».

**2. La guarda del subconjunto propio mira la longitud, no los ejes
distintos.** `constraintsOf` decide si una atribución es un subconjunto propio
y no vacío con `decisive.length`, no con el número de ejes **distintos**. Un
`decisiveAxes` con repeticiones —siete entradas de un solo eje— se lee como
«marcó los siete» y su segunda desigualdad se descarta en silencio. No es
alcanzable desde `CalibrationDialog`, que construye la lista desde un `Set`,
pero `calibrate` y `MatchupOutcome` son API exportada del dominio y no pueden
depender de que quien llama la construya bien.

**3. Del paso de atribución no se puede volver.** `product/0036`, requisito
3.1, esconde «Me da igual», «Deshacer la última» y «Terminar ahora» mientras
hay una elección pendiente. El efecto no buscado es que **un clic equivocado en
un coche no tiene marcha atrás**: hay que registrar una respuesta que ya se
sabe mala y deshacerla después. El requisito 3.3 dice que deshacer «vuelve al
cara a cara»; hoy solo lo hace cuando la respuesta ya está registrada.

**4. El foco se pierde al cambiar de paso.** Al desmontarse `MatchupView` y
montarse `AttributionStep`, el foco vuelve al principio del diálogo: quien
navega con teclado tiene que tabular desde arriba en **cada** cara a cara, y
las marcas de eje nuevas no se anuncian.

**5. `grid()` sigue construyendo `sums`.** Su único lector era el criterio de
margen que `product/0036` retiró. Hoy se calcula y se cachea un `Uint8Array` de
78.124 posiciones que no lee nadie.

**6. El `:hover` de las marcas de eje se come el color del eje.**
`.axisToggle:hover` declara `border-color` con especificidad `(0,2,0)`, por
encima tanto del `border-left` con `--axis-color` de `.axisToggle` como del
`border-color` de `.axisToggleSelected`, que es `(0,1,0)`. Al pasar el ratón,
una marca pierde el color de su eje —que el requisito 3.1 de `product/0036`
exige— y, si estaba marcada, también pierde la señal de que lo está.

## Objetivo

Corregir los seis defectos sin cambiar ninguna decisión de `product/0035`,
`product/0036` ni del ADR 0011.

## Alcance

Los seis defectos del contexto, y nada más.

## Fuera de alcance

- **Cómo se calibra.** Ni la rejilla, ni el conjunto compatible, ni el
  representante, ni qué se pregunta, ni cuándo termina la tanda, ni las dos
  cifras de avance. Esta spec no toca `product/0036` requisitos 1 y 2 salvo
  para arreglar la guarda del defecto 2, que es un fallo de implementación de
  su requisito 2.3, no una decisión distinta.
- **Que la tanda sobreviva a una recarga**, que sigue fuera con su disparador.
- **`CONFIG_VERSION`**, que no sube.
- **El texto de las dos salidas del paso de atribución** («Siguiente» y «No
  sabría decir»), que no cambia: el defecto 3 añade una vuelta atrás, no una
  tercera forma de avanzar.

## Requisitos / comportamiento esperado

### 1. El aviso de contradicción dice lo que de verdad cuenta

1.1. `CalibrationState.contradicted` pasa a documentarse como lo que es:
**cuántas desigualdades** contradice la mejor combinación, no cuántas
respuestas. Su valor no cambia.

1.2. El aviso de la pantalla de resultado deja de afirmar «con las demás» y
deja de atribuir la contradicción a la elección de coche. Dice que hay algo en
lo contestado que no encaja, en singular o plural según la cifra, sin
prometer cuántas respuestas están implicadas ni cuál.

### 2. La guarda cuenta ejes distintos

2.1. `constraintsOf` decide si la atribución es un subconjunto propio y no
vacío con el número de **ejes distintos** (`decisiveSet.size`), no con la
longitud del array. Un `decisiveAxes` con repeticiones se comporta igual que
el mismo conjunto sin ellas.

### 3. Del paso de atribución se puede volver

3.1. Mientras hay una elección pendiente, «Deshacer la última» **se ofrece** y
cancela esa elección: vuelve al mismo cara a cara, con las marcas de eje
limpias y sin registrar nada.

3.2. «Me da igual» y «Terminar ahora» siguen escondidos en ese paso: la
primera es otra forma de contestar el cara a cara que ya se contestó, y la
segunda saltaría al resultado dejando a medias una respuesta sin registrar.

3.3. Con la elección ya registrada, «Deshacer la última» sigue haciendo lo de
siempre (`product/0035`, requisito 8.2; `product/0036`, requisito 3.3): retira
la respuesta entera, atribución incluida.

### 4. El foco sigue al paso

4.1. Al entrar en el paso de atribución, el foco pasa a él —a su rótulo, que
recibe `tabIndex={-1}`— para que quien navega con teclado no tenga que tabular
desde el principio del diálogo y para que un lector de pantalla anuncie el
cambio de paso.

4.2. No se toca el foco al volver al cara a cara: el navegador ya lo devuelve
al diálogo, y forzarlo a un coche concreto sugeriría una preferencia.

### 5. `grid()` no calcula lo que nadie lee

5.1. `grid()` deja de construir y cachear `sums`. Devuelve solo `values`.

### 6. El `:hover` respeta el color del eje

6.1. Pasar el ratón por una marca de eje **no cambia el color de su filete de
eje** ni, si está marcada, la señal de que lo está. El `:hover` sigue dando
respuesta visible, pero sobre una propiedad que no pisa ninguna de las dos.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Con una sola respuesta y una atribución imposible, el aviso no afirma que
      haya otras respuestas (requisito 1.2), y el comentario de `contradicted`
      dice «desigualdades» (requisito 1.1).
- [ ] `calibrate` da exactamente el mismo resultado con
      `decisiveAxes: ['coste']` que con siete copias de `'coste'`, y ese
      resultado **no** es el de no atribuir (requisito 2.1).
- [ ] Marcar los siete ejes distintos sigue equivaliendo a no atribuir
      (`product/0036`, requisito 2.3, que no cambia).
- [ ] En el paso de atribución se ofrece «Deshacer la última», y pulsarla
      vuelve al mismo cara a cara sin registrar respuesta: el número de
      respuestas no sube y las marcas de eje quedan limpias (requisito 3.1).
- [ ] En el paso de atribución no se ofrecen «Me da igual» ni «Terminar ahora»
      (requisito 3.2).
- [ ] Al entrar en el paso de atribución, el elemento con foco es su rótulo
      (requisito 4.1).
- [ ] `grid()` no expone `sums`, y ningún módulo lo lee (requisito 5.1).
- [ ] Con el ratón encima, una marca de eje conserva el color de su eje, y una
      marcada conserva su señal de marcada (requisito 6.1).
- [ ] La CI entera pasa en local, `npm run test:recovery` incluido —esta spec
      toca `src/domain/calibration.ts`—, con cobertura al 100 % en `domain/`,
      `data/` y `logging/`.

## Dependencias y supuestos

- **No cambia ninguna cifra medida** de `product/0035` ni de `product/0036`:
  los defectos 1, 3, 4 y 6 son de interfaz, el 5 es código muerto, y el 2 solo
  es alcanzable con una entrada que la interfaz no produce. `test:recovery`
  debe seguir dando lo mismo, y se ejecuta para comprobarlo.
- **Las dos pasadas de revisión coinciden** en los defectos 1 y 2, que son los
  dos únicos con efecto observable desde la interfaz tal como está hoy.

## Decisiones abiertas

Ninguna.
