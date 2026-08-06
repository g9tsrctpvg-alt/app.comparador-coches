# Estado: interfaz de usuario

> Este documento es la **autoridad sobre cómo se presenta el sistema hoy**:
> qué componentes existen, qué renderiza cada uno, cómo se estila y qué no
> hacen nunca. Si hay duda sobre dónde vive un comportamiento de interfaz,
> gana lo que diga este documento.

**Estado:** Activo.

## Principio: la interfaz no calcula

`src/ui/` solo renderiza el `CarScoreBreakdown` que le devuelve
`scoreCatalog` (`docs/estado/dominio.md`). Ningún componente reproduce una
fórmula de puntuación ni recalcula un eje por su cuenta: `ui-no-scoring-internals`
(`.dependency-cruiser.mjs`) hace que un import de `src/ui/` o `src/main.tsx`
hacia `domain/scoring/axes/`, `normalize.ts` o `mustGet.ts` falle el paso de
contratos de arquitectura en CI. Lo único que `ui/` importa de
`domain/scoring/` son tipos, valores por defecto (`DEFAULT_WEIGHTS`,
`DEFAULT_ASSUMPTIONS`), `applyOverride` y la propia `scoreCatalog`. El
porcentaje que muestra cada fila del ranking (`percentage`, ver
`docs/estado/dominio.md`) es un campo del propio `CarScoreBreakdown`, no un
cálculo de la interfaz: la regla no tiene excepciones.

La regla de dependencias mira imports, así que no bastaba: la interfaz podía
—y llegó a hacerlo— acoplarse al dominio por el **texto** de las etiquetas,
sin importar nada. Hoy no lo hace. Ningún módulo de `src/ui/` compara, filtra
ni conmuta sobre una etiqueta procedente del dominio; los controles se
localizan por la clave `editableRating` que el dominio declara. El único uso
que queda del texto es cosmético —recortar la coletilla «(editable)» del
rótulo del control— y degrada a no hacer nada si la redacción cambia.

## Sistema de estilos

La aplicación se estila con **CSS propio**: una única hoja global de tokens
más un `Componente.module.css` por componente que lo necesita, sin
framework de utilidades ni CSS-in-JS (ADR 0006). No hay valores de diseño
sueltos fuera de la hoja de tokens: un literal de color, espaciado,
tipografía o radio en cualquier otro fichero hace fallar
`scripts/validateStyleTokensRepo.test.ts` en CI.

- **`src/styles/global.css`** — importada una sola vez, desde `src/main.tsx`.
  Declara todos los tokens en `:root` (siete papeles de color con sus
  derivados, la escala de espaciado, las dos familias tipográficas y su
  escala de tamaños, radios, sombras, tamaños propios y los dos puntos de
  ruptura), el reset mínimo (`box-sizing` heredado, sin márgenes por
  defecto, controles de formulario con tipografía heredada, `img`/`svg`
  acotados), el indicador de foco global (`:focus-visible`, un único sitio
  para toda la aplicación) y la neutralización de transiciones bajo
  `prefers-reduced-motion: reduce`.
- **`src/ui/primitives.module.css`** — primitivos compartidos entre
  componentes: `card` (superficie de tarjeta), `invertedSurface` (fondo
  `ink`, texto `paper` — la usa solo `LeaderCard`), `label` (rótulo de
  sección, monoespaciado y en versalitas), `mono` (familia monoespaciada
  para cualquier cifra), `proportionBar`/`proportionBarRow`/`proportionBarAxis`
  con su relleno normal o apagado, `statusMark` y `estimatedMark`,
  `secondaryText`, `prose` (medida de línea acotada a `--size-line-measure`
  y partición de palabras largas), `visuallyHidden` (texto solo para
  lectores de pantalla), `rangeInput` (deslizador con objetivo táctil de
  44×44) y `checkboxRow` (casilla más etiqueta como un único objetivo
  táctil de 44×44).
