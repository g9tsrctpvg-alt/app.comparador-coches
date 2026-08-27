# 0028 — Cuánto anda con la batería, y cuánta batería lleva

- **Id:** product/0028
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-26
- **Specs relacionadas:** product/0005, product/0008, product/0009,
  product/0013, product/0014, product/0018, product/0020, product/0021,
  product/0027
- **ADRs relacionados:** ninguno
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

## Contexto

La ficha compara veintidós magnitudes y **ninguna dice hasta dónde llega un
coche con la batería**. Es la pregunta que decide si un enchufable sirve o no
para el uso que este proyecto compara, y hoy la ficha la deja sin contestar.

Lo único eléctrico que el catálogo declara es `consumption`, y lo declara en
una unidad que no es la de nadie más: los cinco eléctricos van en
`kWh/100km` y los trece restantes en `l/100km`. `product/0018` ya decidió lo
que hay que hacer con eso —la Δ entre unidades distintas queda
`'unavailable'`, porque restar esos números no diría nada—, así que la
columna de consumo de un eléctrico se lee sola, sin comparación posible, y
aun leyéndola no dice cuántos kilómetros hay dentro: para eso haría falta la
capacidad de la batería, que el catálogo tampoco declara.

El resultado es que la mayor diferencia práctica entre los candidatos —un
Tucson PHEV que hace 70 km sin gastar gasolina, un IONIQ 5 que hace 570 y
luego hay que enchufarlo— **no está en la ficha en ninguna forma**, ni
siquiera como dato bruto. `docs/roadmap.md` lo tiene registrado desde hace
semanas como *eje de autonomía y repostaje*, y lo deja fuera de
`product/0005` a propósito, porque puntuarlo mezcla alcance con tiempo de
repostaje y necesita spec propia. Esa spec sigue sin escribirse, y mientras
tanto el dato no está ni declarado.

**Y hay un segundo agujero, más silencioso.** Los dieciocho candidatos llevan
batería de tracción, no cinco: cuatro microhíbridos y siete híbridos
convencionales también la tienen, solo que pequeña. Entre esos once, la
autonomía eléctrica **no existe como dato comparable** —el WLTP no
homologa ninguna para un híbrido no enchufable, y lo que publican
los medios va de «unos metros» a «entre 20 y 40 km» según a quién se
pregunte—, así que compararlos por ahí obligaría a inventar una magnitud.
La capacidad de la batería, en cambio, **sí se publica y sí se compara**:
un Corolla Cross lleva 0,85 kWh, un Tucson HEV 1,49, un Tonale 0,77. Es la
misma pregunta —cuánta electricidad se lleva encima— hecha de una forma que
todos los electrificados pueden contestar.

## Objetivo

Que el catálogo declare **cuánto anda cada coche con la batería** —los
kilómetros homologados WLTP, donde ese dato existe— y **cuánta batería
lleva** —la capacidad en kWh, que existe para todo electrificado—, con
fuente real, y que las dos se lean en la ficha completa junto al resto de
magnitudes: comparables y ordenables, sin nota y sin eje.

## Alcance

- **Dos campos nuevos en `Car`**: `electricRangeKm`, la autonomía eléctrica
  homologada WLTP en kilómetros, y `batteryKwh`, la capacidad de la batería
  de tracción.
- **Una invariante de esquema por tecnología** para cada uno: quién debe
  declararlo, quién puede y quién no.
- **Dos filas nuevas en la ficha completa**, dentro de «Mecánica y
  prestaciones», justo detrás de «Consumo».
- **El alta de los dos datos para los registros de hoy** —publicados y
  despublicados por igual— con fuente real citada.
- **La incorporación de los dos campos a la skill `add-model`**.

## Fuera de alcance

- **El eje de autonomía y repostaje.** Sigue siendo trabajo futuro con spec
  propia, registrado en `docs/roadmap.md`. Esta spec trae **los datos**, no
  la nota: ningún eje los lee, ningún peso cambia, ninguna nota de ningún
  coche se mueve. El motivo por el que puntuarlos es un problema aparte no ha
  cambiado —lo que molesta de un eléctrico en viaje no es solo el alcance,
  es el tiempo de repostaje, y el catálogo no declara ni potencia de carga
  ni curva—, y esta spec no lo resuelve ni pretende hacerlo.
