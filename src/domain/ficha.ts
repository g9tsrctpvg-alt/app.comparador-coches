import type {
  Car,
  Generation,
  SourcedNumber,
  Technology,
  UserRating,
} from './car';
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
 * Las veinticuatro magnitudes de `Car` que no son identidad, más la métrica
 * derivada de litros por metro cuadrado (product/0014, requisito 1;
 * product/0018 les añade Δ y polaridad; product/0021 añade las dos de
 * generación; product/0028 añade autonomía eléctrica y batería; product/0032
 * añade el diámetro de giro): el inventario completo de «la ficha». El orden
 * y las etiquetas son cosa de la interfaz; aquí solo se declaran las claves.
 */
export const FICHA_FIELDS = [
  'generationLaunchYear',
  'generationFaceliftYear',
  'lengthMm',
  'widthMm',
  'heightMm',
  'wheelbaseMm',
  'turningCircleM',
  'rearShoulderWidthMm',
  'groundClearanceMm',
  'trunkLiters',
  'litersPerSquareMeter',
  'powerCv',
  'weightKg',
  'acceleration0to100',
  'consumption',
  'electricRangeKm',
  'batteryKwh',
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

/**
 * `null` — no hay comparación activa, o esta es la propia celda de
 * referencia (product/0018, requisitos 2.3-2.4): no se muestra nada.
 * `'unavailable'` — hay comparación, pero esta celda no se puede comparar
 * contra ella: la referencia no declara el dato (requisito 2.5), o los dos
 * valores están en unidades distintas y restarlos no diría nada (p. ej.
 * `consumption` mezcla `l/100km` de combustión con `kWh/100km` eléctrico).
 * Las dos se muestran igual —la raya con texto accesible—, porque las dos
 * son la misma idea: no hay una Δ que decir, no que la Δ sea cero.
 */
export type FichaCell =
  | {
      kind: 'sourced';
      value: number;
      unit?: string;
      estimated: boolean;
      delta: FichaDelta | null | 'unavailable';
    }
  | { kind: 'rating'; value: number; delta: FichaDelta | null | 'unavailable' }
  | { kind: 'missing' };

export interface FichaEntity {
  kind: 'candidate' | 'reference';
  id: string;
  name: string;
  brand: string;
  technology: Technology;
  /** Código de generación del fabricante, si el registro lo declara
   * (product/0021, requisito 2.5): texto de apoyo de la fila de
   * `generationLaunchYear`, no una celda comparable propia. */
  generationCode?: string;
  photos: Photos;
  cells: Record<FichaField, FichaCell>;
}

type DeltaPolarity = 'moreIsBetter' | 'moreIsWorse' | 'neutral';

/**
 * La dirección de «mejor» depende del dato (product/0013, requisito 8, y
 * product/0018, requisito 3, que la extiende de cinco magnitudes a todas).
 * Las cinco primeras son las que ya declaró `product/0013` y no cambian:
 * en maletero más es mejor; en anchura y longitud, más es peor, porque el
 * problema que el proyecto resuelve es que los sustitutos son más grandes.
 * Altura y altura libre al suelo no tienen dirección declarada.
 */
const POLARITY: Record<FichaField, DeltaPolarity> = {
  // El ADR 0009 decide que el calendario no entra en la puntuación: más
  // nuevo no está declarado como mejor, igual que la batalla o la altura
  // libre al suelo (product/0021, requisito 2.2).
  generationLaunchYear: 'neutral',
  generationFaceliftYear: 'neutral',

  lengthMm: 'moreIsWorse',
  widthMm: 'moreIsWorse',
  heightMm: 'neutral',
  trunkLiters: 'moreIsBetter',
  groundClearanceMm: 'neutral',

  // Más batalla da más espacio dentro y más coche fuera; el proyecto no ha
  // declarado cuál de las dos cosas le importa más, y ante la duda no se
  // inventa un juicio de color (product/0018, requisito 3.3).
  wheelbaseMm: 'neutral',
  // A diferencia de la batalla, aquí sí hay una dirección afirmable sin
  // matices (product/0032, requisito 3.3): a igualdad de todo lo demás,
  // nadie prefiere necesitar más sitio para dar la vuelta.
  turningCircleM: 'moreIsWorse',
  // La magnitud que product/0017 añadió al eje de espacio precisamente
  // porque mide si caben tres personas atrás; hoy es una de las dos que
  // puntúa `habitabilidad` (product/0033).
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
  // Kilómetros con la batería llena: aquí sí hay una dirección que el
  // proyecto puede afirmar sin matices (product/0028, requisito 3.2).
  electricRangeKm: 'moreIsBetter',
  // Más batería es más alcance, pero también más peso, más precio y más
  // tiempo de carga, y el proyecto no ha declarado cuál de las dos cosas le
  // importa más — el mismo caso que la batalla (product/0028, requisito
  // 3.3). Describe lo que el coche lleva, no si eso es bueno.
  batteryKwh: 'neutral',

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

/** La polaridad declarada de `field` (product/0031, requisito 1.2): qué
 * dirección de la magnitud cuenta como «mejor». Expuesta para que
 * `eliminatoryRules.ts` pueda forzar el operador de un imprescindible sin
 * que la tabla `POLARITY` se duplique fuera de este fichero. */
export function polarityOf(field: FichaField): DeltaPolarity {
  return POLARITY[field];
}

/** El único operador de imprescindible que la polaridad de `field` permite
 * —`'min'` en los `moreIsBetter`, `'max'` en los `moreIsWorse`— o `null` en
 * los `neutral`, donde las dos opciones son válidas (product/0031, requisito
 * 1.2). El tipo de retorno es literal y no `RuleOperator`
 * (`eliminatoryRules.ts`) a propósito: ese módulo importa de este, nunca al
 * revés, así que este fichero no puede nombrar un tipo suyo. */
export function forcedRuleOperator(field: FichaField): 'min' | 'max' | null {
  const polarity = polarityOf(field);
  if (polarity === 'moreIsBetter') return 'min';
  if (polarity === 'moreIsWorse') return 'max';
  return null;
}

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
  generation: Generation;
  lengthMm: SourcedNumber;
  widthMm: SourcedNumber;
  heightMm?: SourcedNumber;
  wheelbaseMm?: SourcedNumber;
  turningCircleM?: SourcedNumber;
  rearShoulderWidthMm?: SourcedNumber;
  groundClearanceMm?: SourcedNumber;
  trunkLiters: SourcedNumber;
  powerCv?: SourcedNumber;
  weightKg?: SourcedNumber;
  acceleration0to100?: SourcedNumber;
  consumption?: SourcedNumber;
  electricRangeKm?: SourcedNumber;
  batteryKwh?: SourcedNumber;
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
    generationLaunchYear: sourcedCell(entity.generation.launchYear),
    generationFaceliftYear: sourcedCell(entity.generation.faceliftYear),
    lengthMm: sourcedCell(entity.lengthMm),
    widthMm: sourcedCell(entity.widthMm),
    heightMm: sourcedCell(entity.heightMm),
    wheelbaseMm: sourcedCell(entity.wheelbaseMm),
    turningCircleM: sourcedCell(entity.turningCircleM),
    rearShoulderWidthMm: sourcedCell(entity.rearShoulderWidthMm),
    groundClearanceMm: sourcedCell(entity.groundClearanceMm),
    trunkLiters: sourcedCell(entity.trunkLiters),
    litersPerSquareMeter: litersPerSquareMeterCell(entity),
    powerCv: sourcedCell(entity.powerCv),
    weightKg: sourcedCell(entity.weightKg),
    acceleration0to100: sourcedCell(entity.acceleration0to100),
    consumption: sourcedCell(entity.consumption),
    electricRangeKm: sourcedCell(entity.electricRangeKm),
    batteryKwh: sourcedCell(entity.batteryKwh),
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

function entityOf(
  kind: FichaEntity['kind'],
  source: Car | Reference,
): FichaEntity {
  return {
    kind,
    id: source.id,
    name: source.name,
    brand: source.brand,
    technology: source.technology,
    generationCode: source.generation.code,
    photos: source.photos,
    cells: cellsOf(source),
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
  return [
    ...cars.map((car) => entityOf('candidate', car)),
    ...references.map((reference) => entityOf('reference', reference)),
  ];
}

/** Construye un `Record<FichaField, T>` recorriendo `FICHA_FIELDS` una sola
 * vez: evita repetir las veinticinco claves cada vez que hace falta un
 * registro nuevo con esa forma. */
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
  if (comparison === undefined) {
    return { ...cell, delta: null };
  }
  if (comparison.kind === 'missing') {
    return { ...cell, delta: 'unavailable' };
  }
  if (
    cell.kind === 'sourced' &&
    comparison.kind === 'sourced' &&
    cell.unit !== comparison.unit
  ) {
    return { ...cell, delta: 'unavailable' };
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

/**
 * Por qué se puede ordenar la ficha (product/0027, requisito 1): el orden
 * del propio catálogo, más **todas** las magnitudes de la ficha. Se deriva
 * de `FICHA_FIELDS` en vez de repetir sus claves, así que una magnitud nueva
 * es ordenable el mismo día que existe, sin una segunda lista que nadie
 * recuerda actualizar.
 */
export const FICHA_SORT_CRITERIA = ['catalog', ...FICHA_FIELDS] as const;
export type FichaSortCriterion = (typeof FICHA_SORT_CRITERIA)[number];

/** Los dos conjuntos de campos de la ficha (product/0020): fuente única
 * para el tipo, reutilizada por `viewState.ts` para validar el valor
 * restaurado sin que `domain/` conozca `FichaPage.tsx`. */
export const FIELD_SETS = ['esenciales', 'completa'] as const;
export type FieldSet = (typeof FIELD_SETS)[number];

function numericValueOf(cell: FichaCell): number | undefined {
  return cell.kind === 'missing' ? undefined : cell.value;
}

/** El valor numérico de cada campo, para las veinticinco magnitudes que ya
 * tiene calculadas un `FichaEntity` (product/0031, requisito 1.4): la misma
 * vía que decide si una celda «no tiene dato» decide si un imprescindible
 * cuenta o no cuenta para ese coche. `undefined` cuando la celda es
 * `'missing'`, nunca `NaN` ni un valor inventado. */
export function numericValuesFromCells(
  cells: Record<FichaField, FichaCell>,
): Partial<Record<FichaField, number>> {
  return mapFields((field) => numericValueOf(cells[field]));
}

/** Atajo de `numericValuesFromCells(cellsOf(source))` para quien solo tiene
 * el `Car` o la `Reference` crudos —la clasificación, que no construye un
 * `FichaEntity` completo— y no quiere repetir la extracción de campo a
 * campo que `cellsOf` ya hace. */
export function numericFieldValues(
  source: EntityLike,
): Partial<Record<FichaField, number>> {
  return numericValuesFromCells(cellsOf(source));
}

/**
 * Hacia dónde ordena una magnitud (product/0027, requisito 4): el mejor
 * primero, leyendo la misma tabla de polaridad con la que se colorea la Δ.
 * Donde más es mejor se ordena descendente; donde más es peor, y donde no
 * hay dirección declarada, ascendente — que es el orden natural de leer un
 * número y no afirma ningún mérito. Las tres opciones que existían antes de
 * esta spec —longitud, anchura y precio— son las tres `moreIsWorse`, así que
 * siguen ordenando ascendente, exactamente igual que antes (requisito 5).
 */
function sortSign(field: FichaField): 1 | -1 {
  return POLARITY[field] === 'moreIsBetter' ? -1 : 1;
}

/**
 * Ordena las entidades por el criterio elegido (product/0018, requisito 5;
 * product/0027 lo extiende a todas las magnitudes y le da dirección).
 * `catalog` conserva el orden de `buildFicha`, que es el del propio
 * catálogo. Una entidad sin la magnitud por la que se ordena va al final en
 * las dos direcciones: no hay dato que defender en esa posición, y la
 * ausencia no es un valor extremo que deba encabezar un orden descendente.
 * El orden relativo entre dos entidades que ambas carecen del dato no se
 * declara.
 */
export function sortFicha(
  entities: FichaEntity[],
  criterion: FichaSortCriterion,
): FichaEntity[] {
  if (criterion === 'catalog') return entities;
  const sign = sortSign(criterion);
  return [...entities].sort((a, b) => {
    const valueA = numericValueOf(a.cells[criterion]);
    const valueB = numericValueOf(b.cells[criterion]);
    if (valueA === undefined && valueB === undefined) return 0;
    if (valueA === undefined) return 1;
    if (valueB === undefined) return -1;
    return sign * (valueA - valueB);
  });
}
