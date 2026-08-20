# 0025 — La foto ampliada se recorre sin cerrar el diálogo

- **Id:** product/0025
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-20
- **Specs relacionadas:** product/0014, product/0016, product/0023,
  product/0024, technical/0009, technical/0010
- **ADRs relacionados:** 0006
- **Doc de estado:** `docs/estado/interfaz.md`

## Contexto

Hoy la ficha enseña **una vista de foto a la vez, la misma para todos los
modelos**: el cuarto control de la barra (`technical/0010`, requisito 1.1)
elige entre Frontal, Lateral, Trasera, Maletero e Interior, y esa elección
—`photoView`— gobierna a la vez la cabecera de cada columna de la tabla, la
miniatura de cada candidato de la tira móvil y la foto de la tarjeta de duelo
(`product/0023`, requisito 5). Es una elección global y persistida
(`product/0024`): sobrevive a cerrar el navegador.

Pulsar una foto la abre ampliada en un `<dialog>` nativo (`product/0014`,
sección 4.3), y ese diálogo enseña **exactamente la foto pulsada y nada
más**: una `<img>`, su `shows` y su `credit`, y un botón de cierre. El estado
que lo respalda —`openPhoto` en `FichaPage`— es una tripleta cerrada
`{ entity, view, photo }` sin noción de que existan otras vistas del mismo
coche, y es efímero por decisión expresa (`product/0024`, sección de lo que
sigue sin persistirse).

La consecuencia es que **ver los cuatro o cinco ángulos de un mismo coche
cuesta un ciclo completo de interfaz por cada uno**: cerrar el diálogo, subir
a la barra, cambiar el selector «Foto», localizar otra vez la columna del
modelo —que en la tabla puede estar desplazada en horizontal— y volver a
pulsar. Y ese rodeo tiene un daño colateral que el usuario no ha pedido:
cambiar el selector **cambia la foto de las catorce columnas a la vez** y
además **guarda** esa elección, así que mirar el maletero de un coche deja la
ficha entera en «Maletero» la próxima vez que se abra.

El material ya está ahí y no se ve: de las catorce entidades que hoy tiene la
ficha —trece coches publicados más la referencia—, **cinco declaran las cinco
vistas y las otras nueve declaran cuatro** (61 fotos de 70 posibles; las que
faltan son casi todas de maletero, deuda de datos ya registrada en
`docs/roadmap.md`). Ninguna baja de cuatro. La aplicación las tiene todas a un
clic y obliga a pedirlas de una en una por la puerta de atrás.

## Objetivo

Que la foto ampliada sea el sitio donde se mira un coche entero: abrir la que
se ha pulsado y poder recorrer desde ahí el resto de sus vistas, sin cerrar
el diálogo, sin tocar el selector de la barra y sin cambiar lo que ven las
demás columnas.

## Alcance

- **El contenido del `<dialog>` de foto ampliada**: pasa de enseñar una foto
  fija a enseñar la vista actual de una **secuencia recorrible** —las vistas
  que ese modelo declara—, con la pulsada como punto de entrada.
- **Los controles de recorrido dentro del diálogo**: anterior y siguiente,
  más acceso directo a cada vista disponible, con la vigente señalada sin
  depender solo del color.
- **El teclado**: `←` y `→` recorren la secuencia mientras el diálogo está
  abierto; `Escape` sigue cerrando, como hoy.
- **Qué acompaña a cada foto**: el pie (`shows` — `credit`) y el texto
  alternativo se refrescan con la vista mostrada, porque son datos de la
  foto, no del modelo.
- **La degradación** dentro del diálogo: una vista cuya `src` falla al cargar
  se comporta como ya se comporta en la miniatura —hueco rotulado, no icono
  de imagen rota—, sin sacar la vista de la secuencia.
- **El orden de la secuencia**: canónico y estable (`PHOTO_VIEWS`), no el
  orden en que las claves aparezcan en `cars.json`, que hoy varía de un coche
  a otro.
- **Un punto único en el dominio** que resuelva «qué vistas tiene este
  modelo, en qué orden», para que la interfaz no vuelva a decidirlo por su
  cuenta en cada componente.

## Fuera de alcance

- **El selector «Foto» de la barra.** No cambia de forma, ni de opciones, ni
  de comportamiento: sigue gobernando qué vista enseñan todas las columnas a
  la vez, y sigue siendo la única vía de cambiarlo. Recorrer el carrusel
  **no** lo mueve (requisito 12).
