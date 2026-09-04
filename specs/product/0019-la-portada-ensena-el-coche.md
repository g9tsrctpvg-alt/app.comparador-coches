# 0019 — La portada enseña el coche

- **Id:** product/0019
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-09-04
- **Specs relacionadas:** product/0009, product/0014, product/0016, product/0022, product/0025, product/0035
- **ADRs relacionados:** ninguno
- **Doc de estado:** `docs/estado/interfaz.md`

## Contexto

La portada —la ruta por defecto, «Clasificación»— se compone hoy de un
título, la tarjeta del líder (`LeaderCard`: rótulo, nombre y porcentaje), la
columna de controles y la clasificación, que desde `product/0022` reparte los
coches entre tres tarjetas de podio y las filas del resto. **No hay una sola
imagen en toda la pantalla.** La primera vez que la aplicación enseña un
coche es en `#/ficha`, a dos clics: quien entra ve nombres, cifras y barras
de una lista de dieciocho candidatos, y ninguno de ellos tiene cara.

El catálogo sí tiene las fotos: 87 imágenes declaradas sobre 21 coches, con
su `credit` y su `shows` obligatorios desde `product/0014` y con los orígenes
aceptables que fijó `product/0016`. De los dieciocho publicados, **diecisiete
declaran `front`**; el único que no es el Citroën C5 Aircross, que solo trae
`side` e `interior`.

Hoy esas fotos se pintan en **tres sitios con tres tratamientos distintos**:

1. **`PhotoBox`** (cabecera de columna de la ficha, `product/0014`): relación
   de aspecto 4/3, `object-fit: contain`, y degradación al mismo hueco
   rotulado tanto si la foto no existe como si su `src` falla —guarda la
   `src` fallida, no un booleano, para no quedarse en modo hueco al cambiar
   de vista—.
2. **`PhotoCarousel`** (la ampliación de `product/0025`): la misma imagen con
   `credit` y `shows` de pie, y una lista de `src` fallidas porque allí se
   cambia de foto sin desmontar nada.
3. **El cara a cara de `CalibrationDialog`** (`product/0035`): lee
   `entity.photos.front` **directamente**, sin `onError` y sin alternativa
   cuando ese coche no declara frontal. Efecto real, comprobable hoy: con el
   C5 Aircross entre los elegibles, la tanda de calibración enseña «Sin foto»
   de un coche que tiene dos, y una URL caída deja el icono de imagen rota
   que los otros dos sitios sí evitan.

El `roadmap` lleva esta entrega abierta desde que se abrió la fase 5, y a
propósito sin redactar: enseñar la foto **cambia qué información muestra la
portada**, así que es producto y no cabía en `technical/0005`. Es la única
tarea de la fase sin spec, y la que la mantiene abierta.

## Objetivo

Que la portada enseñe el coche: que la tarjeta del líder y la fila desplegada
de la clasificación muestren una foto del modelo con su crédito, y que toda
la aplicación pinte una foto de la misma manera y con la misma degradación.

## Alcance

- **La tarjeta del líder** (`LeaderCard`): pasa a enseñar una foto del coche
  que encabeza la clasificación con los pesos vigentes, con su crédito.
- **La fila desplegada de la clasificación** (`RankingRow`, contenido
  desplegado): pasa a enseñar una foto del coche desplegado, con su crédito,
  igual en el podio y en el resto.
- **Qué foto representa a un coche cuando la elige la aplicación**: una
  función de dominio, `coverPhoto`, hermana de `photoSequence`.
- **Un único componente de presentación de foto** en `src/ui/`, con la
  degradación de `PhotoBox` dentro, consumido por los dos sitios nuevos, por
  el cara a cara de la calibración y por la propia miniatura de la ficha.
- **El cara a cara de la calibración**, solo en lo que toca a la foto: qué
  foto elige y cómo degrada.

## Fuera de alcance

- **Fotos en la fila plegada** —ni en las tres tarjetas del podio ni en las
  filas del resto—. Serían hasta dieciocho imágenes externas en el primer
  pintado, y la clasificación dejaría de leerse de un vistazo, que es
  exactamente lo que `product/0009` y `product/0022` construyeron. La foto
  aparece donde ya hay una decisión tomada: el líder, o la fila que alguien
  ha abierto a propósito.
