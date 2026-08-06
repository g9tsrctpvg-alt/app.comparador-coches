import type { Technology } from '../domain/car';

/** La etiqueta legible de cada tecnología (product/0008): la sigla se queda
 * en el modelo de datos y en `cars.json`, la etiqueta es cosa de la
 * interfaz — la misma separación que ya rige entre `axisId` y su `label`. */
export const TECHNOLOGY_LABELS: Record<Technology, string> = {
  ICE: 'Combustión',
  MHEV: 'Híbrido ligero',
  HEV: 'Híbrido',
  PHEV: 'Híbrido enchufable',
  EV: 'Eléctrico',
};
