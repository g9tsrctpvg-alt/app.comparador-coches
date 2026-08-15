# 0021 — En qué punto tecnológico está el coche: generación y retoque

- **Id:** product/0021
- **Estado:** consolidated
- **Tipo:** product
- **Fecha:** 2026-08-15
- **Specs relacionadas:** product/0013, product/0014, product/0017,
  product/0018, product/0020
- **ADRs relacionados:** 0009
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

> ⚠️ **Spec consolidada (2026-08-15).** Describe un cambio en el momento en
> que se redactó; su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy es histórica. Para el estado actual, ver
> `docs/estado/dominio.md` y `docs/estado/interfaz.md`. Vigentes aquí solo
> los **criterios de aceptación**, como registro de verificación.

## Contexto

Ni `Car` ni `Reference` declaran ninguna fecha. El catálogo describe cada
coche como si estuviera fuera del tiempo: mide su carrocería, su empuje, su
consumo y su precio, pero no dice de cuándo es el coche que se está midiendo.
Dos candidatos con las mismas cifras se leen igual aunque uno estrene
plataforma y el otro esté al final de su ciclo comercial.

**El dato ya se usa, pero a mano y en texto libre**, que es la señal de que
falta modelarlo:

- `lexus-nx-350h` lleva en `notes`: «Los NX de ~29.990 € son la primera
  generación (NX 300h), otro coche distinto» — la generación decidiendo qué
  precio es comparable, en prosa.
- Las fotos se justifican con la generación: «misma generación NX4 retocada,
  salpicadero equivalente entre HEV y PHEV» (`hyundai-tucson-phev`), «mismo
  acabado F Sport y generación AZ20» (`lexus-nx-350h`).
- `docs/roadmap.md` razona sobre el `hyundai-ioniq-5` con «mismo chasis NE1 y
  retoque 2024/2025».

Nada de eso es comparable entre coches ni aparece en la ficha: vive en
comentarios que solo lee quien abra el JSON.

**Donde más se nota es en la referencia.** El Alfa Romeo Giulietta es el
coche contra el que se compara todo (`product/0013`, `product/0018`), y su
plataforma es de otra década. Quien mira la ficha ve que un candidato tiene
80 mm más de maletero que la referencia, pero no ve que está comparando
contra un diseño de hace quince años — que es justo el contexto que explica
la mitad de las diferencias.

## Objetivo

Que el catálogo declare **de cuándo es el coche** —la generación a la que
pertenece y, si lo ha tenido, el retoque de mitad de ciclo que lleva la
versión que se compara—, y que ese dato se lea en la ficha junto al resto,
sin entrar en ninguna nota.

## Alcance

- **Un campo estructurado nuevo en `Car`**, `generation`, con el año de
  lanzamiento de la generación (obligatorio), el año del retoque (opcional) y
  el código de generación del fabricante (opcional).
- **El mismo campo en `Reference`**, que hasta hoy solo declara magnitudes
  dimensionales.
- **Dos filas nuevas en la ficha**, en un bloque propio, con Δ y polaridad
  `neutral`.
- **El alta del dato para todos los registros existentes** —los dieciséis de
  `cars.json`, publicados y despublicados, y la referencia— con fuente real
  citada.
- **La incorporación del campo a la skill `add-model`**, para que un coche
  nuevo no pueda darse de alta sin él.

## Fuera de alcance

- **Cualquier puntuación basada en el año.** Lo decide el ADR 0009: el dato
  se declara, se muestra y se compara, y no produce nota. Ni eje nuevo, ni
  sumando dentro de `fiabilidad`, ni penalización condicional.
- **El año de diseño del tren motriz.** Es una pregunta legítima y distinta
  —un motor de 2016 puede vivir en una carrocería de 2024—, pero no se
  publica de forma comparable por versión y mercado en las fuentes que este
  catálogo ya usa, y el proyecto no admite datos de memoria. Entra cuando
  exista fuente citable para los candidatos, en spec propia.
