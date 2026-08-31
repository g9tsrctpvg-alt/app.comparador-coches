export type AxisId =
  | 'carga'
  | 'habitabilidad'
  | 'diario'
  | 'prestaciones'
  | 'fiabilidad'
  | 'estetica'
  | 'coste';

export type AxisWeights = Record<AxisId, number>;

/**
 * `carga` y `habitabilidad` a 5 cada uno (product/0033, requisito 4) no es
 * una preferencia: es la única pareja que deja la nota total de todo el
 * catálogo bit a bit igual a la que daba `viaje` con peso 10, porque
 * `viaje` ya pesaba el maletero al 0,5 y la habitabilidad al 0,5 (0,25 +
 * 0,25 entre batalla y hombros). Partir el eje, con estos pesos, no mueve
 * ninguna nota por sí solo.
 */
export const DEFAULT_WEIGHTS: AxisWeights = {
  carga: 5,
  habitabilidad: 5,
  diario: 7,
  fiabilidad: 7,
  estetica: 6,
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
  'coste',
];

export const AXIS_LABELS: Record<AxisId, string> = {
  carga: 'Capacidad de carga',
  habitabilidad: 'Espacio para los de atrás',
  diario: 'Facilidad de uso diario',
  prestaciones: 'Prestaciones',
  fiabilidad: 'Fiabilidad y garantía',
  estetica: 'Estética',
  coste: 'Coste total',
};