- **La paleta** son siete papeles con nombre por función, no por tono
  (`--color-paper`, `--color-card`, `--color-ink`, `--color-mute`,
  `--color-rule`, `--color-accent`, `--color-signal`), más dos derivados
  (`--color-mute-on-ink` para texto apagado sobre la superficie invertida,
  `--color-accent-tint` para el fondo de la fila líder). `mute` y `signal`
  están **oscurecidos** frente al artefacto original —`#5c6b62` y
  `#a34d18` en vez de `#6b7a72` y `#b4551b`— porque los tonos originales no
  llegaban a 4,5:1 de contraste sobre `card` ni `paper`; el ajuste vive
  como comentario junto a la declaración en `global.css`.
- **Los puntos de ruptura** son dos, `--bp-columna` (592px) y `--bp-ancho`
  (960px), cada uno con su motivo escrito junto a la declaración. Una media
  query no puede leer una custom property, así que cada `@media` de
  `src/ui/` repite el número; `scripts/validateStyleTokens.ts` comprueba que
  ese número —convertido a la misma unidad— coincida con uno de los dos
  tokens.

## Componentes

- **`App.tsx`** — orquesta la vista de clasificación. Carga el catálogo una
  vez al montar; si falla, lo registra con `logError`
  (`docs/proceso/logging.md`) y renderiza el aviso de error (`role="alert"`)
  en lugar del ranking. Pesos, supuestos, presupuesto, filtro de "ocultar
  fuera de presupuesto" y valoraciones sobrescritas ya no son `useState`
  propio: vienen del hook `useConfig` (ver «Configuración persistente y
  compartible» más abajo). Recalcula `scoreCatalog` en un `useMemo` cada vez
  que cambia la configuración — **salvo cuando la carga ha fallado**: las
  reglas de los hooks obligan a que ese `useMemo` corra también en esa
  rama, así que la guarda va dentro. Compone la página en una columna
  —título, conmutador de vista, tarjeta del líder, controles y
  clasificación— que por encima de `--bp-ancho` pasa a dos columnas: los
  controles a un lado, la clasificación al otro.
- **`LeaderCard`** — la única superficie invertida de la interfaz: nombra
  al coche mejor situado con los pesos vigentes y su `percentage`. Si el
  filtro de presupuesto deja la lista vacía, no se renderiza.
- **`CollapsiblePanel`** — el envoltorio que comparten `WeightSliders` y
  `AssumptionsPanel`: una tarjeta con un control de despliegue real
  (`aria-expanded`), plegada por defecto con un resumen de una línea. Por
  debajo de `--bp-columna` empieza plegada; por encima, una media query
  fuerza el contenido a visible pase lo que pase el estado de React, y
  esconde el resumen porque en ese caso ya no aporta nada.
- **`WeightSliders`** — un control 0-10 por eje, en el orden de
  `AXIS_ORDER`, uno por línea siempre. El valor se apaga a `--color-mute`
  cuando vale 0.
- **`AssumptionsPanel`** — el único punto de edición de los supuestos
  globales y del presupuesto. Ningún otro componente ofrece un control para
  ellos.
- **`RankingList`** — ordena los coches por `total` descendente (con
  `rankVisible`, compartida con `App` para que la tarjeta del líder y la
  cabeza de la lista nunca se desincronicen), aplica el filtro de
  presupuesto si está activo, y delega cada fila a `RankingRow`. Recibe
  también el catálogo crudo (`rawCars`) para leer tecnología, potencia,
  aceleración y precio: son campos de `Car`, no del desglose, y leerlos
  directamente evita acoplar la interfaz al texto de una etiqueta del
  dominio.
- **`RankingRow`** — una fila de la clasificación con seis elementos
  independientes, ninguno construido concatenando texto de otro: la
  posición (monoespaciada, con cero a la izquierda, en un hueco de ancho
  fijo), el nombre, una línea de apoyo monoespaciada (tecnología, potencia,
  aceleración, precio, con la marca de estimado cuando aplica), la marca de
  «Fuera de presupuesto» cuando corresponde, el `percentage` y una barra de
  proporción. La tecnología se muestra con su etiqueta legible
  (`src/ui/technologyLabels.ts`, product/0008: «Eléctrico», «Híbrido
  enchufable»…), nunca con la sigla del modelo de datos. El control que
  expande el desglose expone `aria-expanded` y
  su nombre accesible es solo la posición y el nombre del coche —nunca la
  puntuación ni la marca de presupuesto—. Expandida, muestra primero los
  controles de valoración editables (los subcomponentes que el dominio
  marca con `editableRating`; la fila no sabe de antemano cuáles son ni
  cuántos) y después el desglose completo de los seis ejes.
