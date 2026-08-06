export type AxisId =
  | 'viaje'
  | 'diario'
  | 'prestaciones'
  | 'fiabilidad'
  | 'estetica'
  | 'coste';

export type AxisWeights = Record<AxisId, number>;

export const DEFAULT_WEIGHTS: AxisWeights = {
  viaje: 4,
  diario: 3,
  fiabilidad: 2,
  estetica: 2,
  prestaciones: 1,
  coste: 1,
};

export const AXIS_ORDER: AxisId[] = [
  'viaje',
  'diario',
  'prestaciones',
  'fiabilidad',
  'estetica',
  'coste',
];

export const AXIS_LABELS: Record<AxisId, string> = {
  viaje: 'Espacio y confort en viaje',
  diario: 'Facilidad de uso diario',
  prestaciones: 'Prestaciones',
  fiabilidad: 'Fiabilidad y garantía',
  estetica: 'Estética',
  coste: 'Coste total',
};
