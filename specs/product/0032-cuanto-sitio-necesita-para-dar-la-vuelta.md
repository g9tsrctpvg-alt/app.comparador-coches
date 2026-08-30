# 0032 — Cuánto sitio necesita para dar la vuelta

- **Id:** product/0032
- **Estado:** consolidated
- **Tipo:** product
- **Fecha:** 2026-08-30
- **Specs relacionadas:** product/0001, product/0002, product/0014,
  product/0017, product/0018, product/0020, product/0021, product/0026,
  product/0027, product/0028
- **ADRs relacionados:** 0004, 0010 (los dos, solo como motivo del *fuera de
  alcance*: puntuar esta magnitud exigiría anclar una escala con el criterio
  que fijan)
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

> ⚠️ **Spec consolidada (2026-08-30).** Describe un cambio en el momento en
> que se redactó; su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy es histórica. Para el estado actual, ver
> `docs/estado/dominio.md` y `docs/estado/interfaz.md`. Vigentes aquí solo
> los **criterios de aceptación**, como registro de verificación.

## Contexto

La ficha compara veinticuatro magnitudes y **ninguna dice cuánto sitio
necesita un coche para dar la vuelta**. Es la pregunta que contesta si un
candidato entra en un garaje, si se sale de un aparcamiento en línea sin
maniobrar tres veces y si se da la vuelta en una calle estrecha — y este
proyecto existe, según `product/0002`, porque los sustitutos que se comparan
son **más grandes** que el coche al que sustituyen.

Lo más cerca que la ficha llega hoy son tres proxies, y ninguno es la
medida:

- **Longitud y anchura** son las dos magnitudes que el eje `diario` puntúa
  (`src/domain/scoring/axes/diario.ts`) precisamente como sustitutos de
  «cabe y maniobra en ciudad». Dicen cuánto ocupa el coche parado, no cuánto
  barre al girar.
- **La batalla** está declarada y es `neutral` (`product/0018`, requisito
  3.3): más batalla es más espacio dentro y más coche fuera, y el proyecto no
  ha dicho cuál de las dos cosas le importa más. Es el factor que más manda
  en el diámetro de giro, pero no lo determina: el ángulo de giro de las
  ruedas y la dirección al eje trasero mueven el número entre coches de la
  misma batalla.

El resultado es que dos candidatos con la misma longitud pueden diferir en
más de un metro de diámetro de giro —una diferencia que se nota en cada
maniobra— y la ficha no lo dice **ni como dato bruto**. Quien compara lo
tiene que buscar coche a coche fuera de la aplicación, que es exactamente lo
que la ficha existe para evitar.

Hay además un aviso que esta spec hereda del propio catálogo. La **anchura de
hombros** entró sin fijar antes qué medía —km77 publica unas veces la mínima
y otras la máxima, y `cars.json` guardó la que diera cada ficha—, y hoy es
una deuda abierta (registrada el 2026-08-23) que contamina también los
anclajes que `product/0026` propuso para esa magnitud. El giro se publica de
al menos cuatro formas distintas —radio o diámetro, entre bordillos o entre
paredes—, con diferencias de metros entre ellas. **Repetir aquí el error de
recolectar primero y definir después sería peor**, porque la ficha resta
estas celdas entre sí.

## Objetivo

Que el catálogo declare **el diámetro de giro entre bordillos** de cada
coche, con fuente real y una sola definición para todos, y que se lea en la
ficha completa junto al resto de magnitudes: comparable, con Δ y ordenable.
Sin nota y sin eje.

## Alcance

- **Un campo nuevo en `Car`**: `turningCircleM`, el diámetro de giro entre
  bordillos en metros.
- **El mismo campo en `Reference`**, que hasta hoy solo declara identidad,
  generación, cuatro dimensiones y maletero.
- **Una fila nueva en la ficha completa**, dentro de «Tamaño y espacio»,
  justo detrás de «Batalla».
- **El alta del dato para los registros de hoy** —publicados y despublicados
  por igual, más la referencia— con fuente real citada, donde la fuente lo
  publique para la versión que el catálogo compara.
- **La incorporación del campo a la skill `add-model`**.

## Fuera de alcance

