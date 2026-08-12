import type { Car, SourcedNumber, Technology, UserRating } from './car';
import type { Reference } from './reference';
import type { Photos } from './photo';

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

/**
 * Las diecinueve magnitudes de `Car` que no son identidad, más la métrica
 * derivada de litros por metro cuadrado (product/0014, requisito 1;
 * product/0018 les añade Δ y polaridad): el inventario completo de «la
 * ficha». El orden y las etiquetas son cosa de la interfaz; aquí solo se
 * declaran las claves.
 */
export const FICHA_FIELDS = [
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
export type FichaField = (typeof FICHA_FIELDS)[number];

export type DeltaDirection = 'better' | 'worse' | 'neutral';

export interface FichaDelta {
  value: number;
  direction: DeltaDirection;
}

export type FichaCell =
  | {
      kind: 'sourced';
      value: number;
      unit?: string;
      estimated: boolean;
      delta: FichaDelta | null;
    }
  | { kind: 'rating'; value: number; delta: FichaDelta | null }
  | { kind: 'missing' };

export interface FichaEntity {
  kind: 'candidate' | 'reference';
  id: string;
  name: string;
  brand: string;
  technology: Technology;
  photos: Photos;
  cells: Record<FichaField, FichaCell>;
}

type DeltaPolarity = 'moreIsBetter' | 'moreIsWorse' | 'neutral';

/**
 * La dirección de «mejor» depende del dato (product/0013, requisito 8, y
 * product/0018, requisito 3, que la extiende de cinco magnitudes a veinte).
 * Las cinco primeras son las que ya declaró `product/0013` y no cambian:
 * en maletero más es mejor; en anchura y longitud, más es peor, porque el
 * problema que el proyecto resuelve es que los sustitutos son más grandes.
 * Altura y altura libre al suelo no tienen dirección declarada.
 */
const POLARITY: Record<FichaField, DeltaPolarity> = {
  lengthMm: 'moreIsWorse',
  widthMm: 'moreIsWorse',
  heightMm: 'neutral',
  trunkLiters: 'moreIsBetter',
  groundClearanceMm: 'neutral',

  // Más batalla da más espacio dentro y más coche fuera; el proyecto no ha
  // declarado cuál de las dos cosas le importa más, y ante la duda no se
  // inventa un juicio de color (product/0018, requisito 3.3).
  wheelbaseMm: 'neutral',
  // La magnitud que product/0017 añadió al eje de viaje precisamente porque
  // mide si caben tres personas atrás.
  rearShoulderWidthMm: 'moreIsBetter',
  // Litros de maletero por el sitio que el coche ocupa: cuanto más alto,
  // mejor aprovechado está el espacio.
  litersPerSquareMeter: 'moreIsBetter',

  // Dirección del eje de prestaciones.
  powerCv: 'moreIsBetter',
  // Penaliza consumo, frenada y agilidad; ningún eje lo premia.
  weightKg: 'moreIsWorse',
  // Son segundos: más segundos es más lento.
  acceleration0to100: 'moreIsWorse',
  // Dirección del eje de coste de tenencia.
  consumption: 'moreIsWorse',

  // Dirección del eje de coste de compra.
  priceEur: 'moreIsWorse',
  // Dirección del eje de coste de tenencia.
  maintenanceEurYear: 'moreIsWorse',
  // Lo que se recupera al vender.
  residualPct5y: 'moreIsBetter',

  // El índice sube con la fiabilidad.
  reliabilityOcu: 'moreIsBetter',
  // Dirección del eje de fiabilidad.
  warrantyYears: 'moreIsBetter',
  // Misma dirección que la garantía incondicional.
  warrantyExtensionYears: 'moreIsBetter',

  // Son notas del usuario sobre cinco: más nota es mejor en las dos.
  aestheticsExterior: 'moreIsBetter',
  aestheticsInterior: 'moreIsBetter',
};

function deltaDirection(
  delta: number,
  polarity: DeltaPolarity,
): DeltaDirection {
  if (polarity === 'neutral' || delta === 0) return 'neutral';
  if (polarity === 'moreIsBetter') return delta > 0 ? 'better' : 'worse';
  return delta > 0 ? 'worse' : 'better';
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

function sourcedCell(sourced: SourcedNumber | undefined): FichaCell {
  if (sourced === undefined) return { kind: 'missing' };
  return {
    kind: 'sourced',
    value: sourced.value,
    unit: sourced.unit,
    estimated: currentSourceOf(sourced).estimated,
    delta: null,
  };
}

function ratingCell(rating: UserRating | undefined): FichaCell {
  if (rating === undefined) return { kind: 'missing' };
  return { kind: 'rating', value: rating.value, delta: null };
}

/**
 * Sin rama para dimensiones ausentes: `lengthMm`, `widthMm` y `trunkLiters`
 * son obligatorios tanto en `Car` como en `Reference` (`docs/estado/dominio.md`),
 * así que esta función solo recibe entidades que ya los tienen.
 */
function litersPerSquareMeterCell(entity: EntityLike): FichaCell {
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
    delta: null,
  };
}

function cellsOf(entity: EntityLike): Record<FichaField, FichaCell> {
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

function candidateEntity(car: Car): FichaEntity {
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

function referenceEntity(reference: Reference): FichaEntity {
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
 * La ficha (product/0014, fundida con la técnica por product/0018): un
 * `FichaEntity` por candidato y por referencia, en el orden del catálogo.
 * Sin ordenar y sin Δ todavía —`sortFicha` y `withComparison` son pasos
 * aparte, deliberadamente: el orden y el modelo de comparación los elige
 * quien mira la ficha, no esta función—.
 */
export function buildFicha(
  cars: Car[],
  references: Reference[],
): FichaEntity[] {
  return [...cars.map(candidateEntity), ...references.map(referenceEntity)];
}

/** Construye un `Record<FichaField, T>` recorriendo `FICHA_FIELDS` una sola
 * vez: evita repetir las veinte claves cada vez que hace falta un registro
 * nuevo con esa forma. */
function mapFields<T>(fn: (field: FichaField) => T): Record<FichaField, T> {
  const result = {} as Record<FichaField, T>;
  for (const field of FICHA_FIELDS) {
    result[field] = fn(field);
  }
  return result;
}

function cellWithDelta(
  cell: FichaCell,
  comparison: FichaCell | undefined,
  field: FichaField,
): FichaCell {
  if (cell.kind === 'missing') return cell;
  if (comparison === undefined || comparison.kind === 'missing') {
    return { ...cell, delta: null };
  }
  const diff = cell.value - comparison.value;
  return {
    ...cell,
    delta: { value: diff, direction: deltaDirection(diff, POLARITY[field]) },
  };
}

/**
 * Recalcula la Δ de cada celda de cada entidad frente a la entidad
 * `comparisonId` (product/0018, requisitos 2.2-2.5). `comparisonId === null`
 * —el «Ninguno» del control— apaga todas las Δ: es la misma vía que
 * comparar contra una entidad que no existe, sin necesitar una rama aparte.
 * La propia entidad de comparación nunca lleva Δ contra sí misma: sería
 * siempre cero y no dice nada.
 */
export function withComparison(
  entities: FichaEntity[],
  comparisonId: string | null,
): FichaEntity[] {
  const comparison = entities.find((entity) => entity.id === comparisonId);

  return entities.map((entity) => {
    const against = entity.id === comparison?.id ? undefined : comparison;
    return {
      ...entity,
      cells: mapFields((field) =>
        cellWithDelta(entity.cells[field], against?.cells[field], field),
      ),
    };
  });
}

export type FichaSortCriterion =
  'catalog' | 'lengthMm' | 'widthMm' | 'priceEur';

function numericValueOf(cell: FichaCell): number | undefined {
  return cell.kind === 'missing' ? undefined : cell.value;
}

/**
 * Ordena las entidades por el criterio elegido (product/0018, requisito 5).
 * `catalog` conserva el orden de `buildFicha`, que es el del propio
 * catálogo. Una entidad sin la magnitud por la que se ordena va al final:
 * no hay dato que defender en esa posición, así que el orden relativo entre
 * dos entidades que ambas carecen del dato no se declara.
 */
export function sortFicha(
  entities: FichaEntity[],
  criterion: FichaSortCriterion,
): FichaEntity[] {
  if (criterion === 'catalog') return entities;
  return [...entities].sort((a, b) => {
    const valueA = numericValueOf(a.cells[criterion]);
    const valueB = numericValueOf(b.cells[criterion]);
    if (valueA === undefined && valueB === undefined) return 0;
    if (valueA === undefined) return 1;
    if (valueB === undefined) return -1;
    return valueA - valueB;
  });
}
