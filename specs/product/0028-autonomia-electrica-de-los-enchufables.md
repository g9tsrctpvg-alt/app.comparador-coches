# 0028 — Cuánto anda con la batería: autonomía eléctrica de los enchufables

- **Id:** product/0028
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-26
- **Specs relacionadas:** product/0005, product/0008, product/0013,
  product/0014, product/0018, product/0020, product/0021, product/0027
- **ADRs relacionados:** ninguno
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

## Contexto

La ficha compara veintidós magnitudes y **ninguna dice hasta dónde llega un
coche eléctrico con la batería llena**. Es la pregunta que decide si un
enchufable sirve o no para el uso que este proyecto compara, y hoy la ficha
la deja sin contestar.

Lo único eléctrico que el catálogo declara es `consumption`, y lo declara en
una unidad que no es la de nadie más: los cinco eléctricos van en
`kWh/100km` y los once térmicos e híbridos en `l/100km`. `product/0018` ya
decidió lo que hay que hacer con eso —la Δ entre unidades distintas queda
`'unavailable'`, porque restar esos números no diría nada—, así que la
columna de consumo de un eléctrico se lee sola, sin comparación posible, y
aun leyéndola no dice cuántos kilómetros hay dentro: para eso haría falta la
capacidad de la batería, que el catálogo tampoco declara.

El resultado es que la mayor diferencia práctica entre los candidatos —un
Tucson PHEV que hace unas decenas de kilómetros sin gastar gasolina, un
Ioniq 5 que hace varios cientos y luego hay que enchufarlo— **no está en la
ficha en ninguna forma**, ni siquiera como dato bruto. `docs/roadmap.md` lo
tiene registrado desde hace semanas como *eje de autonomía y repostaje*, y
lo deja fuera de `product/0005` a propósito, porque puntuarlo mezcla alcance
con tiempo de repostaje y necesita spec propia. Esa spec sigue sin escribirse,
y mientras tanto el dato no está ni declarado.

## Objetivo

Que el catálogo declare **los kilómetros homologados que cada enchufable
recorre con la batería llena**, con fuente real, y que se lean en la ficha
completa junto al resto de magnitudes: comparables y ordenables, sin nota y
sin eje.

## Alcance

- **Un campo nuevo en `Car`**, `electricRangeKm`, con la autonomía eléctrica
  homologada WLTP en kilómetros.
- **Una invariante de esquema por tecnología**: los enchufables lo declaran;
  los que solo queman combustible no pueden declararlo.
- **Una fila nueva en la ficha completa**, dentro de «Mecánica y
  prestaciones», justo detrás de «Consumo», con Δ y polaridad
  `moreIsBetter`.
- **El alta del dato para los siete registros enchufables de hoy** —cinco
  `EV` y dos `PHEV`, publicados y despublicados por igual— con fuente real
  citada.
- **La incorporación del campo a la skill `add-model`**, para que un
  eléctrico o un enchufable nuevo no pueda darse de alta sin él, ni un
  híbrido convencional darse de alta con él.

## Fuera de alcance

- **El eje de autonomía y repostaje.** Sigue siendo trabajo futuro con spec
  propia, registrado en `docs/roadmap.md`. Esta spec trae **el dato**, no la
  nota: ningún eje lo lee, ningún peso cambia, ninguna nota de ningún coche
  se mueve. El motivo por el que puntuarlo es un problema aparte no ha
  cambiado —lo que molesta de un eléctrico en viaje no es solo el alcance,
  es el tiempo de repostaje, y el catálogo no declara ni potencia de carga
  ni curva—, y esta spec no lo resuelve ni pretende hacerlo.
- **Todo lo demás de la carga y la batería**: capacidad en kWh, potencia
  máxima en corriente continua, tiempo de 10 a 80 %, tipo de conector.
  Cada uno es una magnitud propia con su fuente, y ninguno hace falta para
  contestar «cuánto anda».
- **La autonomía real.** El dato que entra es el homologado, no una medición
  a 120 km/h ni una estimación de invierno. Esas cifras no se publican de
  forma comparable entre marcas, y este catálogo compara lo comparable.
- **La autonomía total de un PHEV** (eléctrica más térmica) y **la autonomía
  de un térmico con un depósito**. La primera suma dos cosas que se
  recuperan de forma distinta —un enchufe de horas y un surtidor de
  minutos— y leerla como un número solo se sostiene si se ignora esa
  diferencia; la segunda exige declarar la capacidad del depósito, que hoy
  no está en el catálogo, y saldría de dividir por un consumo homologado que
  ya se sabe optimista. Las dos entran, si entran, con la spec del eje.