- **El año de matriculación o el «model year» de una unidad concreta.** Este
  catálogo compara modelos a la venta, no unidades; una unidad tiene
  matrícula, un modelo no.
- **Lo que el año aproxima**: nivel de ADAS y cumplimiento de la GSR2,
  arquitectura eléctrica de 400 u 800 V, generación del infoentretenimiento.
  Si alguna de esas importa, se mide, no se deduce de una fecha. El año es
  contexto, no un sustituto de esas magnitudes.
- **El conjunto «Esenciales» de la ficha** (`product/0020`), que sigue con
  sus seis campos. El punto tecnológico es contexto de lectura larga, no uno
  de los datos que deciden de un vistazo.
- **Los seis ejes, sus escalas, sus pesos y sus supuestos.** No se toca ni
  uno.

## Requisitos / comportamiento esperado

### 1. El dato

1.1. `Car` declara `generation`, **obligatorio**, con esta forma:
`launchYear` (dato con fuente, obligatorio), `faceliftYear` (dato con
fuente, opcional) y `code` (texto, opcional).

1.2. **`launchYear` es el año de la presentación oficial de la generación**
a la que pertenece el coche, por parte del fabricante. Cuando presentación y
comercialización caen en años distintos, manda la presentación: lo que el
dato quiere decir es cuándo se congeló la ingeniería, no cuándo llegó a
España. La etiqueta de la fuente puede mencionar la otra fecha.

1.3. **`faceliftYear` es el año del retoque de mitad de ciclo que lleva la
versión que el catálogo compara**, no el de cualquier actualización de
equipamiento. Si esa versión es anterior al retoque, o la generación no ha
tenido ninguno, el campo se omite.

1.4. **`code` es el código de generación del fabricante** cuando existe
(`NX4`, `NE1`, `AZ20`). Es el árbitro cuando hay duda entre «generación
nueva» y «retoque profundo»: si el fabricante mantiene el código, es
retoque; si lo cambia, es generación. Cuando no publica código, decide la
fuente citada y la duda se resuelve en la etiqueta de esa fuente.

1.5. **El esquema rechaza un `faceliftYear` anterior a `launchYear`**,
nombrando el campo. Es una invariante del dato, no una convención que
alguien deba recordar.

1.6. `Reference` declara `generation` con la misma forma y las mismas
reglas. Es una **excepción deliberada** a su regla de «solo identidad,
tecnología, fotos y cinco magnitudes dimensionales»: la referencia existe
para dar contexto, y de cuándo es el coche contra el que se compara todo es
precisamente contexto.

1.7. Todos los registros de `cars.json` —publicados y despublicados por
igual, porque un coche oculto sigue siendo un dato real del catálogo— y la
referencia llevan el dato con **fuente real citada**, nunca de memoria.

### 2. La ficha

2.1. La ficha declara dos campos nuevos, `generationLaunchYear` y
`generationFaceliftYear`, en un **bloque propio** encabezado «Generación»,
antes de «Tamaño y espacio».

2.2. **Los dos tienen polaridad `neutral`.** Más nuevo no está declarado
como mejor: una plataforma recién estrenada no es mejor que una rodada, y
este proyecto no ha decidido cuál de las dos cosas prefiere. Ante la duda
no se inventa un juicio de color, igual que con la altura o la batalla.

2.3. La Δ entre dos entidades es la diferencia en años, sin dirección de
color, y se muestra con el mismo formato que el resto de Δ.

2.4. **Un coche sin retoque deja su celda de retoque `missing`**, que la
ficha ya muestra como raya con texto accesible. No es un cero ni un hueco:
es que no ha habido retoque. Si es la entidad de comparación la que no lo
tiene, la Δ de las demás en esa fila queda `'unavailable'`, por la vía que
`product/0018` ya definió.

2.5. La ficha muestra el `code` junto al año de lanzamiento cuando el
registro lo declara, como texto de apoyo de la fila, no como columna propia
ni como dato comparable.

### 3. Lo que no cambia