- **El resto de la carga**: potencia máxima en corriente continua, tiempo de
  10 a 80 %, tipo de conector. Cada uno es una magnitud propia con su
  fuente, y ninguno hace falta para contestar las dos preguntas de arriba.
- **La autonomía real.** El dato que entra es el homologado, no una medición
  a 120 km/h ni una estimación de invierno. Esas cifras no se publican de
  forma comparable entre marcas, y este catálogo compara lo comparable.
- **La autonomía total de un PHEV** (eléctrica más térmica) y **la autonomía
  de un térmico con un depósito**. La primera suma dos cosas que se
  recuperan de forma distinta —un enchufe de horas y un surtidor de
  minutos— y leerla como un número solo se sostiene si se ignora esa
  diferencia; la segunda exige declarar la capacidad del depósito, que hoy
  no está en el catálogo. Las dos entran, si entran, con la spec del eje.
- **La distinción entre capacidad bruta y capacidad útil.** El catálogo
  declara **una** capacidad, la que la fuente publica como capacidad de la
  batería (requisito 2.2). Modelar las dos exigiría un campo más que la
  mayoría de fichas dejaría vacío: km77 solo publica «capacidad útil»
  para cinco de los dieciocho registros.
- **`Reference`.** El Alfa Romeo Giulietta es un térmico puro: no declara
  ninguno de los dos campos, y su esquema no se toca.
- **El conjunto «Esenciales»** (`product/0020`), que sigue con sus seis
  campos.
- **Los seis ejes, sus escalas, sus pesos y sus supuestos.** No se toca ni
  uno.

## Requisitos / comportamiento esperado

### 1. La autonomía eléctrica

1.1. `Car` declara `electricRangeKm`, un dato con fuente (`SourcedNumber`)
en kilómetros.

1.2. **Qué mide:** la autonomía eléctrica homologada **WLTP en ciclo
mixto**, de la versión concreta que el catálogo compara.

- En un `EV`, la autonomía WLTP combinada.
- En un `PHEV`, la autonomía eléctrica equivalente (EAER) WLTP en ciclo
  mixto — **no** la de ciclo urbano, que es sensiblemente mayor y no se
  compara con la mixta de un eléctrico.

La versión importa: batería y llantas cambian el número dentro del mismo
modelo, y la fuente citada debe ser la de la versión que se puntúa.

1.3. **Quién lo declara:**

- `EV` y `PHEV` **deben**. Un enchufable sin autonomía declarada es un
  registro incompleto, no un registro con un dato de menos.
- `HEV` y `MHEV` **pueden**, y solo si existe fuente real para esa versión.
  Hoy no la hay para ninguno: el WLTP **no homologa** autonomía eléctrica
  para un híbrido no enchufable, y las cifras que circulan no son
  comparables entre marcas ni proceden del mismo método. Sus celdas quedan
  vacías hasta que aparezca una fuente, no rellenas con una estimación.
- `ICE` **no puede**. Un coche que solo quema combustible no tiene
  autonomía eléctrica: no es un dato ausente, es una magnitud que no le
  aplica.

1.4. **Una autonomía que no venga de la homologación WLTP se declara
`estimated: true`**, y la ficha ya la distingue con la tilde `~` y su texto
accesible («valor estimado, no verificado directamente»), la misma marca que
`product/0009` fijó para todo dato estimado. Así, el día que un híbrido
convencional traiga una cifra de otro origen, quien lea la columna ve de
inmediato que no está mirando lo mismo que en la fila de al lado.

### 2. La capacidad de la batería

2.1. `Car` declara `batteryKwh`, un dato con fuente (`SourcedNumber`) en
kWh: la capacidad de la **batería de tracción**, la que mueve el coche.
No la de servicio de 12 V, que la tienen todos y no distingue a ninguno.

2.2. **Se declara la capacidad tal y como la publica la fuente** —la total
o bruta, que es la que se publica de forma general—, y la etiqueta de la
fuente dice cuál es cuando el dato publicado es la útil. Una sola cifra por
coche: ver *Fuera de alcance*.

2.3. **Quién la declara:**

- `EV` y `PHEV` **deben**: no hay ninguno cuya capacidad no se publique.
- `HEV` y `MHEV` **pueden**, y la declaran cuando la fuente la publica. Hoy
  la publican siete de los once; los otros cuatro —Civic e:HEV, CR-V e:HEV,
  NX 350h y CX-5, donde km77 responde «No disponible»— dejan la celda
  vacía. Es una ausencia de fuente, no de dato, y se registra como deuda.