- **`photoView` y su persistencia** (`product/0024`): el estado del diálogo
  sigue siendo efímero, y abrir, recorrer y cerrar el diálogo no deja rastro
  en `localStorage`.
- **Cambiar de modelo dentro del diálogo.** El carrusel recorre las vistas de
  **un** coche; no encadena los catorce. Comparar modelos es lo que hace la
  ficha detrás, y saltar de coche dentro del diálogo convertiría una
  ampliación en una segunda vista de navegación.
- **El gesto táctil de deslizamiento (*swipe*).** Se aplaza con disparador
  —ver *Dependencias y supuestos*—: la ficha ya tiene un mecanismo propio de
  anclaje de eje en gestos táctiles (`technical/0007`, `technical/0008`), y
  meter un segundo lector de `touchmove` en la misma pantalla merece medirse
  antes que suponerse.
- **`PhotoBox`, `ChipThumbnail` y la tarjeta de duelo.** Siguen igual: la
  única puerta de entrada al diálogo sigue siendo pulsar una foto, y sigue
  abriendo por la vista vigente.
- **El catálogo y las fotos que faltan.** Esta spec no añade ni sustituye
  ninguna foto; las nueve vistas ausentes siguen siendo la deuda de datos
  que ya está registrada, y el carrusel las salta sin hueco muerto.
- **De dónde salen las fotos** (`product/0016`): sin cambios, ni en orígenes
  ni en crédito.
- **Precarga de las fotos no vistas.** El diálogo pide la imagen de la vista
  que enseña, no las otras cuatro por si acaso: son URLs externas y son la
  parte cara de esta pantalla.
- **El aspecto del diálogo**: radio, sombra de superposición, `::backdrop` y
  ancho máximo se quedan como los dejó `technical/0009`.

## Requisitos / comportamiento esperado

1. **El diálogo abre por donde se pulsó.** Al pulsar la foto de un modelo, el
   diálogo se abre mostrando **esa** vista, exactamente como hoy. Nada del
   punto de entrada cambia.
2. **La secuencia son las vistas declaradas de ese modelo**, en el orden
   canónico de `PHOTO_VIEWS` (Frontal, Lateral, Trasera, Maletero,
   Interior), sin las que el modelo no declara. Un modelo con cuatro fotos
   tiene un carrusel de cuatro; uno con las cinco, de cinco.
3. **El orden no depende del fichero de datos.** Lo resuelve una función pura
   del dominio a partir de `Photos`, no el orden de claves de `cars.json`
   —que hoy alterna `front,side,rear,…` y `front,rear,side,…` según el
   coche—.
4. **Anterior y siguiente.** El diálogo ofrece dos controles, «Anterior» y
   «Siguiente», con nombre accesible propio. En los extremos de la secuencia
   el control correspondiente queda **deshabilitado**: la secuencia no da la
   vuelta, para que la posición sea siempre legible.
5. **Acceso directo a cada vista.** El diálogo ofrece además un control por
   vista disponible, rotulado con el nombre de la vista (Frontal, Lateral,
   Trasera, Maletero, Interior). El de la vista vigente lleva
   `aria-current="true"` además de su tratamiento visual: el estado no
   depende solo del color, con el mismo criterio que la tira de candidatos
   (`product/0023`, requisito 3).
6. **Teclado.** Con el diálogo abierto, `←` y `→` mueven a la vista anterior
   y siguiente de la secuencia, sin efecto en los extremos. `Escape` cierra y
   devuelve el foco al botón que abrió el diálogo, como ya hace hoy. El foco
   permanece dentro del diálogo mientras esté abierto (comportamiento nativo
   de `showModal()`).
7. **Un solo elemento de foto a la vez.** El diálogo renderiza la `<img>` de
   la vista vigente y solo esa. Cambiar de vista sustituye su `src`, su `alt`
   y su pie.
8. **El pie y el texto alternativo siguen a la foto.** El pie muestra el
   `shows` y el `credit` **de la foto mostrada**; el `alt` nombra al modelo y
   la vista mostrada, con el mismo patrón que hoy usa la miniatura.
9. **Posición legible sin contar controles.** El diálogo declara en texto la
   posición dentro de la secuencia —vista vigente y total—, accesible a un
   lector de pantalla aunque los controles de vista se lean como una lista de
   botones.
