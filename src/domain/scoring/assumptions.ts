/**
 * Supuestos globales del modelo de coste y de los ejes derivados. Se editan
 * en un único panel (requisito 10 de product/0001): ningún desglose ofrece
 * edición propia de estos valores, solo los muestra aplicados.
 */
export interface GlobalAssumptions {
  kmPorAnio: number;
  anios: number;
  precioLitro: number;
  precioKwh: number;
  mezclaEstetica: number;
  ponderacionAnchoDiario: number;
  pensandoVender: boolean;
  cargaEnCasa: boolean;
}

export const DEFAULT_ASSUMPTIONS: GlobalAssumptions = {
  kmPorAnio: 15000,
  anios: 12,
  precioLitro: 1.55,
  precioKwh: 0.45,
  mezclaEstetica: 0.6,
  ponderacionAnchoDiario: 0.6,
  pensandoVender: false,
  cargaEnCasa: false,
};