- **Que el giro puntúe.** Ningún eje lo lee, ningún peso cambia, ninguna
  nota de ningún coche se mueve. No es prudencia decorativa: meterlo en
  `diario` obliga a fijar dos anclajes con el criterio del ADR 0010 —los
  extremos del turismo generalista de venta al público— y a decidir qué peso
  relativo tiene frente a longitud y anchura, que hoy son sus proxies y
  seguirían estando. Eso es una spec de eje, con su propia calibración
  (`docs/proceso/calibracion-de-escalas.md`), y esta no lo es. **Se aplaza
  con disparador**, que se registra en `docs/roadmap.md`: que un candidato
  quede descartado de verdad por no maniobrar donde tiene que maniobrar.
- **El diámetro entre paredes** como segunda magnitud. Mide el barrido de
  las carrocerías —el voladizo y los retrovisores—, no el de las ruedas, y
  las fuentes lo publican para muchos menos modelos. Una magnitud más que la
  mayoría de fichas dejaría vacía, por el mismo motivo por el que
  `product/0028` declaró una sola capacidad de batería y no la bruta y la
  útil.
- **El radio de giro como campo propio.** Es la mitad del diámetro y no
  añade información; declarar los dos invita a que uno de ellos se rellene
  con el otro. Ver requisito 1.2.
- **La dirección al eje trasero** como campo declarado. Explica *por qué* un
  coche gira corto para su batalla, pero lo que se compara aquí es el
  resultado medido, no su mecanismo.
- **El número de vueltas de volante entre topes**, el ángulo de giro y el
  radio de giro con remolque.
- **El conjunto «Esenciales»** (`product/0020`), que sigue con sus seis
  campos.
- **Los seis ejes, sus escalas, sus pesos y sus supuestos.** No se toca ni
  uno.
- **La deuda de la anchura de hombros.** Esta spec la cita como precedente y
  toma la lección, pero no la cierra: sigue abierta con su condición.

## Requisitos / comportamiento esperado

### 1. La magnitud

1.1. `Car` declara `turningCircleM`, un dato con fuente (`SourcedNumber`) en
metros, con `unit: "m"`.

1.2. **Qué mide, exactamente:** el **diámetro** de giro **entre bordillos**
(el círculo que describen las ruedas), de la versión concreta que el catálogo
compara. No el radio, y no el diámetro entre paredes.

- Una fuente que publique **radio** entre bordillos sirve, y se convierte a
  diámetro multiplicando por dos; la etiqueta de la fuente **dice que la
  cifra publicada era el radio**, para que la conversión sea auditable y no
  una cuenta perdida.
- Una fuente que publique **solo entre paredes** no sirve para esta celda: se
  deja vacía. La diferencia entre las dos medidas es de metros y no es
  constante entre modelos, así que no se estima una a partir de la otra.
- El nombre del campo dice *circle*, no *radius*, a propósito: el campo se
  llama por lo que guarda.

1.3. **Quién lo declara:** cualquier coche, sea cual sea su tecnología. **No
hay invariante cruzada con `technology`** —a diferencia de `product/0028`—:
todo coche gira, y el dato no depende de cómo se mueva. El campo es
**opcional** en el esquema, como `batteryKwh`, y por el mismo motivo: la
fuente no lo publica para todos, y una celda vacía es mejor que un dato
inventado. Un coche sin fuente para su versión **deja la celda vacía**, y su
ausencia se registra como deuda en `docs/roadmap.md`.

1.4. **La versión importa.** El diámetro cambia dentro del mismo modelo con
el tamaño de llanta y con la dirección al eje trasero, así que la fuente
citada debe ser la de la versión que se puntúa, con su fecha, como el resto
del catálogo. Cuando la fuente no distinga versión, el dato se declara
`estimated: true` y la ficha lo marca con la tilde `~` que `product/0009` ya
fijó para todo valor estimado.

1.5. **Fuente preferida:** la ficha de datos de km77 de la versión, que
publica «diámetro de giro entre bordillos» con el mismo significado para
todas las marcas — la misma fuente y el mismo criterio de versión que ya usan
`consumption`, `batteryKwh` y la anchura de hombros. Cuando km77 no la
publique, vale la ficha técnica oficial del fabricante siempre que declare
cuál de las dos medidas da.