- **`AxisBreakdownView`** — renderiza un `AxisBreakdown` completo como un
  bloque delimitado: cabecera (nombre, peso, puntuación sobre 10,
  aportación) con su barra de proporción —apagada cuando el peso es 0—,
  descripción de la fórmula, datos de entrada (valor, unidad, estimado o
  verificado con `EstimatedMark`, fuente vigente y fuentes descartadas con
  su motivo cuando las hay), supuestos aplicados como texto de solo
  lectura, subcomponentes —con sus dos anclajes de escala absoluta como
  elementos propios («587 L → 10», «250 L → 0»), nunca como texto entre
  paréntesis—, la normalización del eje cuando existe a ese nivel —rotulada
  con el `rawUnit` que el eje declara—, y las penalizaciones —con «No
  aplican a este eje.» cuando no hay ninguna—. Una fuente descartada de
  valor textual se muestra tal cual: `SourceEntrySchema` admite `string`, y
  convertirlo a número daría `NaN`.
- **`EstimatedMark`** — la marca compartida de un dato estimado: la tilde
  del artefacto (`~`) más una explicación accesible para quien no la
  perciba visualmente. La usan `RankingRow` (línea de apoyo) y
  `AxisBreakdownView` (datos de entrada).
- **`ConfigActions`** (product/0012) — dos botones sobre la clasificación:
  «Copiar enlace» —genera la URL compartible con `useConfig().shareUrl()` y
  la copia con la Clipboard API; si falla (contexto no seguro, permiso
  denegado) no hace nada visible, el botón sigue disponible— y «Restablecer
  valores por defecto», que llama a `resetToDefaults()`. El primero cambia
  su propio rótulo a «Enlace copiado» durante dos segundos tras copiar.

## Configuración persistente y compartible

product/0012. `useConfig` (`src/ui/useConfig.ts`) es el *wiring* entre el
dominio —esquema y restauración puros, sin `window`— y el navegador: URL y
`localStorage`, este último detrás de un puerto. `App.tsx` solo consume
`config` y llama a sus `set*`; ningún componente llama a `localStorage`
directamente.

- **Un único objeto de configuración**, `AppConfig`
  (`src/domain/config.ts`): pesos, supuestos, presupuesto, el filtro de
  presupuesto y las valoraciones sobrescritas por coche. Es el único objeto
  que se persiste y el único que se comparte. El filtro de presupuesto
  viaja con la configuración a propósito: sin él, un enlace compartido no
  reproduce la misma lista de coches.
- **Precedencia**: lo que trae la URL gana sobre lo guardado en
  `localStorage`, que gana sobre los valores por defecto
  (`DEFAULT_CONFIG`). Una fuente que se descarta entera —versión
  desconocida, JSON corrupto, no objeto— no cuenta como «hay configuración
  ahí»: se prueba la siguiente fuente en la precedencia
  (`resolveInitialConfig`, dentro de `useConfig`).
- **Abrir un enlace no persiste hasta el primer cambio**: `useConfig` marca
  la configuración inicial como «de un enlace» cuando viene de la URL, y no
  escribe en `localStorage` hasta que el usuario mueve algo. A partir de
  ahí, la marca se limpia y el guardado sigue las reglas normales para el
  resto de la sesión. Como la aplicación nunca reescribe la URL sola
  (requisito 6 de la spec), recargar la **misma** URL de un enlace sigue
  mostrando lo que el enlace dice —es la precedencia, no una excepción—; lo
  guardado aparece al volver por una URL limpia.
- **Restauración con degradación por partes** (`restoreConfig`,
  `src/domain/config.ts`): un campo presente pero inválido se descarta y
  cae a su valor por defecto, y se registra con `logError`
  (`docs/proceso/logging.md`); un campo simplemente ausente no cuenta como
  descarte y no se registra —así el enlace puede omitir todo lo que no ha
  cambiado sin generar ruido en los registros—. Las valoraciones
  sobrescritas se restauran por coche y por campo: una nota fuera de rango
  descarta solo esa nota, no las demás del mismo coche; un coche que ya no
  está en el catálogo descarta todas las suyas.