10. **Una sola foto, ningún mando muerto.** Si el modelo declara **una única
    vista**, el diálogo se comporta exactamente como hoy: sin controles de
    anterior/siguiente, sin tira de vistas y sin indicador de posición. Un
    control deshabilitado permanente no es información.
11. **Degradación de una vista que no carga.** Si la `src` de la vista
    mostrada falla, el diálogo enseña en su lugar el mismo hueco rotulado que
    usa la miniatura —«<Modelo>, <Vista> — sin foto»—, conservando la
    posición en la secuencia y los controles de recorrido. Nunca se queda el
    icono de imagen rota, y la vista no desaparece de la secuencia a mitad de
    recorrido.
12. **Ningún efecto fuera del diálogo.** Recorrer el carrusel no cambia
    `photoView`, ni la foto de ninguna columna de la tabla, ni la de la
    tarjeta de duelo, ni escribe nada en `localStorage`. Al cerrar, la ficha
    está exactamente como estaba al abrir.
13. **Cerrar y reabrir no recuerda nada.** El diálogo siempre abre por la
    vista que se acaba de pulsar, no por la última que se estuviera mirando:
    el estado del carrusel muere con el diálogo (`product/0024`).
14. **Alcanzable con el dedo.** Todo control del diálogo mide al menos
    44×44px de área accionable (`product/0010`, requisito 8), incluidos los
    de vista, y a 320px los controles caben sin desplazar el documento en
    horizontal (`product/0010`, requisito 1).
15. **Sin tokens ni primitivos nuevos.** Los controles se componen de los
    primitivos y tokens vigentes (`technical/0004`, `technical/0009`); no se
    declara ningún color, espaciado, tipografía ni punto de ruptura nuevo.
16. **Ninguna puntuación, Δ ni campo del dominio cambia.** `buildFicha`,
    `withComparison` y `sortFicha` se reutilizan sin tocar, y la interfaz
    sigue sin calcular nada (`ui-no-scoring-internals`).

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] La función de dominio que ordena las vistas devuelve, para un `Photos`
      con las claves en cualquier orden, la secuencia canónica de
      `PHOTO_VIEWS` restringida a las declaradas: para
      `{front, rear, side, interior}` devuelve `[front, side, rear,
      interior]`. Test unitario en `src/domain/photo.test.ts`, con cobertura
      al 100 % del módulo.
- [ ] Con el catálogo real, abrir la foto Lateral de `honda-civic-e-hev`
      —cuyas claves en `cars.json` van `front,rear,side,interior`— muestra
      Lateral, y «Siguiente» lleva a Trasera, no a Interior.
- [ ] Abrir la foto de `toyota-corolla-cross` (cinco vistas) da una secuencia
      de cinco controles de vista, y la de `kia-ev3` (cuatro) da cuatro, sin
      hueco para Maletero.
- [ ] En la primera vista de la secuencia, «Anterior» está deshabilitado; en
      la última, «Siguiente». En ninguna posición intermedia lo está ninguno
      de los dos.
- [ ] El control de la vista vigente —y solo ese— lleva
      `aria-current="true"`; al pulsar otro, el atributo se mueve a él y la
      `<img>` pasa a servir la `src` de esa vista.
- [ ] Con el diálogo abierto, `→` avanza a la vista siguiente y `←` retrocede
      a la anterior; en los extremos, la tecla correspondiente no hace nada.
      Verificado con Playwright sobre el build de producción.
- [ ] El pie del diálogo muestra el `shows` y el `credit` de la vista
      mostrada, y cambian al cambiar de vista: verificado sobre un modelo
      cuyas dos primeras vistas tienen créditos distintos.
- [ ] El `alt` de la `<img>` nombra la vista mostrada y cambia con ella.
- [ ] Un modelo con una sola vista declarada abre el diálogo sin controles de
      recorrido, sin tira de vistas y sin indicador de posición. Comprobado
      con la referencia `alfa-romeo-giulietta` de la fixture de tests, que
      solo declara `side`.
- [ ] Una vista cuya `src` falla al cargar muestra el hueco rotulado dentro
      del diálogo, conservando los controles y la posición; pulsar
      «Siguiente» desde ahí lleva a la vista siguiente con normalidad.
      Verificado con Playwright interceptando la petición de imagen en la
      capa de red, como ya hizo `technical/0009`.