3.1. **Ninguna nota de ningún coche cambia.** El desglose de los seis ejes
no menciona el año, ni como entrada, ni como supuesto, ni como `info`.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] `CarSchema` rechaza un registro sin `generation.launchYear`, nombrando
      el campo y el registro.
- [x] `CarSchema` rechaza un registro con `faceliftYear` anterior a
      `launchYear`, nombrando el campo; con `faceliftYear` igual o posterior,
      valida.
- [x] Un registro sin `faceliftYear` y sin `code` valida sin error.
- [x] `ReferenceSchema` exige `generation.launchYear` con las mismas reglas.
- [x] El snapshot de `scoreCatalog` es **idéntico** antes y después del
      cambio, y ningún `AxisBreakdown` menciona el año.
- [x] La ficha completa muestra el bloque «Generación» con sus dos filas para
      cada candidato y para la referencia.
- [x] Comparando contra una entidad que no declara retoque, la celda de
      retoque de las demás se muestra como raya con texto accesible, no como
      `0`.
- [x] La ficha ordenada y comparada sigue funcionando igual: los criterios de
      orden (`catalog`, `lengthMm`, `widthMm`, `priceEur`) no cambian.
- [x] Los dieciséis registros de `cars.json` y la referencia declaran
      `generation.launchYear` con una fuente citada y verificable por URL.
- [x] El conjunto «Esenciales» sigue mostrando exactamente sus seis campos.
- [x] La skill `add-model` pide el dato al dar de alta un coche.
- [x] `npm run test:coverage` sigue en 100% tras el cambio.

## Dependencias y supuestos

- **Depende del ADR 0009**, que se redacta con esta spec y decide que el
  calendario no entra en la puntuación. Sin él, la primera pregunta ante este
  campo —«¿y por qué no puntúa?»— no tendría respuesta escrita.
- **No toca el ADR 0004.** No hay escala nueva que calibrar, porque no hay
  nota.
- **Las dos decisiones que quedaban abiertas se cierran aquí**, y son el
  contenido real del gate humano:
  - *El año del tren motriz queda fuera* (ver «Fuera de alcance»), porque
    exigiría estimar donde el proyecto exige citar. El disparador para
    reabrirlo es que aparezca fuente publicada por versión y mercado.
  - *`Reference` sí declara el campo*, aun rompiendo su regla de «solo
    magnitudes dimensionales», porque el Giulietta de 2010 es el sitio donde
    este dato más informa.
- **Los valores concretos no se congelan en esta spec**, a diferencia de
  `product/0017`. Allí la tabla de candidatos era obligatoria porque de ella
  colgaban los anclajes de una escala; aquí no hay escala que calibrar, así
  que el alta de los dieciséis registros es alta de catálogo ordinaria y su
  sitio es el commit de implementación, con su fuente por registro.
- **La resolución del dato es el año, no el mes.** Una generación presentada
  en noviembre y comercializada en marzo siguiente declara el año de
  presentación (requisito 1.2); nadie debe leer el campo como una fecha
  exacta.
- **Frontera generación/retoque:** en algunos modelos la decide el marketing
  del fabricante antes que la ingeniería. El requisito 1.4 la resuelve con el
  código de generación como árbitro; donde no hay código, el criterio queda
  escrito en la etiqueta de la fuente de ese registro, que es donde se podrá
  auditar después.
- **Coches dados de alta mientras esta spec siga en `draft`** se añaden sin
  el campo, siguiendo el esquema vigente, y quedan como deuda de migración en
  `docs/roadmap.md` hasta que esta spec se implemente. Los dados de alta
  después de `approved` lo incluyen desde el alta.
- **La ficha pasa de veinte campos a veintidós.** `POLARITY` es un
  `Record<FichaField, DeltaPolarity>`, así que TypeScript exige declarar la
  dirección de los dos campos nuevos en tiempo de compilación: ninguno puede
  quedarse sin polaridad por descuido.

## Decisiones abiertas

Ninguna.