- **El enlace compartible** (`src/domain/configUrl.ts`,
  `configToParams`/`paramsToRawConfig`) solo lleva lo que se aparta de los
  valores por defecto, un parámetro por dato con nombre corto —`w_<eje>`,
  `a_<supuesto>`, `budget`, `hideOverBudget`, `o_<carId>_<campo>`—, más `v`
  con la versión, presente solo si hay algún otro parámetro. Con la
  configuración por defecto, el enlace generado es la URL limpia del sitio.
- **El puerto de almacenamiento** es `src/adapters/localStorageConfigPort.ts`
  (`loadRawConfig`, `saveConfig`, `clearConfig`): el único módulo que toca
  `window.localStorage`. `src/domain/` no lo importa —lo comprueba la regla
  `domain-no-storage-adapter` de `.dependency-cruiser.mjs`—, así que tampoco
  conoce `window` de forma transitiva. Si el almacenamiento no está
  disponible (modo privado, cuota agotada, permiso denegado), la aplicación
  sigue funcionando sin persistencia; se registra una vez por carga de
  página, no en cada intento de guardar.
- **Lo efímero no se persiste**: qué fila del ranking está desplegada vive
  en el `useState` local de `RankingList`, fuera de `AppConfig`.

## Responsive

Diseño móvil primero: las reglas base valen para 320px y las media queries
—siempre sobre `--bp-columna` o `--bp-ancho`— añaden a partir de ahí. No hay
scroll horizontal a ningún ancho probado (320 a 1440px). El texto corrido
—fórmulas, fuentes, el párrafo introductorio de los supuestos— se acota a
`--size-line-measure` (75 caracteres) con la utilidad `prose`; el ranking y
los controles usan el ancho que tengan disponible. Todo objetivo táctil
—deslizadores, casillas, botones de despliegue— mide al menos 44×44px de
área accionable. Ninguna altura se fija en unidades de viewport clásicas
(`vh`): la interfaz no usa ninguna, así que tampoco hay nada que romper con
la barra de direcciones móvil.

## Formato

`src/ui/format.ts`: `formatEur`, `formatNumber` y `formatSigned`, con
`Intl` en locale `es-ES`. `AxisBreakdownView` decide `formatEur` cuando la
unidad es `€` y `formatNumber` en el resto.

## Tests y suelo de cobertura

`src/ui/` tiene tests —`App.test.tsx`, `RankingList.test.tsx`,
`AxisBreakdownView.test.tsx`—, pero **no cubren la interfaz entera**: cubren
los fallos concretos que `technical/0002` corrigió y las invariantes que
protegen (que el aviso de error se renderice de verdad, que renombrar una
etiqueta del dominio no rompa los controles, que no aparezca `NaN`), más las
invariantes que `product/0009` añadió sobre el marcado (que el control de
despliegue exponga `aria-expanded`). La puntuación de los once candidatos
del catálogo real está protegida aparte, en
`src/domain/scoring/scoreCatalog.snapshot.test.ts`: no es un test de `ui/`,
pero es la comprobación de que ningún cambio de presentación mueve una
nota.

Se renderizan con `renderToStaticMarkup` de `react-dom/server`, que ya es
dependencia. No hay jsdom ni *testing library*: no hacen falta para lo que se
comprueba, y añadirlas es una dependencia nueva, que se decide aparte. La
contrapartida es que estos tests no interactúan —no hacen clic ni arrastran,
no calculan estilos ni tienen viewport—, así que el comportamiento
interactivo, visual y responsive se verifica a mano contra un navegador real
sobre el build de producción (`npm run preview`).

`src/ui/` y `src/main.tsx` siguen fuera del suelo de cobertura del 100%
(`vite.config.ts`, `coverage.include` solo cubre `domain/`, `data/` y
`logging/`). Si deben entrar es una decisión pendiente, registrada como deuda
en `docs/roadmap.md`. La hoja de estilos tampoco entra en ese suelo —no
tiene ramas que ejecutar—, y su propia comprobación mecánica es
`scripts/validateStyleTokensRepo.test.ts`, no la cobertura de Vitest.