- **Ampliar la foto desde la portada.** El diálogo y el recorrido entre
  vistas de `product/0025` siguen siendo de la ficha. En la portada la foto
  no es un control: no se pulsa, no abre nada.
- **El selector de vista de la ficha y su regla.** Allí manda la vista
  elegida por quien mira, y un modelo que no la declara enseña el hueco
  rotulado (`product/0014`, requisito 4): `coverPhoto` **no** se aplica en la
  tabla de la ficha, porque sustituir allí una vista por otra rompería la
  comparación —la tira de cabeceras enseña siempre lo mismo de cada coche—.
- **La sección de coches no elegibles** (`IneligibleRow`) y la hoja de visita
  (`product/0037`). Ninguna de las dos cambia.
- **Cualquier puntuación, fórmula, peso, supuesto u orden.** Ni la
  clasificación ni el desglose cambian una cifra.
- **Tokens, primitivos, colores, tipografías o dependencias nuevas.** Se
  construye con lo que `technical/0004`, `technical/0011` y `technical/0012`
  ya declararon.
- **Persistencia.** Nada de lo que esta spec añade se guarda ni viaja en el
  enlace compartible (`product/0012`, `product/0024`).
- **La deuda de fotos del catálogo** —los maleteros que faltan y el frontal
  del C5 Aircross—. Esta spec no añade ni corrige ninguna foto: se apoya en
  las que hay, y el C5 Aircross es justamente el caso que ejercita la
  alternativa del requisito 1.

## Requisitos / comportamiento esperado

### 1. Qué foto representa a un coche

1.1 `coverPhoto(photos)` se declara en `src/domain/photo.ts`, junto a
`photoSequence`: devuelve `photos.front`; si no existe, la primera vista que
el modelo declare en el orden canónico de `PHOTO_VIEWS`; y si no hay ninguna,
`undefined`. Devuelve también **qué vista** ha elegido, porque el texto
alternativo y el rótulo del hueco la nombran.

1.2 Es el **único** sitio que decide qué foto representa a un coche. La
interfaz no vuelve a leer `photos.front` por su cuenta en ningún componente.

1.3 Se usa solo donde **la aplicación** elige la foto: la tarjeta del líder,
la fila desplegada y el cara a cara de la calibración. Donde elige la
persona —la tabla de la ficha— no se usa (ver *Fuera de alcance*).

### 2. Una sola manera de pintar una foto

2.1 Un componente propio en `src/ui/components/` recibe la foto, el nombre
del coche y la vista, y pinta la imagen con relación de aspecto 4/3 y
`object-fit: contain` —las mismas que la ficha usa hoy—, con el texto
alternativo «`<nombre>`, vista `<vista>`».

2.2 Degrada al **hueco rotulado** —el mismo texto y la misma caja que hoy
enseña `PhotoBox`, con el nombre del coche en texto solo para lector de
pantalla— en los dos casos: cuando no hay foto y cuando la `src` declarada
falla al cargar (`onError`). Guarda la `src` fallida, no un booleano, por el
motivo que `product/0014` ya documentó.

2.3 **La lógica de degradación existe una sola vez** en `src/ui/`. Tras esta
spec la consumen cuatro sitios: la tarjeta del líder, la fila desplegada, el
cara a cara de la calibración y la miniatura de la ficha. `PhotoCarousel`
mantiene su lista de `src` fallidas —es un caso distinto, sin desmontaje— y
no se toca.

2.4 El componente **no es interactivo**: quien lo usa decide si lo envuelve
en un control. La ficha lo envuelve en el botón que abre la ampliación; la
portada no lo envuelve en nada.

### 3. La tarjeta del líder

3.1 Enseña la foto de portada (requisito 1) del coche que encabeza la
clasificación con los pesos vigentes, junto al rótulo, el nombre y el
porcentaje que ya enseña.

