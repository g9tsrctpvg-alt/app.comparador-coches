export type AxisId =
  'viaje' | 'diario' | 'prestaciones' | 'fiabilidad' | 'estetica' | 'coste';

export type AxisWeights = Record<AxisId, number>;

export const DEFAULT_WEIGHTS: AxisWeights = {
  viaje: 10,
  diario: 7,
  fiabilidad: 7,
  estetica: 6,
  prestaciones: 5,
  coste: 5,
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