### 2. La referencia

2.1. **`Reference` declara también `turningCircleM`**, opcional, con el mismo
significado y las mismas reglas.

2.2. Es una excepción coherente con su regla, no una grieta en ella:
`ReferenceSchema` lleva «solo dimensiones» (`docs/estado/dominio.md`), y el
diámetro de giro es una dimensión. Sin él, la Δ de esta fila quedaría
`'unavailable'` para los dieciocho candidatos siempre que se comparen contra
la Giulietta, que es el modelo de comparación por defecto de la ficha — es
decir, la magnitud nueva nacería sin la mitad de su utilidad.

### 3. La ficha

3.1. La ficha declara una magnitud nueva, `turningCircleM`, en el bloque
**«Tamaño y espacio»**, **inmediatamente después de «Batalla»**. Se leen
juntas porque la batalla es el factor que más manda en el giro, y ponerlas
seguidas hace visible cuándo un coche gira corto o largo *para* su batalla.
La ficha pasa de veinticuatro magnitudes a veinticinco.

3.2. **Rótulo: «Diámetro de giro»**, no «Radio de giro». El rótulo dice lo
que la celda contiene; llamarlo radio y guardar el diámetro es la forma más
barata de reproducir el problema de la anchura de hombros en la interfaz en
vez de en los datos.

3.3. **Polaridad `moreIsWorse`.** Aquí sí hay una dirección que el proyecto
puede afirmar sin matices, y por eso no es `neutral` como la batalla: a
igualdad de todo lo demás, nadie prefiere necesitar más sitio para dar la
vuelta. La Δ se colorea como mejor cuando es negativa, y el orden pone
primero el más corto.

3.4. **Se muestra con un decimal**, la resolución con la que la fuente lo
publica (10,4 m; 11,8 m). Ni entero —que borraría diferencias reales de
medio metro— ni dos decimales, que fingirían una precisión que la fuente no
da.

3.5. Es **ordenable desde el mismo día**, sin lista aparte que mantener:
`FICHA_SORT_CRITERIA` se deriva de `FICHA_FIELDS` (`product/0027`), y el
`<optgroup>` que la rotula es el mismo bloque que rotula su fila. Las
opciones de «Orden» pasan de veinticinco a veintiséis.

3.6. **Un coche que no lo declara deja su celda `missing`**, que la ficha ya
muestra como raya con texto accesible. No es un cero. Si es la entidad de
comparación la que no lo declara, la Δ de las demás en esa fila queda
`'unavailable'`, por la vía que `product/0018` ya definió.

3.7. El conjunto «Esenciales» sigue mostrando exactamente sus seis campos.

### 4. Lo que no cambia

4.1. **Ninguna nota de ningún coche cambia.** El desglose de los seis ejes no
menciona el diámetro de giro, ni como entrada, ni como supuesto, ni como
`info`.

4.2. **`ViewState` no cambia de versión.** `SortCriterionSchema` es
`z.enum(FICHA_SORT_CRITERIA)`: añadir un campo solo ensancha el enum, así que
todo estado guardado antes de esta spec se sigue restaurando sin migración
(`product/0024`).

4.3. **El enlace compartible no cambia de forma.** Lleva `AppConfig`, que no
toca ninguna magnitud de la ficha.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] `CarSchema` acepta un registro con `turningCircleM` y otro sin él, en
      las cinco tecnologías: el campo es opcional de verdad y no tiene
      invariante cruzada con `technology`.
- [x] `CarSchema` valida `turningCircleM` como `SourcedNumber` —rechaza un
      registro con dos fuentes vigentes, o con un `value` que no coincide con
      el de la fuente vigente—, igual que cualquier otra magnitud.
- [x] `ReferenceSchema` acepta la referencia con `turningCircleM` y sin él.
- [x] Todo registro de `cars.json` y `references.json` que declare el campo
      cita una fuente verificable por URL, con fecha y versión, y esa fuente
      publica **diámetro entre bordillos** o un **radio** entre bordillos
      cuya conversión queda dicha en la etiqueta.
