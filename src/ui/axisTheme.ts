import type { AxisId } from '../domain/scoring/weights';
import styles from './axisTheme.module.css';

/** `noUncheckedIndexedAccess` hace que leer una clase de un módulo CSS
 * devuelva `string | undefined`, y con razón: nada garantiza en tipos que la
 * hoja declare la clase que se le pide. Un `?? ''` silencioso dejaría el eje
 * sin color sin que nadie se enterase, así que falla ruidoso y al importar. */
function themeClass(axisId: AxisId): string {
  const className = styles[axisId];
  if (className === undefined) {
    throw new Error(
      `axisTheme.module.css no declara una clase para el eje «${axisId}»`,
    );
  }
  return className;
}

/** La clase de tema de cada eje (technical/0011, requisito 3.2): pone
 * `--axis-color` y `--axis-tint` en el subárbol que la lleva, y nada más.
 *
 * Es un mapa **de interfaz** sobre un id **de dominio**, igual que
 * `TECHNOLOGY_LABELS`: el `axisId` es del modelo y de qué color se pinta es
 * cosa de la vista. El dominio no sabe que estos colores existen, que es
 * justo lo que hace que se puedan cambiar sin tocar ninguna nota.
 *
 * Los seis se escriben a mano en vez de derivarse de `AXIS_ORDER` para que el
 * tipo salga exacto sin un `as`. Que la lista esté completa no queda al aire:
 * lo comprueba `axisTheme.test.ts` contra `AXIS_ORDER`. */
export const AXIS_THEME_CLASS: Record<AxisId, string> = {
  carga: themeClass('carga'),
  habitabilidad: themeClass('habitabilidad'),
  diario: themeClass('diario'),
  prestaciones: themeClass('prestaciones'),
  fiabilidad: themeClass('fiabilidad'),
  estetica: themeClass('estetica'),
  prueba: themeClass('prueba'),
  coste: themeClass('coste'),
};