- **`Reference`.** El Alfa Romeo Giulietta es un térmico: no declara el
  campo, como no lo declara ningún otro térmico. Su esquema no se toca.
- **El conjunto «Esenciales»** (`product/0020`), que sigue con sus seis
  campos. Es una magnitud que solo tienen siete de dieciocho candidatos; un
  conjunto pensado para decidir de un vistazo no se llena de celdas vacías.
- **Los seis ejes, sus escalas, sus pesos y sus supuestos.** No se toca ni
  uno.

## Requisitos / comportamiento esperado

### 1. El dato

1.1. `Car` declara `electricRangeKm`, un dato con fuente (`SourcedNumber`)
en kilómetros, **opcional en la forma del campo pero no en la práctica**:
qué registros deben declararlo lo decide el requisito 1.3, no quien edita el
JSON.

1.2. **Qué mide exactamente:** la autonomía eléctrica homologada **WLTP en
ciclo mixto**, de la versión concreta que el catálogo compara.

- En un `EV`, la autonomía WLTP combinada.
- En un `PHEV`, la autonomía eléctrica equivalente (EAER) WLTP en ciclo
  mixto — **no** la de ciclo urbano, que es sensiblemente mayor y no se
  compara con la mixta de un eléctrico.

La versión importa: batería y llantas cambian el número dentro del mismo
modelo, y la fuente citada debe ser la de la versión que se puntúa, igual
que en el resto de magnitudes.

1.3. **La tecnología decide quién lo declara**, y el esquema lo hace cumplir:

- `EV` y `PHEV` **deben** declararlo. Un enchufable sin autonomía declarada
  es un registro incompleto, no un registro con un dato de menos.
- `ICE`, `MHEV` y `HEV` **no pueden** declararlo. Un microhíbrido no anda
  con la batería, y los metros que un híbrido convencional hace en eléctrico
  no están homologados como autonomía ni se comparan con nada: escribir ahí
  un número sería inventar una magnitud que no existe.

El esquema rechaza las dos infracciones —el enchufable que no lo trae y el
térmico que sí— nombrando el campo y la tecnología del registro. Es una
invariante del dato, no una convención que alguien deba recordar.

1.4. El valor lleva **fuente real citada**, nunca de memoria, con la misma
regla que el resto del catálogo: `estimated: false` cuando sale de la
homologación publicada, `estimated: true` cuando sale de cualquier otro
sitio, y en ese caso queda registrada la deuda en `docs/roadmap.md` como
cualquier otra estimación del catálogo.

1.5. Los siete registros enchufables de hoy lo declaran; los once restantes,
no. Los despublicados cuentan: un coche oculto sigue siendo un dato real del
catálogo.

### 2. La ficha

2.1. La ficha declara una magnitud nueva, `electricRangeKm`, en el bloque
**«Mecánica y prestaciones»**, **inmediatamente después de «Consumo»**.
Consumo y autonomía son la misma pregunta contada por sus dos extremos, y se
leen juntas. La ficha pasa de veintidós magnitudes a veintitrés.

2.2. **Polaridad `moreIsBetter`**: más autonomía es mejor, sin matices —a
diferencia de la altura o la batalla, aquí sí hay una dirección que el
proyecto puede afirmar. En consecuencia, y por la vía que `product/0027` ya
definió, **ordenar por esta magnitud pone primero la autonomía mayor**, y la
Δ se colorea como mejor cuando es positiva.

2.3. La magnitud es **ordenable desde el mismo día**, sin lista aparte que
mantener: `FICHA_SORT_CRITERIA` se deriva de `FICHA_FIELDS`
(`product/0027`), y el `<optgroup>` que la rotula es el mismo bloque de
«Mecánica y prestaciones» que rotula su fila.

2.4. **Un coche que no la declara deja su celda `missing`**, que la ficha ya
muestra como raya con texto accesible. No es un cero: un térmico no tiene
autonomía eléctrica de cero kilómetros, tiene una magnitud que no le
aplica. Si es la entidad de comparación la que no la declara —el caso
normal, porque la referencia es un térmico—, la Δ de las demás en esa fila
queda `'unavailable'`, por la vía que `product/0018` ya definió.

2.5. **La Δ entre un `EV` y un `PHEV` sí se calcula.** Están en la misma
unidad y en el mismo ciclo de homologación, así que la resta dice
exactamente lo que parece: cuántos kilómetros de más da uno con la batería
llena. Que uno lleve además un motor térmico detrás es una diferencia real,
y la ficha ya la enseña en su propia fila de tecnología (`product/0008`); no
hace falta apagar esta Δ para contarla dos veces.