- [x] Ningún registro cuya única fuente publique el diámetro **entre
      paredes** declara el campo.
- [x] La ficha completa muestra la fila «Diámetro de giro» dentro de «Tamaño
      y espacio», justo detrás de «Batalla», y renderiza veinticinco
      magnitudes.
- [x] El valor se muestra con un decimal y la unidad `m`.
- [x] El selector de orden ofrece la magnitud bajo el grupo «Tamaño y
      espacio» y renderiza veintiséis `<option>`; ordena de menor a mayor, y
      las entidades sin el dato quedan al final en las dos direcciones.
- [x] Comparando contra un modelo que declara el dato, la Δ es la diferencia
      en metros, coloreada como mejor en el que gira más corto; comparando
      contra uno que no lo declara, la celda se muestra como raya con texto
      accesible, no como `0`.
- [x] El snapshot de `scoreCatalog` es **idéntico** antes y después del
      cambio, y ningún `AxisBreakdown` menciona el diámetro de giro.
- [x] El conjunto «Esenciales» sigue mostrando exactamente sus seis campos.
- [x] Un `ViewState` guardado con la versión anterior se restaura sin
      migración, con su `sortCriterion` intacto, y `VIEW_STATE_VERSION` no
      cambia.
- [x] La skill `add-model` pide el dato con las reglas de los requisitos 1.2
      a 1.5, y su cuenta de magnitudes sube de 22 a 23.
- [x] `npm run test:coverage` sigue en 100 % en `domain/`, `data/` y
      `logging/`.

## Dependencias y supuestos

- **No hace falta ADR nuevo.** Un ADR registra una decisión estructural con
  alternativas; aquí no hay escala que calibrar porque no hay nota. La
  decisión que sí sería estructural —que el giro puntúe— queda fuera de
  alcance y, cuando se tome, se toma con el criterio del ADR 0010 ya escrito:
  esta spec no lo reabre.
- **La lección de la anchura de hombros es la razón de ser del requisito
  1.2.** Aquella magnitud entró mezclando la medida mínima con la máxima
  porque nadie fijó cuál antes de recolectar, y hoy es deuda abierta que
  llega hasta los anclajes propuestos por `product/0026`. Aquí la definición
  va **antes** que el dato, y un registro cuya fuente no permita saber qué
  medida publica se queda vacío.
- **Que la fuente sea desigual es lo esperado, no un imprevisto.** El campo
  es opcional justamente por eso; el precedente es `batteryKwh`, que quedó
  sin declarar en cuatro registros y se registró como deuda en vez de
  rellenarse por semejanza.
- **El dato es una medición del fabricante, no una medida propia.** Vale lo
  que valga esa fuente, igual que `consumption` vale lo que vale el ciclo
  WLTP. La conversión de radio a diámetro es la única aritmética que esta
  spec admite sobre el valor publicado, y queda escrita en la etiqueta.
- **La ficha pasa de veinticuatro campos a veinticinco.** `POLARITY` es un
  `Record<FichaField, DeltaPolarity>`, así que TypeScript exige declarar la
  dirección del campo nuevo en tiempo de compilación: no puede quedarse sin
  polaridad por descuido. La cuenta de veinticuatro está escrita en varios
  sitios —`docs/estado/dominio.md`, `docs/estado/interfaz.md`, comentarios de
  `FichaPage.tsx` y de `ficha.ts`—, y la consolidación tiene que recorrerlos
  todos.
- **`Reference` gana su primer campo desde `product/0021`.** Sigue sin ser un
  candidato: no se puntúa, no entra en `scoreCatalog` y su tipo la mantiene
  fuera por construcción.
- **Los valores concretos no se congelan en esta spec.** No hay escala que
  anclar —a diferencia de `product/0017`—, así que el alta es alta de
  catálogo ordinaria y su sitio es el commit de implementación, con su fuente
  por registro.
- **Coches dados de alta mientras esta spec siga en `draft`** se añaden sin
  el campo, siguiendo el esquema vigente, y quedan como deuda de migración en
  `docs/roadmap.md` hasta que esta spec se implemente.

## Decisiones abiertas

Ninguna.
