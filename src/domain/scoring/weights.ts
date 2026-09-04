export type AxisId =
  | 'carga'
  | 'habitabilidad'
  | 'diario'
  | 'prestaciones'
  | 'fiabilidad'
  | 'estetica'
  | 'prueba'
  | 'coste';

export type AxisWeights = Record<AxisId, number>;

/**
 * `carga` y `habitabilidad` a 5 cada uno (product/0033, requisito 4) no es
 * una preferencia: es la única pareja que deja la nota total de todo el
 * catálogo bit a bit igual a la que daba `viaje` con peso 10, porque
 * `viaje` ya pesaba el maletero al 0,5 y la habitabilidad al 0,5 (0,25 +
 * 0,25 entre batalla y hombros). Partir el eje, con estos pesos, no mueve
 * ninguna nota por sí solo.
 *
 * `prueba` nace a 0 (product/0037, requisito 2.4): el día que el eje se
 * implementa, la clasificación de todo el catálogo queda bit a bit igual
 * que sin él, porque el neutro declarado del ADR 0012 multiplicado por 0 no
 * mueve nada. Subirlo es un acto explícito de quien decide.
 */
export const DEFAULT_WEIGHTS: AxisWeights = {
  carga: 5,
  habitabilidad: 5,
  diario: 7,
  fiabilidad: 7,
  estetica: 6,
  prueba: 0,
  prestaciones: 5,
  coste: 5,
};

export const AXIS_ORDER: AxisId[] = [
  'carga',
  'habitabilidad',
  'diario',
  'prestaciones',
  'fiabilidad',
  'estetica',
  'prueba',
  'coste',
];

export const AXIS_LABELS: Record<AxisId, string> = {
  carga: 'Capacidad de carga',
  habitabilidad: 'Espacio para los de atrás',
  diario: 'Facilidad de uso diario',
  prestaciones: 'Prestaciones',
  fiabilidad: 'Fiabilidad y garantía',
  estetica: 'Estética',
  prueba: 'Prueba real',
  coste: 'Coste total',
};
