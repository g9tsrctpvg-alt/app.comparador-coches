import type { Car, SourcedNumber, Technology, UserRating } from './car';
import type { Reference } from './reference';
import type { Photos } from './photo';
import { currentSourceOf, litrosPorMetroCuadrado } from './technicalSheet';

export type FichaCompletaCell =
  | { kind: 'sourced'; value: number; unit?: string; estimated: boolean }
  | { kind: 'rating'; value: number }
  | { kind: 'missing' };

/**
 * Las diecinueve magnitudes de `Car` que no son identidad, más la métrica
 * derivada de litros por metro cuadrado (product/0014, requisito 1): el
 * inventario completo de "la ficha", no las cinco columnas que eligió
 * `product/0013`. El orden y las etiquetas son cosa de la interfaz —igual
 * que `DIMENSION_COLUMNS` en `FichaTecnicaPage`—; aquí solo se declaran las
 * claves.
 */
export const FICHA_COMPLETA_FIELDS = [
  'lengthMm',
  'widthMm',
  'heightMm',
  'wheelbaseMm',
  'rearShoulderWidthMm',
  'groundClearanceMm',
  'trunkLiters',
  'litersPerSquareMeter',
  'powerCv',
  'weightKg',
  'acceleration0to100',
  'consumption',
  'priceEur',
  'maintenanceEurYear',
  'residualPct5y',
  'reliabilityOcu',
  'warrantyYears',
  'warrantyExtensionYears',
  'aestheticsExterior',
  'aestheticsInterior',
] as const;
export type FichaCompletaField = (typeof FICHA_COMPLETA_FIELDS)[number];

export interface FichaCompletaEntity {
  kind: 'candidate' | 'reference';
  id: string;
  name: string;
  brand: string;
  technology: Technology;
  photos: Photos;
  cells: Record<FichaCompletaField, FichaCompletaCell>;
}

/**
 * Forma común a `Car` y `Reference` para extraer celdas sin dos funciones
 * casi iguales: `Reference` solo declara las cinco dimensionales
 * (`docs/estado/dominio.md`), así que el resto llega `undefined` por su
 * propia forma, sin ningún `if` que lo distinga aquí.
 */
interface EntityLike {
  lengthMm: SourcedNumber;
  widthMm: SourcedNumber;
  heightMm?: SourcedNumber;
  wheelbaseMm?: SourcedNumber;
  rearShoulderWidthMm?: SourcedNumber;
  groundClearanceMm?: SourcedNumber;
  trunkLiters: SourcedNumber;
  powerCv?: SourcedNumber;
  weightKg?: SourcedNumber;
  acceleration0to100?: SourcedNumber;
  consumption?: SourcedNumber;
  priceEur?: SourcedNumber;
  maintenanceEurYear?: SourcedNumber;
  residualPct5y?: SourcedNumber;
  reliabilityOcu?: SourcedNumber;
  warrantyYears?: SourcedNumber;
  warrantyExtension?: { years: SourcedNumber };
  aestheticsExterior?: UserRating;
  aestheticsInterior?: UserRating;
}

function sourcedCell(sourced: SourcedNumber | undefined): FichaCompletaCell {
  if (sourced === undefined) return { kind: 'missing' };
  return {
    kind: 'sourced',
    value: sourced.value,
    unit: sourced.unit,
    estimated: currentSourceOf(sourced).estimated,
  };
}

function ratingCell(rating: UserRating | undefined): FichaCompletaCell {
  if (rating === undefined) return { kind: 'missing' };
  return { kind: 'rating', value: rating.value };
}

/**
 * Sin rama para dimensiones ausentes: `lengthMm`, `widthMm` y `trunkLiters`
 * son obligatorios tanto en `Car` como en `Reference` (`docs/estado/dominio.md`),
 * así que esta función solo recibe entidades que ya los tienen.
 */
function litersPerSquareMeterCell(entity: EntityLike): FichaCompletaCell {
  const { lengthMm, widthMm, trunkLiters } = entity;
  return {
    kind: 'sourced',
    value: litrosPorMetroCuadrado(
      trunkLiters.value,
      lengthMm.value,
      widthMm.value,
    ),
    unit: 'L/m²',
    estimated:
      currentSourceOf(lengthMm).estimated ||
      currentSourceOf(widthMm).estimated ||
      currentSourceOf(trunkLiters).estimated,
  };
}

function cellsOf(
  entity: EntityLike,
): Record<FichaCompletaField, FichaCompletaCell> {
  return {
    lengthMm: sourcedCell(entity.lengthMm),
    widthMm: sourcedCell(entity.widthMm),
    heightMm: sourcedCell(entity.heightMm),
    wheelbaseMm: sourcedCell(entity.wheelbaseMm),
    rearShoulderWidthMm: sourcedCell(entity.rearShoulderWidthMm),
    groundClearanceMm: sourcedCell(entity.groundClearanceMm),
    trunkLiters: sourcedCell(entity.trunkLiters),
    litersPerSquareMeter: litersPerSquareMeterCell(entity),
    powerCv: sourcedCell(entity.powerCv),
    weightKg: sourcedCell(entity.weightKg),
    acceleration0to100: sourcedCell(entity.acceleration0to100),
    consumption: sourcedCell(entity.consumption),
    priceEur: sourcedCell(entity.priceEur),
    maintenanceEurYear: sourcedCell(entity.maintenanceEurYear),
    residualPct5y: sourcedCell(entity.residualPct5y),
    reliabilityOcu: sourcedCell(entity.reliabilityOcu),
    warrantyYears: sourcedCell(entity.warrantyYears),
    warrantyExtensionYears: sourcedCell(entity.warrantyExtension?.years),
    aestheticsExterior: ratingCell(entity.aestheticsExterior),
    aestheticsInterior: ratingCell(entity.aestheticsInterior),
  };
}

function candidateEntity(car: Car): FichaCompletaEntity {
  return {
    kind: 'candidate',
    id: car.id,
    name: car.name,
    brand: car.brand,
    technology: car.technology,
    photos: car.photos,
    cells: cellsOf(car),
  };
}

function referenceEntity(reference: Reference): FichaCompletaEntity {
  return {
    kind: 'reference',
    id: reference.id,
    name: reference.name,
    brand: reference.brand,
    technology: reference.technology,
    photos: reference.photos,
    cells: cellsOf(reference),
  };
}

/**
 * La ficha completa (product/0014): un `FichaCompletaEntity` por candidato y
 * por referencia, en el orden del catálogo. No ordena por longitud —a
 * diferencia de `buildTechnicalSheet`— porque aquí el orden lo decide qué
 * columna esté fijada, no una magnitud; eso es responsabilidad de la
 * interfaz, no de esta función.
 */
export function buildFichaCompleta(
  cars: Car[],
  references: Reference[],
): FichaCompletaEntity[] {
  return [...cars.map(candidateEntity), ...references.map(referenceEntity)];
}