3.2 Composición: por debajo de `--bp-columna`, la foto ocupa el ancho de la
tarjeta, encima del bloque de texto; por encima, va a la izquierda, con el
nombre y el porcentaje en la misma línea de siempre y sin ocupar más de un
tercio del ancho de la tarjeta. El porcentaje no cambia de sitio, de tamaño
ni de papel tipográfico.

3.3 Sigue siendo **la única superficie invertida de la interfaz**
(`product/0009`, requisito 6): la foto no introduce una segunda superficie ni
una tarjeta anidada.

3.4 Sin líder —lista vacía por presupuesto o por imprescindibles— no se
renderiza la tarjeta, como hoy: tampoco un hueco de foto.

3.5 Es la única imagen que la portada pide antes de cualquier interacción, y
por eso **no** se marca `loading="lazy"`.

### 4. El crédito viaja con la foto

4.1 Bajo cada foto de la portada se lee una línea con `shows` y `credit` —el
mismo contenido que la ficha enseña como pie de la foto ampliada—, en marcado
`<figure>` / `<figcaption>`.

4.2 Es obligatorio y no decorativo: en la ficha el crédito se alcanza
abriendo la foto, y en la portada no hay ampliación (fuera de alcance), así
que un crédito que no se ve es un crédito que no se alcanza. `product/0016`
existe para que quien lea la aplicación dentro de un año pueda reconstruir de
dónde salió cada imagen.

4.3 **Se descarta enlazar a la ficha en vez de escribir el crédito:**
`#/ficha` no abre por un coche concreto, así que el enlace no llevaría a la
foto que se estaba mirando.

4.4 Sobre la superficie invertida el crédito usa `--color-mute-on-ink`, el
papel que esa tarjeta ya usa para su rótulo. Ningún color nuevo.

### 5. La fila desplegada de la clasificación

5.1 El contenido desplegado de una fila empieza por la foto de portada de ese
coche con su crédito, antes de la línea de decisión. Igual en el podio y en
el resto: es el mismo contenido desplegado, que ya vive una sola vez.

5.2 La fila **plegada** no cambia en nada: ni la posición, ni el nombre, ni
la línea de apoyo, ni la marca de decisión, ni la puntuación, ni la barra.

5.3 El nombre accesible del control de despliegue y su `aria-expanded` no
cambian (`product/0022`, requisito 4): la foto vive dentro del contenido
desplegado, no dentro del botón.

5.4 Sin `rawCar` no hay foto ni hueco, igual que hoy no hay línea de apoyo.

5.5 Estas imágenes sí se marcan `loading="lazy"`: se piden al desplegar la
fila, no antes.

### 6. El cara a cara de la calibración

6.1 Pasa a elegir su foto con `coverPhoto` y a pintarla con el componente del
requisito 2. Deja de leer `photos.front` y deja de tener marcado de foto
propio.

6.2 Efecto medible: el C5 Aircross deja de enseñar «Sin foto» en la tanda de
calibración y enseña su lateral; y una `src` que falla degrada al hueco
rotulado en vez de dejar el icono de imagen rota.

6.3 Nada más del diálogo cambia: ni qué magnitudes enseña, ni el orden de los
pasos, ni la regla de que **ninguna cifra del modelo** aparece en el cara a
cara.

### 7. Lo que no se mueve

7.1 La portada carga **exactamente una** imagen externa antes de cualquier
interacción.

7.2 Ni la clasificación, ni el desglose por eje, ni el reparto de la
diferencia, ni el estado de decisión cambian de comportamiento.

7.3 La interfaz sigue sin calcular: ninguna importación nueva desde `src/ui/`
hacia `src/domain/scoring/`.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `coverPhoto` devuelve `front` cuando existe, la primera vista del orden
      canónico cuando no, y `undefined` cuando el coche no declara ninguna.
      Test de dominio con los tres casos, incluido el real: el C5 Aircross
      resuelve a `side`.
- [ ] Con el catálogo real y los pesos por defecto, la portada renderiza la
      foto del líder (Tucson HEV, vista frontal) dentro de la tarjeta del
      líder, con su `alt` nombrando al coche y a la vista. Test sobre el
      marcado de `App`.