- `ICE` **no puede**: no hay batería de tracción que declarar.

2.4. **Esta es la magnitud que compara un híbrido con otro.** Es la razón de
que entre en esta spec y no en la del eje: la autonomía eléctrica separa a
los enchufables del resto y deja a once candidatos sin nada que comparar,
mientras que la capacidad los alcanza a todos los electrificados con el
mismo número y el mismo método.

### 3. La ficha

3.1. La ficha declara dos magnitudes nuevas, `electricRangeKm` y
`batteryKwh`, en el bloque **«Mecánica y prestaciones»**, **inmediatamente
después de «Consumo»** y en ese orden. Consumo, autonomía y batería son la
misma pregunta contada por sus tres caras, y se leen juntas. La ficha pasa
de veintidós magnitudes a veinticuatro.

3.2. **`electricRangeKm` tiene polaridad `moreIsBetter`**: más autonomía es
mejor, sin matices. Ordenar por ella pone primero la mayor, y la Δ se
colorea como mejor cuando es positiva.

3.3. **`batteryKwh` tiene polaridad `neutral`**, y no por prudencia
decorativa: más batería es más alcance, pero también más peso, más precio y
más tiempo de carga, y este proyecto **no ha declarado cuál de las dos cosas
le importa más** —exactamente el caso de la batalla, que ya es `neutral` por
este mismo motivo (`product/0018`, requisito 3.3)—. Ante la duda no se
inventa un juicio de color. Es un dato descriptivo: dice qué lleva el coche,
no si eso es bueno.

3.4. Las dos son **ordenables desde el mismo día**, sin lista aparte que
mantener: `FICHA_SORT_CRITERIA` se deriva de `FICHA_FIELDS`
(`product/0027`), y el `<optgroup>` que las rotula es el mismo bloque que
rotula sus filas.

3.5. **La capacidad se muestra con dos decimales.** No es cosmética: las
capacidades de los microhíbridos e híbridos van de 0,77 a 1,49 kWh, y con un
solo decimal 0,77 y 0,85 se leerían las dos como «0,8» — la comparación que
el requisito 2.4 justifica quedaría anulada por el formato.

3.6. **Un coche que no declara una de las dos deja su celda `missing`**, que
la ficha ya muestra como raya con texto accesible. No es un cero: un híbrido
convencional no tiene una autonomía eléctrica de cero kilómetros, tiene una
magnitud que no le aplica. Si es la entidad de comparación la que no la
declara —el caso normal, porque la referencia es un térmico—, la Δ de las
demás en esa fila queda `'unavailable'`, por la vía que `product/0018` ya
definió.

3.7. **La Δ entre un `EV` y un `PHEV` sí se calcula.** Están en la misma
unidad y en el mismo ciclo de homologación, así que la resta dice
exactamente lo que parece: cuántos kilómetros de más da uno con la batería
llena. Que uno lleve además un motor térmico detrás es una diferencia real,
y la ficha ya la enseña en su propia fila de tecnología (`product/0008`); no
hace falta apagar esta Δ para contarla dos veces.

3.8. El conjunto «Esenciales» sigue mostrando exactamente sus seis campos.

### 4. Lo que no cambia

4.1. **Ninguna nota de ningún coche cambia.** El desglose de los seis ejes
no menciona ni la autonomía ni la batería, ni como entrada, ni como
supuesto, ni como `info`.

4.2. `Reference` no declara los campos. Sus celdas son `missing`, como las
de cualquier térmico del catálogo, y por la misma razón.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `CarSchema` rechaza un registro `EV` o `PHEV` sin `electricRangeKm` o
      sin `batteryKwh`, nombrando el campo y el registro.
- [ ] `CarSchema` rechaza un registro `ICE` que declare cualquiera de los
      dos campos, nombrando el campo y la tecnología.
- [ ] `CarSchema` acepta un `HEV` o `MHEV` con los dos campos, con uno solo
      y con ninguno: en esas dos tecnologías son opcionales de verdad.
- [ ] Los siete registros enchufables de `cars.json` —los cinco `EV` y los
      dos `PHEV`, incluido el despublicado— declaran las dos magnitudes con
      fuente citada y verificable por URL.
- [ ] Los siete híbridos y microhíbridos cuya fuente publica la capacidad la
      declaran; los cuatro que no, no la declaran, y ninguno de los once
      declara autonomía eléctrica.
