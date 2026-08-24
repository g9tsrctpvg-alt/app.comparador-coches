# 0028 — La carga en casa llega al híbrido enchufable

- **Id:** product/0028
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-24
- **Specs relacionadas:** product/0002, product/0003, product/0008
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/dominio.md`

## Contexto

El panel de supuestos pregunta **«¿tienes carga en casa?»**. El código
pregunta otra cosa: `car.technology === 'EV'`. La condición está escrita a
mano en dos sitios —`diario.ts:34`, que dispara la penalización de −1,5
puntos, y `coste.ts:41`, que decide si la energía se cobra a €/kWh o a €/l— y
en ninguno de los dos dice «tiene enchufe».

Medido sobre el catálogo de dieciséis coches, marcar la casilla mueve **solo
a los cinco eléctricos**, +4,50 puntos cada uno (1,5 × peso 3 de `diario`).
`bmw-x1-xdrive25e` y `hyundai-tucson-phev` no se mueven ni una décima. El
coche al que la pregunta más le cambia la vida —sin enchufe en casa un
enchufable es un híbrido que arrastra una batería que no usa; con enchufe
hace los diarios en eléctrico— es el único al que no le cambia nada.

Debajo hay un segundo problema, de datos. El campo `consumption` guarda hoy
magnitudes distintas para los dos enchufables:

| Coche | `consumption` | Qué es en realidad |
| --- | --- | --- |
| `hyundai-tucson-phev` | 2,7 l/100 km | WLTP combinado: **una cifra que ya supone que cargas** |
| `bmw-x1-xdrive25e` | 7,5 l/100 km (`estimated`) | Consumo con la batería vacía |

El eje `coste` los suma como si fueran lo mismo: al Tucson le salen 71 €/mes
de coste de uso y al X1 208 €/mes, sobre una escala que satura en 100 y en
250 €/mes. Los dos están mal, en direcciones opuestas, y la diferencia vale
tres puestos de clasificación.

Y no hay con qué arreglarlo: el catálogo no guarda ni la capacidad de la
batería ni el consumo en modo eléctrico, así que hoy es imposible repartir
los kilómetros entre modo térmico y modo eléctrico.

`product/0008` dejó la condición `=== 'EV'` de forma deliberada y lo declaró
en el desglose. Deliberado no es lo mismo que correcto.

## Objetivo

Que la respuesta a «¿tienes carga en casa?» cambie la nota de un híbrido
enchufable, en las dos cosas en las que de verdad le cambia: lo que cuesta
moverlo y lo cómodo que es vivir con él.

## Alcance

- **Un único predicado de dominio** que responda «¿este coche se enchufa?»,
  usado por los dos ejes en vez de repetir `=== 'EV'` en cada uno.
- **El coste de uso de un `PHEV`**, que pasa a repartir los kilómetros del
  año entre modo eléctrico y modo térmico según haya o no carga en casa.
- **La penalización de `diario`**, que pasa a alcanzar también al `PHEV`, con
  importe propio.
- **Dos magnitudes nuevas en el catálogo** —capacidad útil de la batería y
  consumo en modo eléctrico—, obligatorias para un `PHEV` y ausentes en el
  resto.
- **La definición de `consumption` para un `PHEV`**, que pasa a ser el
  consumo en modo híbrido con la batería vacía, y el refuenteo de los dos
  enchufables del catálogo contra esa definición.

## Fuera de alcance

- **El precio del kWh.** `precioKwh` sigue siendo un único deslizador que
  mueve el usuario, con 0,45 €/kWh por defecto. Que la carga doméstica sea
  más barata que la pública es cierto y hoy el modelo no lo distingue, pero
  eso mueve también a los cinco eléctricos y es otro cambio: queda como deuda
  en `docs/roadmap.md`, no aquí.
- **La nota de los eléctricos.** Un `EV` puntúa exactamente igual que antes
  de esta spec, con la casilla marcada y sin marcar. La penalización de −1,5
  no cambia de importe ni de condición.
- **`ICE`, `MHEV` y `HEV`.** No se enchufan, no tienen batería que cargar y
  su nota no cambia en ningún eje.
- **Los otros cuatro ejes.** `viaje`, `prestaciones`, `fiabilidad` y
  `estetica` no leen la tecnología y siguen sin leerla.
- **Los anclajes de escala.** Ni los de `coste` (25.000/47.000 € y
  100/250 €/mes) ni los de ningún otro eje. Los fija `product/0026` bajo el
  ADR 0010 y esta spec no los reabre: cambia qué número entra en la escala,
  no dónde está la escala.
- **Mostrar las magnitudes nuevas.** La ficha «Completa» sigue enseñando sus
  veintidós magnitudes (`product/0027`). La batería y el consumo eléctrico
  entran en el modelo de coste, no en la tabla.
- **Un deslizador nuevo.** La fracción de kilómetros que un enchufable hace
  en eléctrico **se deriva** de sus datos y de `kmPorAnio`; no se añade
  ningún supuesto global que el usuario pueda mover.
- **La autonomía eléctrica como magnitud puntuada.** No entra en ninguna
  nota por sí misma: solo se usa para repartir kilómetros dentro de `coste`.
- **Dar de alta el Tonale PHEV** ni ningún otro coche. El catálogo sigue
  teniendo los dos enchufables que tiene.

## Requisitos / comportamiento esperado

1. **Una sola pregunta, un solo sitio.** El dominio declara un predicado
   `isPlugIn(car)`, cierto para `EV` y `PHEV` y falso para el resto. `diario`
   y `coste` lo usan; ninguno de los dos vuelve a escribir `=== 'EV'` por su
   cuenta para preguntar si el coche se enchufa. Donde la distinción real sea
   *eléctrico puro* y no *enchufable* —el reparto de kilómetros del requisito
   4— se dice explícitamente y no se disfraza de predicado.

2. **Dos magnitudes nuevas, obligatorias solo para el enchufable.**
   `CarSchema` gana `batteryUsableKwh` (kWh, capacidad **útil**, no bruta) y
   `electricConsumption` (kWh/100 km, consumo en modo eléctrico con las
   pérdidas de recarga incluidas). Son opcionales en el esquema y la
   validación **las exige cuando `technology` es `PHEV`**; un coche que no es
   `PHEV` que las declare es un error de validación igual de duro. Ambas son
   `SourcedNumber` y cumplen las reglas de fuente de siempre.

3. **`consumption` de un `PHEV` es el consumo en modo híbrido.** Queda
   definido como el consumo **con la batería vacía**, que es lo que km77
   publica como «consumo híbrido» y describe como «una utilización del coche
   sin carga en la batería». No es el WLTP combinado, que para un enchufable
   supone un patrón de carga y por tanto ya respondería la pregunta que esta
   spec quiere hacerle al usuario. Los dos enchufables del catálogo se
   refuentean contra esa definición, con `discardedReason` en la fuente que
   se sustituya.

4. **El reparto de kilómetros.** Para un `PHEV`, los kilómetros del año se
   parten así, sin números escondidos:

   4.1. `autonomiaReal = 100 × batteryUsableKwh / electricConsumption`. Sale
   de los dos datos publicados y no necesita ningún factor de corrección
   inventado: el consumo eléctrico ya es el real y ya incluye las pérdidas de
   recarga.

   4.2. `kmDiarios = kmPorAnio × (1 − CUOTA_VIAJE)`, con `CUOTA_VIAJE = 0,25`
   declarada como constante razonada, no como supuesto editable: una cuarta
   parte del año son trayectos largos que ninguna batería de enchufable cubre
   —y son justo los kilómetros que el WLTP combinado se salta—. El resto es
   uso diario, que sí sale cada mañana con la batería llena si hay enchufe en
   casa.

   4.3. `fraccionDiariaElectrica = min(1, autonomiaReal / (kmDiarios / 365))`.
   Un enchufable con más autonomía de la que gasta en un día hace el día
   entero en eléctrico y no más; uno con menos, la parte proporcional.

   4.4. `kmElectricos = cargaEnCasa ? kmDiarios × fraccionDiariaElectrica : 0`.
   **Sin carga en casa, cero**: el modelo no supone que nadie planifique su
   vida alrededor de un cargador público para un coche que no lo necesita.

5. **Una fórmula de energía, tres casos.** El coste de uso pasa a calcularse
   con un único reparto, del que los casos de hoy son el extremo:

   ```text
   energiaAnual = (kmElectricos / 100) × consumoElectrico × precioKwh
                + ((kmPorAnio − kmElectricos) / 100) × consumoTermico × precioLitro
   ```

   5.1. `EV`: `kmElectricos = kmPorAnio`, `consumoElectrico = consumption`.
   Idéntico al resultado de hoy, hasta el céntimo.

   5.2. `ICE`, `MHEV`, `HEV`: `kmElectricos = 0`,
   `consumoTermico = consumption`. Idéntico al resultado de hoy.

   5.3. `PHEV`: el reparto del requisito 4, con `consumoElectrico =
   electricConsumption` y `consumoTermico = consumption`.

6. **La penalización de `diario` alcanza al enchufable, con importe propio.**
   Sin carga en casa: **−1,5 para un `EV`** (como hoy) y **−0,75 para un
   `PHEV`**. La mitad, y la razón se escribe: al eléctrico sin enchufe le va
   la viabilidad; al enchufable sin enchufe solo le va la comodidad, porque
   el coche sigue funcionando sin cargarlo nunca. Con carga en casa, ninguno
   de los dos penaliza.

7. **El desglose lo declara, como siempre.** Ningún número aparece sin decir
   de dónde sale:

   7.1. La línea de penalización de `diario` muestra su condición y su efecto
   real para cada tecnología, activa o no, como ya hace hoy.

   7.2. El bloque `info` de `coste` de un `PHEV` declara el reparto aplicado:
   autonomía real, kilómetros en eléctrico y kilómetros en térmico. Para el
   resto de tecnologías sigue declarando qué precio unitario se ha aplicado y
   por qué, como hoy.

   7.3. La descripción de la fórmula de `coste` refleja el reparto, y no
   sigue diciendo que la energía se cobra a un único precio unitario.

8. **La casilla se nota.** Con el catálogo real, marcar y desmarcar «carga en
   casa» cambia la nota total de los dos enchufables. Es la comprobación de
   que el fallo que motiva la spec ha dejado de existir.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `isPlugIn` es cierto para `EV` y `PHEV`, falso para `ICE`, `MHEV` y
      `HEV`, y ni `diario.ts` ni `coste.ts` contienen ya la comparación
      `technology === 'EV'` para preguntar si el coche se enchufa.
- [ ] La validación rechaza un `PHEV` sin `batteryUsableKwh` o sin
      `electricConsumption`, y rechaza un no-`PHEV` que declare cualquiera de
      las dos. `car.test.ts`.
- [ ] Los dos enchufables del catálogo declaran las dos magnitudes nuevas con
      fuente publicada y no estimada, y su `consumption` es el consumo en
      modo híbrido, con `discardedReason` en la fuente sustituida.
- [ ] Con `cargaEnCasa` en `false` y luego en `true`, la nota total de
      `bmw-x1-xdrive25e` y de `hyundai-tucson-phev` **cambia** en los dos
      casos. `scoreCatalog.snapshot.test.ts`.
- [ ] Sin carga en casa, `kmElectricos` es exactamente 0 para un `PHEV`, y su
      coste de uso coincide con el de calcular todo el año a `consumption`
      por `precioLitro`. `coste.test.ts`.
- [ ] Con carga en casa, un `PHEV` cuya autonomía real supera los kilómetros
      de un día medio hace en eléctrico exactamente `kmPorAnio × 0,75`, ni
      uno más. `coste.test.ts`.
- [ ] La nota de los cinco `EV` y la de los nueve `ICE`/`MHEV`/`HEV` es la
      misma que antes de esta spec, con la casilla marcada y sin marcar.
      Comprobado contra los totales vigentes en
      `scoreCatalog.snapshot.test.ts`.
- [ ] La línea de penalización de `diario` de un `PHEV` sin carga en casa
      está activa con efecto −0,75; con carga en casa, inactiva con efecto 0.
      `diario.test.ts`.
- [ ] El `info` de `coste` de un `PHEV` declara autonomía real, kilómetros
      eléctricos y kilómetros térmicos; el de un `EV` y el de un `HEV` sigue
      declarando el precio unitario aplicado. `coste.test.ts`.
- [ ] La CI entera pasa en local: `format:check`, `lint`, `typecheck`,
      `arch:check`, `test:coverage` con el suelo del 100 %, `markdownlint` y
      `build`.

## Dependencias y supuestos

- **La fuente publica lo que hace falta.** km77 publica en la ficha de datos
  de un enchufable la capacidad de batería y su capacidad **útil**, la
  autonomía eléctrica WLTP y un bloque de consumo estimado que separa
  explícitamente **eléctrico** e **híbrido**, definiendo el segundo como el
  del coche «sin carga en la batería». Comprobado el 2026-08-24 contra la
  ficha del `bmw-x1-xdrive25e`: 16,3 kWh de capacidad, 14,2 kWh útiles,
  83 km de autonomía WLTP. La ficha del Tucson PHEV se localiza en la
  implementación.
- **`CUOTA_VIAJE = 0,25` es una constante razonada, no medida.** Sale del
  mismo sitio que los anclajes: un número argumentado por escrito y revisable
  en un commit. Si algún día se mide el reparto real de kilómetros de este
  usuario, se corrige ahí y se nota en los dos enchufables por igual.
- **El efecto sobre `coste` queda amortiguado por `precioKwh`.** Con
  0,45 €/kWh —precio de carga pública— el kilómetro eléctrico sale a
  ~0,09 € y el térmico a ~0,12 €: la diferencia existe pero es pequeña. El
  cambio de esta spec sigue siendo correcto con cualquier precio; que el
  precio por defecto no distinga carga doméstica de pública es la deuda
  registrada aparte, y es lo que decide cuánto se nota.
- **La resolución de los datos nuevos.** El consumo eléctrico estimado se
  publica con un decimal y la capacidad útil con uno: la autonomía real
  derivada no tiene más precisión que eso y no debe leerse como exacta.
- **`product/0008` queda parcialmente superado, no anulado.** Su requisito de
  que la tecnología gobierne el precio unitario de la energía sigue vigente;
  lo que cambia es que dejar fuera al `PHEV` deja de ser correcto.

## Decisiones abiertas

Ninguna.
