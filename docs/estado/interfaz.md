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
`DEFAULT_ASSUMPTIONS`) y la propia `scoreCatalog`.

## Componentes

- **`App.tsx`** — orquesta el estado: pesos, supuestos, presupuesto,
  filtro de "ocultar fuera de presupuesto" y las valoraciones que el
  usuario ha sobrescrito por coche. Carga el catálogo una vez al montar; si
  falla, lo registra con `logError` (`docs/proceso/logging.md`) y no
  renderiza el ranking. Recalcula `scoreCatalog` en un `useMemo` cada vez
  que cambian pesos, supuestos, presupuesto o valoraciones.
- **`AssumptionsPanel`** — el único punto de edición de los supuestos
  globales y del presupuesto. Ningún otro componente ofrece un control para
  ellos.
- **`WeightSliders`** — un control 0-10 por eje, en el orden de
  `AXIS_ORDER`.
- **`RankingList`** — ordena los coches por `total` descendente, aplica el
  filtro de presupuesto si está activo, y expande/colapsa el desglose
  completo de un coche a la vez. Cuando un coche está expandido, ofrece tres
  controles para editar `aestheticsExterior`, `aestheticsInterior` y
  `travelComfort` directamente sobre el desglose ya calculado —el valor que
  muestran es el que trae el propio `AxisBreakdown`, nunca un estado
  paralelo—.
- **`AxisBreakdownView`** — renderiza un `AxisBreakdown` completo: cabecera
  (peso, puntuación, aportación), descripción de la fórmula, datos de
  entrada (valor, unidad, estimado o verificado, fuente vigente y fuentes
  descartadas con su motivo cuando las hay), supuestos aplicados como texto
  de solo lectura, subcomponentes (con su propia normalización cuando el eje
  la calcula por sumando), la normalización del eje cuando existe a ese
  nivel, y las penalizaciones —con «No aplican a este eje.» cuando no hay
  ninguna—.

## Formato

`src/ui/format.ts`: `formatEur`, `formatNumber` y `formatSigned`, con
`Intl` en locale `es-ES`. `AxisBreakdownView` decide `formatEur` quando la
unidad es `€` y `formatNumber` en el resto.

## Qué no cubre el suelo de cobertura

`src/ui/` y `src/main.tsx` siguen fuera del suelo de cobertura del 100%
(`vite.config.ts`, `coverage.include` solo cubre `domain/`, `data/` y
`logging/`). La razón original —que era andamiaje mínimo a punto de
rehacerse— ya no aplica: la interfaz de hoy es la real, no una previa. Sigue
sin tests automatizados propios; su verificación hasta ahora ha sido manual,
contra un navegador real sobre el build de producción. Si debe entrar en el
suelo de cobertura es una decisión pendiente — registrada como deuda en
`docs/roadmap.md`, no decidida por su cuenta aquí.