- [ ] La ficha completa muestra las filas «Autonomía eléctrica» y «Batería»
      dentro de «Mecánica y prestaciones», en ese orden y justo detrás de
      «Consumo», y renderiza veinticuatro magnitudes.
- [ ] La capacidad se muestra con dos decimales, de forma que 0,77 y 0,85
      kWh se distinguen en pantalla.
- [ ] El selector de orden ofrece las dos magnitudes bajo el grupo «Mecánica
      y prestaciones»; la autonomía ordena de mayor a menor y la capacidad
      de menor a mayor, y las entidades sin el dato quedan al final en las
      dos direcciones.
- [ ] Comparando contra un térmico —la referencia incluida—, la celda de
      autonomía de los enchufables se muestra como raya con texto accesible,
      no como `0`.
- [ ] Comparando un `EV` contra un `PHEV`, la Δ de autonomía es la
      diferencia en kilómetros, coloreada como mejor en el de más autonomía;
      la de capacidad no lleva color.
- [ ] El snapshot de `scoreCatalog` es **idéntico** antes y después del
      cambio, y ningún `AxisBreakdown` menciona la autonomía ni la batería.
- [ ] El conjunto «Esenciales» sigue mostrando exactamente sus seis campos.
- [ ] La skill `add-model` pide los dos datos con las reglas del requisito
      1.3 y del 2.3.
- [ ] `npm run test:coverage` sigue en 100 % en `domain/`, `data/` y
      `logging/`.

## Dependencias y supuestos

- **No hace falta ADR nuevo.** Un ADR registra una decisión estructural con
  alternativas; aquí no hay escala que calibrar porque no hay nota, y la
  decisión de fondo —que la autonomía no puntúa todavía— ya está tomada y
  escrita en `docs/roadmap.md` y en el *fuera de alcance* de `product/0005`.
  Esta spec la hereda, no la reabre.
- **Los datos son homologados, no reales.** El WLTP es optimista, y en
  autopista o en invierno la autonomía cae de forma apreciable. Se declara
  así porque es lo único publicado de forma comparable entre marcas, y quien
  lea la celda no debe entenderla como «lo que hará el coche», igual que ya
  ocurre con `consumption`, que sale del mismo ciclo y arrastra el mismo
  sesgo.
- **Por qué la autonomía de un híbrido convencional no entra hoy**, aun
  siendo la comparación que más se echa de menos entre once de los
  dieciocho candidatos: no existe cifra homologada por modelo, y las
  publicadas no comparten método. El requisito 1.3 deja la puerta abierta
  —el campo se admite en `HEV` y `MHEV`— y el 1.4 deja lista la marca que
  la distinguirá de una homologada el día que aparezca. Mientras tanto, la
  comparación entre híbridos la sostiene `batteryKwh`, que sí es
  homogénea.
- **Las invariantes de los requisitos 1.3 y 2.3 son cruzadas**, entre
  `technology` y cada campo, así que viven en un refinamiento del registro
  completo y no en el esquema del campo: un `SourcedNumber` no puede saber
  qué tecnología lo rodea.
- **La ficha pasa de veintidós campos a veinticuatro.** `POLARITY` es un
  `Record<FichaField, DeltaPolarity>`, así que TypeScript exige declarar la
  dirección de los dos campos nuevos en tiempo de compilación: ninguno puede
  quedarse sin polaridad por descuido. La cuenta de veintidós está escrita
  en varios sitios —`docs/estado/dominio.md`, `docs/estado/interfaz.md`,
  comentarios de `FichaPage.tsx` y de `ficha.ts`— y la consolidación tiene
  que recorrerlos todos.
- **Cuatro capacidades quedan sin declarar** —Civic e:HEV, CR-V e:HEV,
  NX 350h y CX-5— porque km77 responde «No disponible» para ellas. Se registra como
  deuda en `docs/roadmap.md`, con la condición de cierre habitual: que
  aparezca fuente publicada.
- **Los valores concretos no se congelan en esta spec.** No hay escala que
  anclar —a diferencia de `product/0017`—, así que el alta es alta de
  catálogo ordinaria y su sitio es el commit de implementación, con su
  fuente por registro.
- **Coches dados de alta mientras esta spec siga en `draft`** se añaden sin
  los campos, siguiendo el esquema vigente, y quedan como deuda de migración
  en `docs/roadmap.md` hasta que esta spec se implemente.

## Decisiones abiertas

Ninguna.
