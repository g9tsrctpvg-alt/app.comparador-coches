import type { Car } from './car';
import type { SourcedNumber } from './car';
import type { Reference } from './reference';
import type { Technology } from './car';

/**
 * Litros de maletero por metro cuadrado de huella en el suelo (product/0013,
 * requisito 11): mide cuánto espacio da un coche por el sitio que ocupa.
 * Vive en el dominio para que `src/ui/` no divida nada
 * (`ui-no-scoring-internals` extendida a esta spec).
 */
export function litrosPorMetroCuadrado(
  trunkLiters: number,
  lengthMm: number,
  widthMm: number,
): number {
  const areaM2 = (lengthMm / 1000) * (widthMm / 1000);
  return trunkLiters / areaM2;
}

type DimensionField =
  'lengthMm' | 'widthMm' | 'heightMm' | 'groundClearanceMm' | 'trunkLiters';

type DeltaPolarity = 'moreIsBetter' | 'moreIsWorse' | 'neutral';

// La dirección de «mejor» depende del dato (requisito 8): en maletero más es
// mejor; en anchura y longitud, más es peor, porque el problema que el
// proyecto resuelve es que los sustitutos son más grandes. Altura y altura
// libre al suelo no tienen una dirección declarada en la spec, así que su Δ
// se muestra sin juicio de color.
const POLARITY: Record<DimensionField, DeltaPolarity> = {
  lengthMm: 'moreIsWorse',
  widthMm: 'moreIsWorse',
  heightMm: 'neutral',
  groundClearanceMm: 'neutral',
  trunkLiters: 'moreIsBetter',
};

export type DeltaDirection = 'better' | 'worse' | 'neutral';

export interface TechnicalSheetDelta {
  value: number;
  direction: DeltaDirection;
}

export interface TechnicalSheetDimension {
  valueMm: number;
  estimated: boolean;
  delta: TechnicalSheetDelta | null;
}

export interface TechnicalSheetRow {
  kind: 'candidate' | 'reference';
  id: string;
  name: string;
  brand: string;
  technology: Technology;
  lengthMm: TechnicalSheetDimension;
  widthMm: TechnicalSheetDimension;
  heightMm: TechnicalSheetDimension;
  groundClearanceMm: TechnicalSheetDimension;
  trunkLiters: TechnicalSheetDimension;
  litersPerSquareMeter: { value: number; estimated: boolean };
}

/**
 * `sourcedValueSchema` garantiza exactamente una fuente vigente por
 * construcción; esto se lo dice a TypeScript sin un `?? false` que
 * enmascararía la invariante rota en vez de fallar por ella.
 */
export function currentSourceOf(sourced: SourcedNumber) {
  const current = sourced.sources.find((source) => source.current);
  if (current === undefined) {
    throw new Error(
      'Invariante rota: un valor con fuente debe tener exactamente una fuente vigente',
    );
  }
  return current;
}

function isEstimated(sourced: SourcedNumber): boolean {
  return currentSourceOf(sourced).estimated;
}

function deltaDirection(
  delta: number,
  polarity: DeltaPolarity,
): DeltaDirection {
  if (polarity === 'neutral' || delta === 0) return 'neutral';
  if (polarity === 'moreIsBetter') return delta > 0 ? 'better' : 'worse';
  return delta > 0 ? 'worse' : 'better';
}

function dimensionCell(
  field: DimensionField,
  sourced: SourcedNumber,
  reference: SourcedNumber | undefined,
): TechnicalSheetDimension {
  const delta =
    reference === undefined
      ? null
      : {
          value: sourced.value - reference.value,
          direction: deltaDirection(
            sourced.value - reference.value,
            POLARITY[field],
          ),
        };
  return { valueMm: sourced.value, estimated: isEstimated(sourced), delta };
}

function litersPerSquareMeterOf(entity: {
  lengthMm: SourcedNumber;
  widthMm: SourcedNumber;
  trunkLiters: SourcedNumber;
}): { value: number; estimated: boolean } {
  return {
    value: litrosPorMetroCuadrado(
      entity.trunkLiters.value,
      entity.lengthMm.value,
      entity.widthMm.value,
    ),
    estimated:
      isEstimated(entity.lengthMm) ||
      isEstimated(entity.widthMm) ||
      isEstimated(entity.trunkLiters),
  };
}

function candidateRow(
  car: Car,
  reference: Reference | undefined,
): TechnicalSheetRow {
  return {
    kind: 'candidate',
    id: car.id,
    name: car.name,
    brand: car.brand,
    technology: car.technology,
    lengthMm: dimensionCell('lengthMm', car.lengthMm, reference?.lengthMm),
    widthMm: dimensionCell('widthMm', car.widthMm, reference?.widthMm),
    heightMm: dimensionCell('heightMm', car.heightMm, reference?.heightMm),
    groundClearanceMm: dimensionCell(
      'groundClearanceMm',
      car.groundClearanceMm,
      reference?.groundClearanceMm,
    ),
    trunkLiters: dimensionCell(
      'trunkLiters',
      car.trunkLiters,
      reference?.trunkLiters,
    ),
    litersPerSquareMeter: litersPerSquareMeterOf(car),
  };
}

function referenceRow(reference: Reference): TechnicalSheetRow {
  return {
    kind: 'reference',
    id: reference.id,
    name: reference.name,
    brand: reference.brand,
    technology: reference.technology,
    lengthMm: dimensionCell('lengthMm', reference.lengthMm, undefined),
    widthMm: dimensionCell('widthMm', reference.widthMm, undefined),
    heightMm: dimensionCell('heightMm', reference.heightMm, undefined),
    groundClearanceMm: dimensionCell(
      'groundClearanceMm',
      reference.groundClearanceMm,
      undefined,
    ),
    trunkLiters: dimensionCell('trunkLiters', reference.trunkLiters, undefined),
    litersPerSquareMeter: litersPerSquareMeterOf(reference),
  };
}

/**
 * La ficha técnica comparada (product/0013): una fila por candidato más una
 * por cada referencia, ordenadas por longitud ascendente. Las columnas Δ de
 * los candidatos se calculan contra la **referencia vigente** —la primera de
 * la lista, no un identificador escrito aquí—, así que añadir una segunda
 * referencia al fichero de datos no exige tocar esta función ni ningún
 * componente (requisito 5).
 */
export function buildTechnicalSheet(
  cars: Car[],
  references: Reference[],
): TechnicalSheetRow[] {
  const currentReference = references[0];
  const rows = [
    ...cars.map((car) => candidateRow(car, currentReference)),
    ...references.map((reference) => referenceRow(reference)),
  ];
  return rows.sort((a, b) => a.lengthMm.valueMm - b.lengthMm.valueMm);
}