- [ ] La tarjeta del líder enseña, bajo la foto, el `shows` y el `credit` de
      esa foto, con el mismo texto que la ficha usa de pie. Test sobre el
      marcado.
- [ ] Desplegar una fila del podio y una fila del resto renderiza en cada
      caso la foto de ese coche con su crédito; con la fila plegada no hay
      ninguna imagen en el marcado de esa fila. Test sobre el marcado de
      `RankingList` en los dos estados.
- [ ] El nombre accesible del control de despliegue y su `aria-expanded`
      siguen dando exactamente lo mismo que hoy en las dos partes de la
      lista: el test de `product/0022` sigue en verde sin tocarlo.
- [ ] Un coche sin la vista elegida y una `src` que falla degradan al mismo
      hueco rotulado en los cuatro consumidores. Test del componente con
      foto ausente y con `onError` disparado.
- [ ] Revisión de código: `photos.front` no se lee en ningún componente de
      `src/ui/`; la única lectura vive en `coverPhoto`. Comprobado con una
      búsqueda en `src/ui/` que no devuelve ninguna coincidencia.
- [ ] Revisión de código: la degradación de foto ausente o fallida existe una
      sola vez en `src/ui/`; `CalibrationDialog` no conserva marcado de foto
      propio ni su placeholder «Sin foto».
- [ ] En la tanda de calibración con el catálogo real, el C5 Aircross se
      enseña con su lateral y no con «Sin foto». Test sobre el marcado del
      diálogo.
- [ ] La puntuación de los coches publicados es idéntica antes y después:
      `scoreCatalog.snapshot.test.ts` y `scoreGap.snapshot.test.ts` siguen en
      verde **sin modificar un solo valor esperado**.
- [ ] Sobre el build de producción, en un navegador real: la portada solicita
      **una** imagen antes de cualquier interacción, y solicita la segunda al
      desplegar una fila. Medido contando peticiones de imagen con Playwright.
- [ ] Sobre el build de producción: el documento no se desplaza en
      horizontal a 320, 390, 768 y 1440px con la tarjeta del líder y una fila
      desplegada — `scrollWidth - clientWidth` es `0` en las cuatro anchuras.
- [ ] El contraste del crédito sobre la superficie invertida cumple WCAG AA
      para texto normal (≥4,5:1), medido con la misma fórmula que
      `product/0009` sobre `--color-mute-on-ink` y el fondo `ink`.
- [ ] Ningún componente añade un literal de color, espaciado o tipografía:
      `scripts/validateStyleTokensRepo.test.ts` sigue en verde sin tokens
      nuevos, y `npm run arch:check` no reporta ninguna importación nueva
      hacia `domain/scoring/`.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan en
      local, con la cobertura de `domain/` y `data/` intacta.

## Dependencias y supuestos

- **Depende de `product/0014`** para el esquema de foto (`url`, `credit`,
  `shows`), para `photoSrc` como punto único de resolución de la URL servida,
  y para la caja 4/3 con `contain` y su hueco rotulado, que esta spec
  generaliza sin cambiar.
- **Depende de `product/0016`** para el contenido de `credit`: esta spec lo
  hace visible en la portada, no redefine qué se escribe en él.
- **No toca `product/0025`**: la ampliación y su recorrido siguen viviendo
  solo en la ficha.
- **No toca `product/0022`**: el reparto podio/resto, la línea de apoyo y el
  tratamiento de la fila plegada se mantienen exactamente como están.
- Asume que las fotos se siguen **enlazando** por URL absoluta y no se copian
  al despliegue: si algún día se copian, cambia `photoSrc` y nada más, como
  ya dejó escrito `product/0014`.
- Asume que los tests de `src/ui/` siguen siendo `renderToStaticMarkup` sin
  jsdom: los criterios de peticiones de imagen, ancho responsive y contraste
  se verifican a mano sobre el build, igual que en `product/0009` y
  `product/0022`.
- **No requiere una spec `technical/`**: no introduce tokens, primitivos,
  dependencias ni cambios de arquitectura; el componente compartido es la
  misma capa de presentación que ya existe.

## Decisiones abiertas

Ninguna.