- [ ] Recorrer el carrusel entero y cerrar el diálogo deja el selector «Foto»
      en el mismo valor que tenía al abrirlo, la tabla mostrando esa misma
      vista en todas sus columnas, y la clave
      `comparador-coches:view` de `localStorage` byte a byte idéntica a como
      estaba. Verificado con Playwright sobre el build de producción.
- [ ] Cerrar el diálogo tras recorrerlo y volver a pulsar la misma miniatura
      lo reabre por la vista de la miniatura, no por la última mirada.
- [ ] Con el diálogo cerrado, el marcado no contiene ninguna `<img>` del
      diálogo ni ningún control de recorrido: el test vigente «renders the
      closed photo dialog with no figure until a photo is opened» sigue en
      verde sin modificar sus aserciones.
- [ ] A 320px, cada control del diálogo mide al menos 44×44px de área
      accionable y el documento no se desplaza en horizontal. Medido con
      Playwright a 320, 375, 592, 960 y 1440px.
- [ ] Ningún componente de `src/ui/` estrena un literal de color, espaciado o
      tipografía: `scripts/validateStyleTokensRepo.test.ts` sigue en verde
      sin añadir tokens.
- [ ] `ficha.test.ts` sigue en verde sin modificar ningún valor esperado, y
      `ui-no-scoring-internals` sigue pasando sin tocar
      `.dependency-cruiser.mjs`.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage`, `npm run check:photos` y
      `npm run build` pasan en local.

## Dependencias y supuestos

- **Amplía `product/0014` sin editarla.** Aquella spec declaró el diálogo de
  foto ampliada (sección 4.3) y está en `implemented`; esta añade el
  recorrido dentro de él, con el mismo precedente con el que `product/0016`
  la amplió sin tocar su fichero. No reabre ninguna de sus decisiones: ni el
  enlazado de imágenes por URL absoluta, ni el degradado a hueco rotulado,
  ni qué vistas existen.
- **Depende de `product/0024`** solo para no contradecirla: `photoView` sigue
  persistido y el estado del diálogo sigue efímero. Esta spec **no** añade un
  sexto campo a `ViewState`.
- **Depende de `technical/0010`** en que el selector «Foto» de la barra queda
  intacto: esta spec no le quita trabajo, le quita **rodeos** — el selector
  sigue siendo lo que decide qué ve la ficha; el carrusel decide qué ve el
  diálogo.
- **Reutiliza `photoSrc`** (`src/domain/photo.ts`) como único punto de
  resolución de la URL servida. Si algún día las imágenes se copian al propio
  despliegue, esto sigue sin enterarse.
- Asume que `<dialog open>` sigue siendo el mecanismo del diálogo: el foco
  atrapado, `Escape` y la devolución del foco al abridor son del navegador,
  no código propio, y esta spec no los sustituye.
- Asume el límite de verificación ya conocido: `renderToStaticMarkup` sin
  jsdom no hace clic ni pulsa teclas, así que los criterios de interacción se
  cierran con Playwright sobre `npm run preview`, igual que en
  `product/0023`, `product/0024` y `technical/0009`. La deuda de cobertura de
  `src/ui/` no se cierra aquí ni se agranda: la lógica nueva que sí es pura
  —el orden de la secuencia— vive en el dominio y va con test unitario.
- **Aplazamiento con disparador —*swipe* táctil**: se implementa cuando
  alguien reporte que recorrer el carrusel con botones en un móvil real
  resulta incómodo. Antes de eso habría que medir cómo convive un segundo
  lector de `touchmove` con `attachScrollAxisLock` (`technical/0008`), y esa
  medición no la justifica una suposición.
- **No requiere una spec `technical/`**: no introduce tokens, primitivos,
  puntos de ruptura ni dependencias nuevas. Un carrusel de cuatro fotos con
  dos botones no necesita librería, y meter una contradiría el ADR 0006.

## Decisiones abiertas

> Las dos que esta spec abrió se cerraron el 2026-08-20, y su respuesta está
> en los requisitos, no aquí: recorrer el carrusel **no** mueve el selector
> «Foto» de la barra ni toca nada persistido (requisitos 12 y 13), y la tira
> de vistas lleva **solo rótulos de texto**, nunca miniaturas (requisito 5).
> Ninguna de las dos cambia un requisito: las dos confirman el redactado que
> ya tenían.

Ninguna.
