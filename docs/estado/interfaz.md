# Estado: interfaz de usuario

> Este documento es la **autoridad sobre cómo se presenta el sistema hoy**:
> qué componentes existen, qué renderiza cada uno y qué no hacen nunca. Si
> hay duda sobre dónde vive un comportamiento de interfaz, gana lo que diga
> este documento.

**Estado:** Activo.

## Principio: la interfaz no calcula

`src/ui/` solo renderiza el `CarScoreBreakdown` que le devuelve
`scoreCatalog` (`docs/estado/dominio.md`). Ningún componente reproduce una
fórmula de puntuación ni recalcula un eje por su cuenta: `ui-no-scoring-internals`
(`.dependency-cruiser.mjs`) hace que un import de `src/ui/` o `src/main.tsx`
hacia `domain/scoring/axes/`, `normalize.ts` o `mustGet.ts` falle el paso de
contratos de arquitectura en CI. Lo único que `ui/` importa de
`domain/scoring/` son tipos, valores por defecto (`DEFAULT_WEIGHTS`,
`DEFAULT_ASSUMPTIONS`), `applyOverride` y la propia `scoreCatalog`.

La regla de dependencias mira imports, así que no bastaba: la interfaz podía
—y llegó a hacerlo— acoplarse al dominio por el **texto** de las etiquetas,
sin importar nada. Hoy no lo hace. Ningún módulo de `src/ui/` compara, filtra
ni conmuta sobre una etiqueta procedente del dominio; los controles se
localizan por la clave `editableRating` que el dominio declara. El único uso
que queda del texto es cosmético —recortar la coletilla «(editable)» del
rótulo del control— y degrada a no hacer nada si la redacción cambia.

## Componentes

- **`App.tsx`** — orquesta el estado: pesos, supuestos, presupuesto,
  filtro de "ocultar fuera de presupuesto" y las valoraciones que el
  usuario ha sobrescrito por coche. Carga el catálogo una vez al montar; si
  falla, lo registra con `logError` (`docs/proceso/logging.md`) y renderiza
  el aviso de error en lugar del ranking. Recalcula `scoreCatalog` en un
  `useMemo` cada vez que cambian pesos, supuestos, presupuesto o
  valoraciones — **salvo cuando la carga ha fallado**: las reglas de los
  hooks obligan a que ese `useMemo` corra también en esa rama, así que la
  guarda va dentro. Puntuar un catálogo vacío lanzaría y se llevaría por
  delante el propio mensaje de error.
- **`AssumptionsPanel`** — el único punto de edición de los supuestos
  globales y del presupuesto. Ningún otro componente ofrece un control para
  ellos.
- **`WeightSliders`** — un control 0-10 por eje, en el orden de
  `AXIS_ORDER`.
- **`RankingList`** — ordena los coches por `total` descendente, aplica el
  filtro de presupuesto si está activo, y expande/colapsa el desglose
  completo de un coche a la vez. Cuando un coche está expandido, recorre sus
  subcomponentes y ofrece un control por cada uno que lleve
  `editableRating`; no sabe de antemano cuáles son ni cuántos. El valor que
  muestran es el que trae el propio `AxisBreakdown`, nunca un estado
  paralelo.
- **`AxisBreakdownView`** — renderiza un `AxisBreakdown` completo: cabecera
  (peso, puntuación, aportación), descripción de la fórmula, datos de
  entrada (valor, unidad, estimado o verificado, fuente vigente y fuentes
  descartadas con su motivo cuando las hay), supuestos aplicados como texto
  de solo lectura, subcomponentes (con su propia normalización cuando el eje
  la calcula por sumando), la normalización del eje cuando existe a ese
  nivel —rotulada con el `rawUnit` que el eje declara, para que los euros de
  `coste` se lean como euros—, y las penalizaciones —con «No aplican a este
  eje.» cuando no hay ninguna—. Una fuente descartada de valor textual se
  muestra tal cual: `SourceEntrySchema` admite `string`, y convertirlo a
  número daría `NaN`.

## Formato

`src/ui/format.ts`: `formatEur`, `formatNumber` y `formatSigned`, con
`Intl` en locale `es-ES`. `AxisBreakdownView` decide `formatEur` cuando la
unidad es `€` y `formatNumber` en el resto.

## Tests y suelo de cobertura

`src/ui/` tiene tests —`App.test.tsx`, `RankingList.test.tsx`,
`AxisBreakdownView.test.tsx`—, pero **no cubren la interfaz entera**: cubren
los fallos concretos que `technical/0002` corrigió y las invariantes que
protegen (que el aviso de error se renderice de verdad, que renombrar una
etiqueta del dominio no rompa los controles, que no aparezca `NaN`).

Se renderizan con `renderToStaticMarkup` de `react-dom/server`, que ya es
dependencia. No hay jsdom ni *testing library*: no hacen falta para lo que se
comprueba, y añadirlas es una dependencia nueva, que se decide aparte. La
contrapartida es que estos tests no interactúan —no hacen clic ni arrastran—,
así que el comportamiento interactivo se sigue verificando a mano contra un
navegador real sobre el build de producción.

`src/ui/` y `src/main.tsx` siguen fuera del suelo de cobertura del 100%
(`vite.config.ts`, `coverage.include` solo cubre `domain/`, `data/` y
`logging/`). Si deben entrar es una decisión pendiente, registrada como deuda
en `docs/roadmap.md`.