2.6. El conjunto «Esenciales» sigue mostrando exactamente sus seis campos.

### 3. Lo que no cambia

3.1. **Ninguna nota de ningún coche cambia.** El desglose de los seis ejes
no menciona la autonomía, ni como entrada, ni como supuesto, ni como `info`.

3.2. `Reference` no declara el campo. Su celda es `missing`, como la de
cualquier térmico del catálogo, y por la misma razón.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `CarSchema` rechaza un registro `EV` o `PHEV` sin `electricRangeKm`,
      nombrando el campo y el registro.
- [ ] `CarSchema` rechaza un registro `ICE`, `MHEV` o `HEV` que declare
      `electricRangeKm`, nombrando el campo y la tecnología.
- [ ] Un registro `EV` o `PHEV` con el campo valida; un `ICE`, `MHEV` o
      `HEV` sin él valida.
- [ ] Los siete registros enchufables de `cars.json` —los cinco `EV` y los
      dos `PHEV`, incluido el despublicado— declaran `electricRangeKm` con
      fuente citada y verificable por URL; los once restantes no lo
      declaran.
- [ ] La ficha completa muestra la fila «Autonomía eléctrica» dentro de
      «Mecánica y prestaciones», justo detrás de «Consumo», y renderiza
      veintitrés magnitudes.
- [ ] El selector de orden ofrece la magnitud bajo el grupo «Mecánica y
      prestaciones», ordena de mayor a menor autonomía y deja al final, en
      las dos direcciones, a las entidades que no la declaran.
- [ ] Comparando contra un térmico —la referencia incluida—, la celda de
      autonomía de los enchufables se muestra como raya con texto accesible,
      no como `0`.
- [ ] Comparando un `EV` contra un `PHEV`, la Δ es la diferencia en
      kilómetros, coloreada como mejor en el de más autonomía.
- [ ] El snapshot de `scoreCatalog` es **idéntico** antes y después del
      cambio, y ningún `AxisBreakdown` menciona la autonomía.
- [ ] El conjunto «Esenciales» sigue mostrando exactamente sus seis campos.
- [ ] La skill `add-model` pide el dato al dar de alta un `EV` o un `PHEV`,
      y prohíbe declararlo en el resto.
- [ ] `npm run test:coverage` sigue en 100 % en `domain/`, `data/` y
      `logging/`.

## Dependencias y supuestos

- **No hace falta ADR nuevo.** Un ADR registra una decisión estructural con
  alternativas; aquí no hay escala que calibrar porque no hay nota, y la
  decisión de fondo —que la autonomía no puntúa todavía— ya está tomada y
  escrita en `docs/roadmap.md` y en el *fuera de alcance* de `product/0005`.
  Esta spec la hereda, no la reabre.
- **El dato es homologado, no real.** El WLTP es optimista, y en autopista o
  en invierno la autonomía cae de forma apreciable. Se declara así porque es
  lo único publicado de forma comparable entre marcas, y quien lea la celda
  no debe entenderla como «lo que hará el coche», igual que ya ocurre con
  `consumption`, que sale del mismo ciclo y arrastra el mismo sesgo.
- **La invariante del requisito 1.3 es cruzada**, entre `technology` y
  `electricRangeKm`, así que vive en un refinamiento del registro completo y
  no en el esquema del campo: un `SourcedNumber` no puede saber qué
  tecnología lo rodea.
- **La ficha pasa de veintidós campos a veintitrés.** `POLARITY` es un
  `Record<FichaField, DeltaPolarity>`, así que TypeScript exige declarar la
  dirección del campo nuevo en tiempo de compilación: no puede quedarse sin
  polaridad por descuido. La cuenta de veintidós está escrita en varios
  sitios —`docs/estado/dominio.md`, `docs/estado/interfaz.md`, comentarios
  de `FichaPage.tsx` y de `ficha.ts`— y la consolidación tiene que
  recorrerlos todos.
- **Los valores concretos no se congelan en esta spec.** No hay escala que
  anclar —a diferencia de `product/0017`—, así que el alta de los siete
  registros es alta de catálogo ordinaria y su sitio es el commit de
  implementación, con su fuente por registro.
- **Coches dados de alta mientras esta spec siga en `draft`** se añaden sin
  el campo, siguiendo el esquema vigente, y quedan como deuda de migración
  en `docs/roadmap.md` hasta que esta spec se implemente. Los dados de alta
  después de `approved` lo incluyen desde el alta.

## Decisiones abiertas

Ninguna.
