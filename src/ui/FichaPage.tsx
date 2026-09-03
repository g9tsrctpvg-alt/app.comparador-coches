import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { Car } from '../domain/car';
import {
  decisionOf,
  entryOf,
  passesDecisionFilter,
  type DecisionLog,
  type StoredDecisionState,
} from '../domain/decisions';
import type { Reference } from '../domain/reference';
import {
  buildFicha,
  numericValuesFromCells,
  sortFicha,
  withComparison,
  type DeltaDirection,
  type FichaCell,
  type FichaEntity,
  type FichaField,
  type FichaSortCriterion,
  type FieldSet,
} from '../domain/ficha';
import {
  PHOTO_VIEWS,
  photoSequence,
  photoSrc,
  type PhotoView,
} from '../domain/photo';
import type { CarScoreBreakdown } from '../domain/scoring/breakdown';
import type { AxisWeights } from '../domain/scoring/weights';
import {
  evaluateRules,
  type EliminatoryRule,
  type RuleFailure,
} from '../domain/eliminatoryRules';
import { formatEur, formatNumber, formatSigned } from './format';
import { TECHNOLOGY_LABELS } from './technologyLabels';
import { DecisionEditor } from './components/DecisionEditor';
import { DecisionMark } from './components/DecisionMark';
import { EligibilityMark } from './components/EligibilityMark';
import { EstimatedMark } from './components/EstimatedMark';
import { ScoreGapPanel } from './components/ScoreGapPanel';
import { useViewState } from './useViewState';
import { visitaHashFor } from './useHashRoute';
import primitives from './primitives.module.css';
import shellStyles from './components/AppShell.module.css';
import styles from './FichaPage.module.css';

interface FichaPageProps {
  cars: Car[];
  references: Reference[];
  scoredCars: CarScoreBreakdown[];
  weights: AxisWeights;
  /** Los imprescindibles vigentes (product/0031): opcional y por defecto
   * vacío, para que los muchos sitios de `FichaPage.test.tsx` que no tocan
   * este requisito no tengan que pasarlo. */
  eliminatoryRules?: EliminatoryRule[];
  decisionLog: DecisionLog;
  onSetDecision: (
    carId: string,
    state: StoredDecisionState,
    reason: string | undefined,
  ) => void;
  onClearDecision: (carId: string) => void;
}

const PHOTO_VIEW_LABELS: Record<PhotoView, string> = {
  front: 'Frontal',
  side: 'Lateral',
  rear: 'Trasera',
  trunk: 'Maletero',
  interior: 'Interior',
};

// Exportado para que `EliminatoryRulesPanel` e `IneligibleRow` (product/0031)
// puedan formatear un umbral con la misma unidad y los mismos decimales que
// la propia celda de la ficha, sin declarar su propio `FieldDef`.
export interface FieldDef {
  key: FichaField;
  label: string;
  unitFallback?: string;
  decimals?: number;
  isEuro?: boolean;
}

interface BlockDef {
  id: string;
  /** `null` cuando el grupo no necesita cabecera propia (requisito 4.3):
   * en «Esenciales» solo hay un grupo, y rotularlo no añade nada. */
  label: string | null;
  fields: FieldDef[];
}

/** Un bloque de «Completa»: siempre rotulado. Ese `label: string` no es
 * cosmético — es lo que deja que los mismos seis bloques den nombre a los
 * `<optgroup>` del selector de orden (product/0027, requisito 3) sin
 * inventar un rótulo de respaldo para un `null` que ahí no puede darse. */
type CompleteBlockDef = BlockDef & { label: string };

/**
 * Las veintiséis magnitudes de la ficha (product/0014, requisito 1;
 * product/0018 las reparte en dos conjuntos; product/0021 añade el bloque
 * de generación; product/0028 añade autonomía eléctrica y batería;
 * product/0032 añade el diámetro de giro; product/0034 añade la carga
 * máxima sobre el techo), agrupadas y rotuladas — el dominio (`ficha.ts`)
 * solo declara las claves y extrae los valores; etiquetas, unidades de
 * respaldo y decimales son decisión de la interfaz.
 */
// Exportado además de `COMPLETE_FIELD_DEFS` (más abajo) para que
// `EliminatoryRulesPanel` (product/0031) pueda agrupar el selector de
// magnitud por los mismos seis bloques que ya agrupan «Orden»
// (product/0027), sin una segunda declaración de la agrupación.
export const COMPLETE_BLOCKS: CompleteBlockDef[] = [
  {
    // Primer bloque, antes de «Tamaño y espacio» (product/0021, requisito
    // 2.1): en qué punto tecnológico está el coche es contexto para leer
    // todo lo demás. Sin nota propia, sin dirección declarada —el ADR 0009
    // decide que el calendario no puntúa—, solo comparable.
    id: 'generacion',
    label: 'Generación',
    fields: [
      { key: 'generationLaunchYear', label: 'Generación' },
      { key: 'generationFaceliftYear', label: 'Retoque' },
    ],
  },
  {
    id: 'tamano',
    label: 'Tamaño y espacio',
    fields: [
      { key: 'lengthMm', label: 'Longitud', unitFallback: 'mm' },
      { key: 'widthMm', label: 'Anchura', unitFallback: 'mm' },
      { key: 'heightMm', label: 'Altura', unitFallback: 'mm' },
      { key: 'wheelbaseMm', label: 'Batalla', unitFallback: 'mm' },
      // Justo detrás de la batalla, que es el factor que más manda en el
      // giro (product/0032, requisito 3.1): ponerlas seguidas hace visible
      // cuándo un coche gira corto o largo *para* su batalla.
      {
        key: 'turningCircleM',
        label: 'Diámetro de giro',
        unitFallback: 'm',
        decimals: 1,
      },
      {
        key: 'rearShoulderWidthMm',
        label: 'Anchura de hombros atrás',
        unitFallback: 'mm',
      },
      {
        key: 'groundClearanceMm',
        label: 'Altura libre al suelo',
        unitFallback: 'mm',
      },
      { key: 'trunkLiters', label: 'Maletero', unitFallback: 'L' },
      {
        key: 'litersPerSquareMeter',
        label: 'Litros por m²',
        unitFallback: 'L/m²',
        decimals: 1,
      },
      {
        key: 'maxRoofLoadKg',
        label: 'Carga máxima en techo',
        unitFallback: 'kg',
      },
    ],
  },
  {
    id: 'mecanica',
    label: 'Mecánica y prestaciones',
    fields: [
      { key: 'powerCv', label: 'Potencia', unitFallback: 'CV' },
      { key: 'weightKg', label: 'Peso', unitFallback: 'kg' },
      {
        key: 'acceleration0to100',
        label: 'Aceleración 0-100',
        unitFallback: 's',
        decimals: 1,
      },
      { key: 'consumption', label: 'Consumo', decimals: 1 },
      // Consumo, autonomía y batería son la misma pregunta contada por sus
      // tres caras, y por eso van seguidas (product/0028, requisito 3.1).
      {
        key: 'electricRangeKm',
        label: 'Autonomía eléctrica',
        unitFallback: 'km',
      },
      // Dos decimales, y no por gusto: las capacidades de los híbridos y
      // microhíbridos van de 0,77 a 1,49 kWh, y con uno solo 0,77 y 0,85 se
      // leerían las dos como «0,8» (product/0028, requisito 3.5).
      {
        key: 'batteryKwh',
        label: 'Batería',
        unitFallback: 'kWh',
        decimals: 2,
      },
    ],
  },
  {
    id: 'coste',
    label: 'Coste',
    fields: [
      { key: 'priceEur', label: 'Precio', isEuro: true },
      { key: 'maintenanceEurYear', label: 'Mantenimiento', isEuro: true },
      {
        key: 'residualPct5y',
        label: 'Valor residual a 5 años',
        decimals: 2,
      },
    ],
  },
  {
    id: 'fiabilidad',
    label: 'Fiabilidad y respaldo',
    fields: [
      { key: 'reliabilityOcu', label: 'Fiabilidad OCU' },
      { key: 'warrantyYears', label: 'Garantía', unitFallback: 'años' },
      {
        key: 'warrantyExtensionYears',
        label: 'Extensión de garantía',
        unitFallback: 'años',
      },
    ],
  },
  {
    id: 'juicio',
    label: 'Juicio propio',
    fields: [
      { key: 'aestheticsExterior', label: 'Estética exterior' },
      { key: 'aestheticsInterior', label: 'Estética interior' },
    ],
  },
];

// Exportado para que el test de estructura pueda comprobar el conjunto real
// de claves que «Completa» renderiza contra `FICHA_FIELDS`, no solo su
// recuento (`TOTAL_FIELD_COUNT` por sí solo es tautológico: sale de esta
// misma lista).
export const COMPLETE_FIELD_DEFS = new Map<FichaField, FieldDef>(
  COMPLETE_BLOCKS.flatMap((block) =>
    block.fields.map((def) => [def.key, def] as const),
  ),
);

/** Busca un `FieldDef` ya declarado en «Completa» — para que «Esenciales»
 * no pueda tener una etiqueta, unidad o decimales distintos del mismo campo
 * por una edición que solo toque uno de los dos sitios. */
function completeFieldDef(key: FichaField): FieldDef {
  const def = COMPLETE_FIELD_DEFS.get(key);
  if (def === undefined) {
    throw new Error(`FieldDef no declarado en COMPLETE_BLOCKS: ${key}`);
  }
  return def;
}

/**
 * El conjunto «Esenciales» (product/0020, requisito 1): tamaño —longitud,
 * anchura, altura libre al suelo, maletero—, potencia y precio, sin
 * cabecera de bloque porque aquí solo hay un grupo. Altura y litros por m²
 * —las dos de la extinta ficha técnica que no sobrevivieron aquí— siguen en
 * «Completa»: la primera no tiene dirección declarada
 * (`docs/estado/dominio.md`, tabla de polaridad: `neutral`) y la segunda es
 * una métrica derivada, no una medida directa. Las seis reutilizan tal cual
 * el `FieldDef` de «Completa» (requisito 3): mismo `key`, misma etiqueta,
 * mismo formato — `completeFieldDef` lo hace estructuralmente imposible de
 * incumplir, no solo una convención a seguir a mano.
 */
const ESSENTIAL_BLOCKS: BlockDef[] = [
  {
    id: 'esenciales',
    label: null,
    fields: (
      [
        'lengthMm',
        'widthMm',
        'groundClearanceMm',
        'trunkLiters',
        'powerCv',
        'priceEur',
      ] as const
    ).map(completeFieldDef),
  },
];

/** El orden del propio catálogo: la única opción del selector que no es una
 * magnitud, y por eso la única que se rotula aquí a mano. Las otras
 * veintiséis salen de `COMPLETE_BLOCKS` (product/0027, requisitos 1-3). */
const CATALOG_SORT_LABEL = 'Catálogo';

// Exportado para que el test de estructura compruebe el número de filas de
// datos sin repetir la cuenta a mano.
export const TOTAL_FIELD_COUNT = COMPLETE_BLOCKS.reduce(
  (sum, block) => sum + block.fields.length,
  0,
);

/** Qué enseña el diálogo (product/0025, requisito 1): el modelo pulsado y la
 * vista por la que se entra, que a partir de ahí se mueve por la secuencia.
 * La foto ya no viaja aquí —se deriva de las dos—, porque una tripleta
 * cerrada era justo lo que impedía saber que hay más vistas del mismo
 * coche. */
interface OpenPhoto {
  entity: FichaEntity;
  view: PhotoView;
}

const DIRECTION_CLASS: Record<DeltaDirection, string> = {
  better: styles.deltaBetter ?? '',
  worse: styles.deltaWorse ?? '',
  neutral: styles.deltaNeutral ?? '',
};

// Ninguna de las dos depende de la entidad ni del campo: se calculan una
// sola vez, no en cada celda de cada fila de cada columna.
const PINNED_CELL_CLASS = `${primitives.numeric} ${styles.pinnedCell}`;
const MODEL_CELL_CLASS = `${primitives.numeric} ${styles.modelCell}`;

/** El signo va siempre escrito (product/0013, requisito 10, que esta fusión
 * no relaja): el color de `DIRECTION_CLASS` es refuerzo, nunca la única
 * vía de leer si una diferencia es favorable. `cellUnit` —la unidad real de
 * la celda, no la unidad por defecto del campo— importa en `consumption`:
 * es lo único que distingue litros de kWh cuando dos coches comparten
 * unidad y sí llegan a tener una Δ numérica. */
function formatDelta(value: number, def: FieldDef, cellUnit?: string): string {
  if (def.isEuro) {
    const magnitude = formatEur(Math.abs(value));
    if (value > 0) return `+${magnitude}`;
    if (value < 0) return `−${magnitude}`;
    return magnitude;
  }
  const unit = cellUnit ?? def.unitFallback ?? '';
  const formatted = formatSigned(value, def.decimals ?? 0);
  return unit ? `${formatted} ${unit}` : formatted;
}

function CellValue({
  cell,
  def,
  code,
}: {
  cell: Exclude<FichaCell, { kind: 'missing' }>;
  def: FieldDef;
  /** Código de generación del fabricante (product/0021, requisito 2.5):
   * texto de apoyo tras el valor, no una celda ni una Δ propia. */
  code?: string;
}) {
  if (cell.kind === 'rating') {
    return <>{formatNumber(cell.value, 0)} / 5</>;
  }
  const unit = cell.unit ?? def.unitFallback ?? '';
  return (
    <>
      {def.isEuro
        ? formatEur(cell.value)
        : `${formatNumber(cell.value, def.decimals ?? 0)}${unit ? ` ${unit}` : ''}`}
      {code && ` (${code})`}
      {cell.estimated && <EstimatedMark />}
    </>
  );
}

/** Exportada para el diálogo de calibración (product/0035, requisito 7.1):
 * el cara a cara pinta las mismas magnitudes con el mismo formato y la
 * misma Δ que la ficha, en vez de declarar un segundo formateador. */
export function CellContent({
  cell,
  def,
  code,
}: {
  cell: FichaCell;
  def: FieldDef;
  code?: string;
}) {
  if (cell.kind === 'missing') {
    return (
      <>
        <span className={primitives.visuallyHidden}>Dato no disponible.</span>
        <span aria-hidden="true">—</span>
      </>
    );
  }
  return (
    <>
      <span className={styles.cellValue}>
        <CellValue cell={cell} def={def} code={code} />
      </span>
      {cell.delta === 'unavailable' && (
        <span className={styles.cellDelta}>
          <span className={primitives.visuallyHidden}>
            Sin diferencia que mostrar.
          </span>
          <span aria-hidden="true">—</span>
        </span>
      )}
      {cell.delta !== null && cell.delta !== 'unavailable' && (
        <span
          className={[
            styles.cellDelta,
            DIRECTION_CLASS[cell.delta.direction],
            def.key === 'widthMm' ? styles.deltaEmphasized : '',
          ].join(' ')}
        >
          {formatDelta(
            cell.delta.value,
            def,
            cell.kind === 'sourced' ? cell.unit : undefined,
          )}
        </span>
      )}
    </>
  );
}

/** Una celda de dato, fijada o desplazable (mismo reparto que
 * `ModelHeaderCell` hace en la cabecera): las dos difieren solo en la clase
 * y en qué entidad leen, así que comparten esta única definición en vez de
 * repetir el `<td>` una vez por cada una. */
function DataCell({
  entity,
  def,
  isPinned,
}: {
  entity: FichaEntity;
  def: FieldDef;
  isPinned: boolean;
}) {
  const code =
    def.key === 'generationLaunchYear' ? entity.generationCode : undefined;
  return (
    <td className={isPinned ? PINNED_CELL_CLASS : MODEL_CELL_CLASS}>
      <span className={styles.cellLabel}>{def.label}</span>
      <CellContent cell={entity.cells[def.key]} def={def} code={code} />
    </td>
  );
}

function PhotoBox({
  entity,
  photoView,
  onOpen,
}: {
  entity: FichaEntity;
  photoView: PhotoView;
  onOpen: (entity: FichaEntity, view: PhotoView) => void;
}) {
  // Una `src` que no carga —foto declarada, host caído o bloqueada por la
  // red de quien mira— degrada al mismo hueco que «sin foto» (product/0014,
  // sección 4.3), en vez de dejar el icono de imagen rota. Guardar la propia
  // `src` fallida, no un booleano, evita quedarse en modo «hueco» si el
  // usuario cambia de vista y esa sí carga.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const photo = entity.photos[photoView];
  if (photo === undefined || photoSrc(photo) === failedSrc) {
    return (
      <div className={styles.photoPlaceholder}>
        <span className={primitives.visuallyHidden}>{entity.name}, </span>
        {PHOTO_VIEW_LABELS[photoView]} — sin foto
      </div>
    );
  }
  const src = photoSrc(photo);
  return (
    <button
      type="button"
      className={styles.photoButton}
      onClick={() => onOpen(entity, photoView)}
    >
      {/* Sin `decoding="async"`: era el último atributo que esta miniatura
          llevaba y la foto del diálogo —que sí se ve— no, y con una docena de
          imágenes pequeñas no compra nada medible. WebKit tiene fallos
          conocidos de pintado con decodificación asíncrona dentro de
          contenedores desplazables compuestos, que es exactamente donde vive
          esta tabla. */}
      <img
        src={src}
        alt={`${entity.name}, vista ${PHOTO_VIEW_LABELS[photoView].toLowerCase()}`}
        referrerPolicy="no-referrer"
        className={styles.photo}
        onError={() => setFailedSrc(src)}
      />
    </button>
  );
}

/**
 * La foto ampliada y su recorrido (product/0025). El diálogo enseña la vista
 * por la que se entró y desde ahí se mueve por las que ese modelo declara,
 * en el orden canónico que resuelve `photoSequence` —el del fichero de datos
 * no sirve: unos coches traen las claves `front,side,rear,…` y otros
 * `front,rear,side,…`—.
 *
 * Componente propio, y no marcado suelto dentro de `FichaPage`, por el
 * estado de las `src` fallidas: es suyo y de nadie más. Guarda **todas** las
 * que han fallado, no la última como `PhotoBox`, porque aquí se cambia de
 * foto sin desmontar nada.
 *
 * Exportado solo para el test: el diálogo se abre con `showModal()`, que
 * `renderToStaticMarkup` no ejecuta, así que su marcado no es alcanzable
 * desde `FichaPage` sin jsdom.
 */
export function PhotoCarousel({
  entity,
  view,
  onSelectView,
}: {
  entity: FichaEntity;
  view: PhotoView;
  onSelectView: (view: PhotoView) => void;
}) {
  const [failedSrcs, setFailedSrcs] = useState<readonly string[]>([]);
  const photo = entity.photos[view];
  if (photo === undefined) return null;

  const sequence = photoSequence(entity.photos);
  const index = sequence.indexOf(view);
  const label = PHOTO_VIEW_LABELS[view];
  const src = photoSrc(photo);

  function goTo(step: number) {
    const next = sequence[index + step];
    if (next !== undefined) onSelectView(next);
  }

  return (
    <>
      <figure className={styles.dialogFigure}>
        {/* Una `src` que no carga degrada al mismo hueco rotulado que la
            miniatura (requisito 11), conservando posición y controles: la
            vista no desaparece de la secuencia a mitad de recorrido. */}
        {failedSrcs.includes(src) ? (
          <p className={styles.dialogPlaceholder}>
            {entity.name}, {label} — sin foto
          </p>
        ) : (
          <img
            src={src}
            alt={`${entity.name}, vista ${label.toLowerCase()}`}
            className={styles.dialogImage}
            onError={() => setFailedSrcs((failed) => [...failed, src])}
          />
        )}
        <figcaption className={styles.dialogCaption}>
          {photo.shows} — {photo.credit}
        </figcaption>
      </figure>

      {/* Un modelo con una sola vista abre el diálogo exactamente como antes
          de esta spec (requisito 10): un control deshabilitado para siempre
          no es información, es ruido. */}
      {sequence.length > 1 && (
        <div className={styles.dialogNav}>
          <button
            type="button"
            className={styles.dialogStep}
            aria-label="Ver la foto anterior"
            disabled={index === 0}
            onClick={() => goTo(-1)}
          >
            <span aria-hidden="true" className={styles.dialogCloseGlyph}>
              ‹
            </span>
          </button>
          {/* La posición, escrita (requisito 9): con los rótulos leídos como
              una lista de botones, es lo único que dice cuántas fotos hay y
              por cuál se va. */}
          <p className={styles.dialogPosition}>
            {index + 1} de {sequence.length} · {label}
          </p>
          <button
            type="button"
            className={styles.dialogStep}
            aria-label="Ver la foto siguiente"
            disabled={index === sequence.length - 1}
            onClick={() => goTo(1)}
          >
            <span aria-hidden="true" className={styles.dialogCloseGlyph}>
              ›
            </span>
          </button>
        </div>
      )}

      {/* Acceso directo por vista (requisito 5): rótulos de texto, nunca
          miniaturas —se leen a 320px y no piden descargar las otras cuatro
          fotos—. La vigente lleva `aria-current` además de su tratamiento
          visual, con el mismo criterio que la tira de candidatos. */}
      {sequence.length > 1 && (
        <div className={styles.dialogViews} role="group" aria-label="Vistas">
          {sequence.map((option) => (
            <button
              key={option}
              type="button"
              className={
                option === view ? styles.dialogViewActive : styles.dialogView
              }
              aria-current={option === view ? 'true' : undefined}
              onClick={() => onSelectView(option)}
            >
              {PHOTO_VIEW_LABELS[option]}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/** La marca de decisión, cuando la hay, dobla como control (product/0030,
 * requisito 6.2): para `undecided` no hay marca (5.3) y por tanto tampoco
 * botón — el primer estado se fija desde la fila del ranking, que siempre
 * ofrece las tres opciones; la ficha entra en juego para revisar o cambiar
 * una decisión ya tomada, comparando en paralelo. Solo los candidatos
 * tienen decisión: una referencia es el patrón contra el que se compara,
 * no algo que se elija (requisito, fuera de alcance). */
function ModelDecisionControl({
  entity,
  decisionLog,
  onOpen,
}: {
  entity: FichaEntity;
  decisionLog: DecisionLog;
  onOpen: (entity: FichaEntity) => void;
}) {
  if (entity.kind !== 'candidate') return null;
  const state = decisionOf(decisionLog, entity.id);
  if (state === 'undecided') return null;
  return (
    <button
      type="button"
      className={styles.decisionButton}
      onClick={() => onOpen(entity)}
    >
      <DecisionMark state={state} />
      <span className={primitives.visuallyHidden}>
        , cambiar la decisión sobre {entity.name}
      </span>
    </button>
  );
}

function ModelHeaderCell({
  entity,
  isPinned,
  photoView,
  decisionLog,
  overBudget,
  failures,
  onPin,
  onOpenPhoto,
  onOpenDecision,
}: {
  entity: FichaEntity;
  isPinned: boolean;
  photoView: PhotoView;
  decisionLog: DecisionLog;
  overBudget: boolean;
  failures: RuleFailure[];
  onPin: (id: string) => void;
  onOpenPhoto: (entity: FichaEntity, view: PhotoView) => void;
  onOpenDecision: (entity: FichaEntity) => void;
}) {
  return (
    <th
      scope="col"
      className={isPinned ? styles.pinnedHeader : styles.modelHeader}
    >
      <PhotoBox entity={entity} photoView={photoView} onOpen={onOpenPhoto} />
      <ModelDecisionControl
        entity={entity}
        decisionLog={decisionLog}
        onOpen={onOpenDecision}
      />
      {/* Solo los candidatos tienen hoja de visita: una referencia no se
       * prueba (product/0037, fuera de alcance), mismo criterio que
       * `ModelDecisionControl` (requisito 6.2). */}
      {entity.kind === 'candidate' && (
        <a className={primitives.buttonGhost} href={visitaHashFor(entity.id)}>
          Hoja de visita
        </a>
      )}
      {/* El presupuesto y las reglas eliminatorias nunca alcanzan a la
       * referencia ni al modelo fijado como comparación (product/0031,
       * requisito 5.2), mismo criterio que `ModelDecisionControl`. */}
      {entity.kind === 'candidate' && !isPinned && (
        <EligibilityMark overBudget={overBudget} failures={failures} />
      )}
      <label className={styles.pinLabel}>
        <input
          type="radio"
          name="pinned-model"
          value={entity.id}
          checked={isPinned}
          onChange={() => onPin(entity.id)}
          aria-label={`Comparar contra ${entity.name}`}
          className={styles.pinInput}
        />
        <span className={styles.modelInfo}>
          <span className={styles.modelName}>{entity.name}</span>
          <span className={primitives.secondaryText}>
            {entity.brand} · {TECHNOLOGY_LABELS[entity.technology]}
          </span>
        </span>
      </label>
      {entity.kind === 'reference' && (
        <span className={styles.referenceTag}>Referencia</span>
      )}
    </th>
  );
}

/** Miniatura decorativa de un candidato en la tira de duelo (product/0023):
 * misma degradación que `PhotoBox` —hueco rotulado si no hay foto de esa
 * vista, o si la `src` falla al cargar—, pero sin su propio `<button>`: la
 * tira entera ya es un `<button>` por candidato (`CandidateChip`), y anidar
 * uno dentro de otro no es válido. `aria-hidden` porque el nombre real va
 * al lado, como texto. */
function ChipThumbnail({
  entity,
  photoView,
}: {
  entity: FichaEntity;
  photoView: PhotoView;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const photo = entity.photos[photoView];
  if (photo === undefined || photoSrc(photo) === failedSrc) {
    return (
      <span className={styles.duelChipThumbPlaceholder} aria-hidden="true" />
    );
  }
  const src = photoSrc(photo);
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      referrerPolicy="no-referrer"
      className={styles.duelChipThumb}
      onError={() => setFailedSrc(src)}
    />
  );
}

/** Un candidato de la tira (requisito 3): control real, con nombre
 * accesible propio y el enfocado marcado con `aria-current` además de con
 * su propio tratamiento visual — el estado no depende solo del color. */
function CandidateChip({
  entity,
  isFocused,
  photoView,
  onFocus,
}: {
  entity: FichaEntity;
  isFocused: boolean;
  photoView: PhotoView;
  onFocus: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={isFocused ? styles.duelChipActive : styles.duelChip}
      aria-current={isFocused ? 'true' : undefined}
      onClick={() => onFocus(entity.id)}
    >
      <ChipThumbnail entity={entity} photoView={photoView} />
      <span className={styles.duelChipName}>{entity.name}</span>
    </button>
  );
}

/** Una fila de magnitud en la tarjeta de duelo (requisito 6): el valor del
 * candidato, su Δ firmada —reutilizando `formatDelta` y los mismos tres
 * colores de dirección que la tabla, nunca la única vía de leerla— y,
 * cuando hay referencia, su valor crudo con su nombre. Repetir ese valor
 * aquí no es decorativo: al dejar de existir una columna fijada en esta
 * vista, es la única forma de que no desaparezca (`product/0010`,
 * requisito 14). */
function DuelRow({
  def,
  candidate,
  pinnedEntity,
}: {
  def: FieldDef;
  candidate: FichaEntity;
  pinnedEntity: FichaEntity | undefined;
}) {
  const cell = candidate.cells[def.key];
  const code =
    def.key === 'generationLaunchYear' ? candidate.generationCode : undefined;
  const refCell = pinnedEntity?.cells[def.key];
  const refCode =
    def.key === 'generationLaunchYear'
      ? pinnedEntity?.generationCode
      : undefined;

  return (
    <div className={styles.duelRow}>
      <span className={styles.duelRowLabel}>{def.label}</span>
      <span className={styles.duelRowValue}>
        {cell.kind === 'missing' ? (
          <>
            <span className={primitives.visuallyHidden}>
              Dato no disponible.
            </span>
            <span aria-hidden="true">—</span>
          </>
        ) : (
          <CellValue cell={cell} def={def} code={code} />
        )}
      </span>
      {cell.kind !== 'missing' && cell.delta === 'unavailable' && (
        <span className={styles.duelRowDelta}>
          <span className={primitives.visuallyHidden}>
            Sin diferencia que mostrar.
          </span>
          <span aria-hidden="true">—</span>
        </span>
      )}
      {cell.kind !== 'missing' &&
        cell.delta !== null &&
        cell.delta !== 'unavailable' && (
          <span
            className={[
              styles.duelRowDelta,
              DIRECTION_CLASS[cell.delta.direction],
              def.key === 'widthMm' ? styles.deltaEmphasized : '',
            ].join(' ')}
          >
            {formatDelta(
              cell.delta.value,
              def,
              cell.kind === 'sourced' ? cell.unit : undefined,
            )}
          </span>
        )}
      {pinnedEntity && refCell && refCell.kind !== 'missing' && (
        <span className={styles.duelRowReference}>
          {pinnedEntity.name}{' '}
          <CellValue cell={refCell} def={def} code={refCode} />
        </span>
      )}
    </div>
  );
}

/** La tarjeta del candidato enfocado (requisitos 5 y 9): su foto, su
 * identidad, y una fila por magnitud del conjunto de campos vigente,
 * agrupada en bloques cuando ese conjunto los tiene («Completa») — los
 * mismos `blocks` que ya recibe la tabla, sin una segunda declaración. */
function DuelCard({
  candidate,
  pinnedEntity,
  overBudget,
  failures,
  blocks,
  photoView,
  onOpenPhoto,
}: {
  candidate: FichaEntity;
  pinnedEntity: FichaEntity | undefined;
  overBudget: boolean;
  failures: RuleFailure[];
  blocks: BlockDef[];
  photoView: PhotoView;
  onOpenPhoto: (entity: FichaEntity, view: PhotoView) => void;
}) {
  return (
    <div className={styles.duelCard}>
      <PhotoBox entity={candidate} photoView={photoView} onOpen={onOpenPhoto} />
      <div className={styles.duelCardInfo}>
        <span className={styles.duelCardName}>{candidate.name}</span>
        <span className={primitives.secondaryText}>
          {candidate.brand} · {TECHNOLOGY_LABELS[candidate.technology]}
        </span>
        {/* Nunca para la referencia (requisito 5.2): `DuelCard` solo recibe
         * candidatos —`scrollableEntities` ya los excluye—, así que no
         * hace falta comprobar `candidate.kind` aquí. */}
        <EligibilityMark overBudget={overBudget} failures={failures} />
      </div>
      {blocks.map((block) => (
        <Fragment key={block.id}>
          {block.label !== null && (
            <span className={styles.duelBlockHeader}>{block.label}</span>
          )}
          {block.fields.map((def) => (
            <DuelRow
              key={def.key}
              def={def}
              candidate={candidate}
              pinnedEntity={pinnedEntity}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
}

/** La vista de duelo entera (product/0023, requisitos 1-4): la tira, en el
 * orden vigente de «Orden», con los mismos candidatos que hoy son columnas
 * desplazables de la tabla —nunca la propia referencia—, y la tarjeta del
 * enfocado. Sin `useEffect` que reponga el foco: `focusedCandidate` cae al
 * primero de la tira por construcción en cuanto el id enfocado deja de
 * estar en ella, sea porque nunca se eligió ninguno o porque el candidato
 * enfocado acaba de convertirse en la propia referencia. */
function DuelView({
  scrollableEntities,
  pinnedEntity,
  focusedCandidate,
  focusedOverBudget,
  focusedFailures,
  onFocus,
  blocks,
  photoView,
  onOpenPhoto,
}: {
  scrollableEntities: FichaEntity[];
  pinnedEntity: FichaEntity | undefined;
  focusedCandidate: FichaEntity | undefined;
  focusedOverBudget: boolean;
  focusedFailures: RuleFailure[];
  onFocus: (id: string) => void;
  blocks: BlockDef[];
  photoView: PhotoView;
  onOpenPhoto: (entity: FichaEntity, view: PhotoView) => void;
}) {
  return (
    <div className={styles.duelView}>
      <div className={styles.duelStrip} role="group" aria-label="Candidatos">
        {scrollableEntities.map((entity) => (
          <CandidateChip
            key={entity.id}
            entity={entity}
            isFocused={entity.id === focusedCandidate?.id}
            photoView={photoView}
            onFocus={onFocus}
          />
        ))}
      </div>
      {focusedCandidate && (
        <DuelCard
          candidate={focusedCandidate}
          pinnedEntity={pinnedEntity}
          overBudget={focusedOverBudget}
          failures={focusedFailures}
          blocks={blocks}
          photoView={photoView}
          onOpenPhoto={onOpenPhoto}
        />
      )}
    </div>
  );
}

/** Por debajo de este movimiento acumulado, un gesto táctil no fija eje
 * todavía (technical/0007): es el temblor natural del dedo al posarse, no
 * una intención de desplazamiento. */
const AXIS_LOCK_THRESHOLD_PX = 10;

/**
 * Ancla un gesto táctil al eje que domina su primer movimiento
 * significativo (technical/0007, requisitos 2-4): `.tableWrapper` desplaza
 * en los dos ejes a la vez —columnas de modelo con anclaje de scroll,
 * filas cuando la tabla no cabe entera—, y un gesto pensado como «hacia
 * abajo» casi nunca es puramente vertical. Sin este bloqueo, el componente
 * horizontal mínimo de ese gesto podía bastar para saltar de una columna a
 * la siguiente.
 *
 * El eje que domina conserva su `overflow: auto` de siempre —el navegador
 * sigue resolviendo su inercia él solo—; el eje contrario nunca se
 * desactiva (technical/0008: desactivarlo con `overflow: hidden` es lo que
 * reseteaba el scroll horizontal al reactivarse, por su interacción con
 * `scroll-snap-type: x mandatory`). En vez de eso, se guarda la posición
 * del eje contrario al fijarse el gesto, y un listener de `scroll` la
 * reimpone en cada evento mientras dure — el eje bloqueado se queda quieto
 * porque se corrige a mano, no porque deje de ser desplazable.
 */
function attachScrollAxisLock(el: HTMLDivElement): () => void {
  let startX = 0;
  let startY = 0;
  let lockedAxis: 'x' | 'y' | null = null;
  let lockedScrollLeft = 0;
  let lockedScrollTop = 0;

  function unlock() {
    lockedAxis = null;
  }

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    if (touch === undefined) return;
    startX = touch.clientX;
    startY = touch.clientY;
    unlock();
  }

  function onTouchMove(event: TouchEvent) {
    if (lockedAxis !== null) return;
    const touch = event.touches[0];
    if (touch === undefined) return;
    const dx = Math.abs(touch.clientX - startX);
    const dy = Math.abs(touch.clientY - startY);
    if (Math.max(dx, dy) < AXIS_LOCK_THRESHOLD_PX) return;
    lockedAxis = dx > dy ? 'x' : 'y';
    lockedScrollLeft = el.scrollLeft;
    lockedScrollTop = el.scrollTop;
  }

  function onScroll() {
    if (lockedAxis === 'y') {
      el.scrollLeft = lockedScrollLeft;
    } else if (lockedAxis === 'x') {
      el.scrollTop = lockedScrollTop;
    }
  }

  el.addEventListener('touchstart', onTouchStart, { passive: true });
  el.addEventListener('touchmove', onTouchMove, { passive: true });
  el.addEventListener('touchend', unlock, { passive: true });
  el.addEventListener('touchcancel', unlock, { passive: true });
  el.addEventListener('scroll', onScroll, { passive: true });

  return () => {
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', unlock);
    el.removeEventListener('touchcancel', unlock);
    el.removeEventListener('scroll', onScroll);
  };
}

/**
 * La ficha (product/0018): una columna por modelo, una fila por
 * característica, con la columna del modelo de comparación fija a la
 * izquierda mientras el resto se desplaza. Funde la extinta ficha técnica
 * (product/0013) y la ficha completa (product/0014) en una sola vista: la
 * Δ que antes solo existía contra el Alfa Romeo Giulietta ahora se calcula
 * contra cualquier modelo que se elija, y un conmutador de campos recupera
 * la lectura «de un vistazo» de seis magnitudes cuando no hace falta ver
 * las veintiséis. No calcula nada por su cuenta: `ficha.ts` ya entrega cada
 * celda lista para formatear (`ui-no-scoring-internals`).
 */
export function FichaPage({
  cars,
  references,
  scoredCars,
  weights,
  eliminatoryRules = [],
  decisionLog,
  onSetDecision,
  onClearDecision,
}: FichaPageProps) {
  const baseEntities = useMemo(
    () => buildFicha(cars, references),
    [cars, references],
  );
  const scoreById = useMemo(
    () => new Map(scoredCars.map((car) => [car.carId, car])),
    [scoredCars],
  );
  // Los imprescindibles incumplidos por candidato (product/0031, requisito
  // 5): a partir de las mismas celdas ya calculadas de la ficha, no de
  // `Car` crudo — `numericValuesFromCells` es la misma vía de extracción
  // que ya usa cada `CellValue`. Solo candidatos: una referencia no tiene
  // presupuesto ni decisión propia, y esta spec sigue el mismo criterio.
  const ruleFailuresById = useMemo(() => {
    const map = new Map<string, RuleFailure[]>();
    for (const entity of baseEntities) {
      if (entity.kind !== 'candidate') continue;
      map.set(
        entity.id,
        evaluateRules(numericValuesFromCells(entity.cells), eliminatoryRules),
      );
    }
    return map;
  }, [baseEntities, eliminatoryRules]);

  // Las cinco elecciones de esta página, persistidas aparte de `AppConfig`
  // (product/0024): quién se fija como referencia, requiere saber tanto
  // el catálogo de coches como las referencias, ninguno de los dos algo
  // que `domain/viewState.ts` pueda conocer por sí solo.
  const validEntityIds = useMemo(
    () => new Set([...cars, ...references].map((entity) => entity.id)),
    [cars, references],
  );
  const defaultComparisonId = references[0]?.id ?? null;
  const {
    viewState: { comparisonId, fieldSet, sortCriterion, photoView, focusedId },
    setComparisonId,
    setFieldSet,
    setSortCriterion,
    setPhotoView,
    setFocusedId,
  } = useViewState(validEntityIds, defaultComparisonId);
  const [openPhoto, setOpenPhoto] = useState<OpenPhoto | null>(null);
  const [openDecision, setOpenDecision] = useState<FichaEntity | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const decisionDialogRef = useRef<HTMLDialogElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tableWrapperRef.current;
    if (el === null) return;
    return attachScrollAxisLock(el);
  }, []);

  const entitiesWithDelta = useMemo(
    () => withComparison(baseEntities, comparisonId),
    [baseEntities, comparisonId],
  );

  const pinnedEntity = useMemo(
    () => entitiesWithDelta.find((e) => e.id === comparisonId),
    [entitiesWithDelta, comparisonId],
  );
  // El filtro de decisión (product/0030, requisito 4.3) alcanza solo a los
  // candidatos: una referencia nunca tiene decisión propia, así que
  // aplicarle el mismo filtro la escondería sin motivo bajo «Solo lista
  // corta». El modelo fijado sobrevive siempre (requisito 4.4) porque se
  // calcula aparte, sin pasar por este filtro.
  const scrollableEntities = useMemo(
    () =>
      sortFicha(
        entitiesWithDelta.filter(
          (e) =>
            e.id !== pinnedEntity?.id &&
            (e.kind === 'reference' ||
              passesDecisionFilter(
                decisionOf(decisionLog, e.id),
                decisionLog.filter,
              )),
        ),
        sortCriterion,
      ),
    [entitiesWithDelta, pinnedEntity, sortCriterion, decisionLog],
  );
  /* Las opciones del selector de comparación (technical/0010, requisito 3.2):
     todos los modelos, incluido el fijado, ordenados por el criterio vigente.
     No sirve `scrollableEntities` —excluye al fijado, así que la opción
     elegida se borraría de la lista justo al elegirla— ni el orden real de
     columna, que lo pone el primero por el mismo motivo. */
  const comparisonOptions = useMemo(
    () => sortFicha(entitiesWithDelta, sortCriterion),
    [entitiesWithDelta, sortCriterion],
  );
  const columnCount = 1 + (pinnedEntity ? 1 : 0) + scrollableEntities.length;
  const blocks = fieldSet === 'esenciales' ? ESSENTIAL_BLOCKS : COMPLETE_BLOCKS;
  // Cae al primero de la tira por construcción cuando `focusedId` es `null`
  // (arranque) o ya no está en `scrollableEntities` (requisito 4): nunca
  // apunta a un candidato que ha dejado de verse.
  const focusedCandidate =
    scrollableEntities.find((entity) => entity.id === focusedId) ??
    scrollableEntities[0];

  // Una referencia —hoy solo el Alfa Romeo Giulietta— no se puntúa
  // (product/0018, requisito 12), así que no está en `scoreById` (product/
  // 0029, requisito 6): `ScoreGapPanel` decide qué enseñar a partir de qué
  // de las dos puntuaciones falta, no de si la entidad es un `Car`.
  const focusedScore = focusedCandidate && scoreById.get(focusedCandidate.id);
  const pinnedScore = pinnedEntity && scoreById.get(pinnedEntity.id);

  function handleComparisonChange(id: string | null) {
    setComparisonId(id);
    // El modelo recién fijado —o «Ninguno»— no debe dejar la tabla
    // desplazada a mitad de camino (requisito 9.3, extendido a este caso).
    tableWrapperRef.current?.scrollTo({ left: 0 });
  }

  /** Punto de entrada del diálogo (requisito 1): siempre por la vista
   * pulsada, nunca por la última que se estuviera mirando (requisito 13). */
  function handleOpenPhoto(entity: FichaEntity, view: PhotoView) {
    setOpenPhoto({ entity, view });
    dialogRef.current?.showModal();
  }

  /** Moverse por el carrusel es cambiar la vista del mismo modelo, y nada
   * más (requisito 12): no toca `photoView`, así que ni la tabla de detrás
   * ni `localStorage` se enteran. */
  function handleSelectPhotoView(view: PhotoView) {
    setOpenPhoto((open) => (open === null ? null : { ...open, view }));
  }

  function handleDialogClose() {
    setOpenPhoto(null);
  }

  function handleOpenDecision(entity: FichaEntity) {
    setOpenDecision(entity);
    decisionDialogRef.current?.showModal();
  }

  function handleDecisionDialogClose() {
    setOpenDecision(null);
  }

  return (
    <>
      <h1 className={shellStyles.viewTitle}>Ficha</h1>

      {/* Cuatro pastillas iguales (technical/0010, requisito 1.1): el rótulo
          vive dentro de la caja, y sigue siendo un `<label>` de verdad
          asociado a su `<select>` — se mueve de sitio, no se sustituye por
          texto decorativo (requisito 5.1). */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarField}>
          <label
            className={styles.toolbarFieldLabel}
            htmlFor="field-set-select"
          >
            Campos
          </label>
          <select
            id="field-set-select"
            className={styles.toolbarSelect}
            value={fieldSet}
            onChange={(event) => setFieldSet(event.target.value as FieldSet)}
          >
            <option value="esenciales">Esenciales</option>
            <option value="completa">Completa</option>
          </select>
        </div>

        {/* El control de comparación es un `<select>`, no el radio suelto de
            una sola opción que había aquí (requisito 3.1). Escribe el mismo
            `comparisonId` que los radios de las cabeceras de columna, así que
            los dos están sincronizados por construcción (requisito 3.3), y
            «Ninguno» sigue siendo la única forma de apagar las Δ
            (product/0018, requisito 2.3). Las opciones van en el orden que
            fija el criterio vigente y no en el de columna —donde el fijado va
            primero—, para que el elegido no salte al primer puesto justo al
            elegirlo (requisito 3.2). */}
        <div className={styles.toolbarField}>
          <label
            className={styles.toolbarFieldLabel}
            htmlFor="comparison-select"
          >
            Comparar
          </label>
          <select
            id="comparison-select"
            className={styles.toolbarSelect}
            value={comparisonId ?? ''}
            onChange={(event) =>
              handleComparisonChange(event.target.value || null)
            }
          >
            <option value="">Ninguno</option>
            {comparisonOptions.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.toolbarField}>
          <label className={styles.toolbarFieldLabel} htmlFor="sort-select">
            Orden
          </label>
          <select
            id="sort-select"
            className={styles.toolbarSelect}
            value={sortCriterion}
            onChange={(event) =>
              setSortCriterion(event.target.value as FichaSortCriterion)
            }
          >
            <option value="catalog">{CATALOG_SORT_LABEL}</option>
            {/* Una opción por magnitud de «Completa», agrupadas por sus
                mismos seis bloques y rotuladas con el `label` del mismo
                `FieldDef` que rotula su fila (product/0027, requisitos 1-3):
                no hay una segunda lista que mantener al día, así que una
                magnitud nueva en la ficha aparece aquí sola. Ordenar por una
                magnitud que «Esenciales» no enseña es legítimo —los dos
                controles son independientes (requisito 9)—, así que el grupo
                se recorre siempre entero, no `blocks`. */}
            {COMPLETE_BLOCKS.map((block) => (
              <optgroup key={block.id} label={block.label}>
                {block.fields.map((def) => (
                  <option key={def.key} value={def.key}>
                    {def.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className={styles.toolbarField}>
          <label
            className={styles.toolbarFieldLabel}
            htmlFor="photo-view-select"
          >
            Foto
          </label>
          <select
            id="photo-view-select"
            name="photo-view"
            className={styles.toolbarSelect}
            value={photoView}
            onChange={(event) => setPhotoView(event.target.value as PhotoView)}
          >
            {PHOTO_VIEWS.map((view) => (
              <option key={view} value={view}>
                {PHOTO_VIEW_LABELS[view]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ScoreGapPanel
        focusedName={focusedCandidate?.name}
        pinnedName={pinnedEntity?.name}
        focusedScore={focusedScore}
        pinnedScore={pinnedScore}
        hasComparison={pinnedEntity !== undefined}
        weights={weights}
      />

      {/* Las dos vistas se generan siempre: cuál se ve la decide
          `FichaPage.module.css` con `--bp-columna` (product/0023),
          igual que ya hace `ViewSwitcher` con la navegación. */}
      <DuelView
        scrollableEntities={scrollableEntities}
        pinnedEntity={pinnedEntity}
        focusedCandidate={focusedCandidate}
        focusedOverBudget={focusedScore?.overBudget ?? false}
        focusedFailures={
          (focusedCandidate && ruleFailuresById.get(focusedCandidate.id)) ?? []
        }
        onFocus={setFocusedId}
        blocks={blocks}
        photoView={photoView}
        onOpenPhoto={handleOpenPhoto}
      />

      <div
        className={
          pinnedEntity
            ? styles.tableWrapper
            : `${styles.tableWrapper} ${styles.tableWrapperNoPin}`
        }
        ref={tableWrapperRef}
        tabIndex={0}
        role="group"
        aria-label="Ficha, con desplazamiento horizontal"
      >
        <table className={styles.table}>
          <caption className={primitives.visuallyHidden}>
            Ficha comparada: las magnitudes de cada modelo, con su diferencia
            frente al modelo de comparación elegido, y una columna fija para ese
            modelo
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles.featureHeader}>
                {/* No visible (corrección 2026-08-07 del requisito 8.3): cada
                    fila ya lleva su propio rótulo al lado, así que repetir
                    "Característica" en la esquina no añadía información —
                    solo ocupaba sitio. Se queda para quien lee con lector de
                    pantalla la cabecera de la columna. */}
                <span className={primitives.visuallyHidden}>
                  Característica
                </span>
              </th>
              {pinnedEntity && (
                <ModelHeaderCell
                  entity={pinnedEntity}
                  isPinned
                  photoView={photoView}
                  decisionLog={decisionLog}
                  overBudget={false}
                  failures={[]}
                  onPin={handleComparisonChange}
                  onOpenPhoto={handleOpenPhoto}
                  onOpenDecision={handleOpenDecision}
                />
              )}
              {scrollableEntities.map((entity) => (
                <ModelHeaderCell
                  key={entity.id}
                  entity={entity}
                  isPinned={false}
                  photoView={photoView}
                  decisionLog={decisionLog}
                  overBudget={scoreById.get(entity.id)?.overBudget ?? false}
                  failures={ruleFailuresById.get(entity.id) ?? []}
                  onPin={handleComparisonChange}
                  onOpenPhoto={handleOpenPhoto}
                  onOpenDecision={handleOpenDecision}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <Fragment key={block.id}>
                {block.label !== null && (
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={columnCount}
                      className={styles.blockHeader}
                    >
                      {/* La celda entera abarca todas las columnas para que
                          la banda de fondo cubra la fila (requisito 8.2);
                          el rótulo va en su propio `sticky` para seguir
                          legible al desplazar — sin esto, desaparece por la
                          izquierda en cuanto se avanza más allá de la
                          primera columna, porque una celda de ese ancho no
                          puede fijarse entera sin salirse de la tabla. */}
                      <span className={styles.blockHeaderLabel}>
                        {block.label}
                      </span>
                    </th>
                  </tr>
                )}
                {block.fields.map((def) => (
                  <tr key={def.key}>
                    <th scope="row" className={styles.featureCell}>
                      {def.label}
                    </th>
                    {pinnedEntity && (
                      <DataCell entity={pinnedEntity} def={def} isPinned />
                    )}
                    {scrollableEntities.map((entity) => (
                      <DataCell
                        key={entity.id}
                        entity={entity}
                        def={def}
                        isPinned={false}
                      />
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.legend}>
        Cada columna es un modelo; márquela —o marque «Ninguno»— para elegir
        contra qué se comparan las demás. Cuando hay un modelo de comparación,
        cada celda muestra debajo su diferencia, con el signo siempre escrito:
        el color es un refuerzo, nunca la única vía de leerlo. En maletero,
        litros por m², potencia, fiabilidad, garantía, extensión de garantía,
        valor residual a 5 años, anchura de hombros atrás y las dos notas de
        estética, más es mejor; en anchura, longitud, peso, aceleración,
        consumo, precio y mantenimiento, más es peor, porque el problema que
        resuelve el proyecto es que los sustitutos son más grandes y más caros.
        Altura, altura libre al suelo, batalla, generación y retoque no tienen
        una dirección declarada. La columna de anchura va en negrita: es la
        prioridad declarada del proyecto. El selector de vista de foto cambia
        qué vista enseñan todas las columnas a la vez. La marca{' '}
        <EstimatedMark /> señala un dato estimado, sin fuente publicada
        verificada directamente.
      </p>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onClose={handleDialogClose}
        onKeyDown={(event) => {
          if (openPhoto === null) return;
          const step =
            event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
          if (step === 0) return;
          const sequence = photoSequence(openPhoto.entity.photos);
          const next = sequence[sequence.indexOf(openPhoto.view) + step];
          // En los extremos no pasa nada, ni siquiera tragarse la tecla
          // (requisito 6): la secuencia no da la vuelta.
          if (next === undefined) return;
          event.preventDefault();
          handleSelectPhotoView(next);
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
      >
        {openPhoto && (
          <>
            <PhotoCarousel
              entity={openPhoto.entity}
              view={openPhoto.view}
              onSelectView={handleSelectPhotoView}
            />
            <button
              type="button"
              className={styles.dialogClose}
              onClick={() => dialogRef.current?.close()}
              aria-label="Cerrar la foto ampliada"
            >
              <span aria-hidden="true" className={styles.dialogCloseGlyph}>
                ×
              </span>
            </button>
          </>
        )}
      </dialog>

      {/* La decisión también se edita desde la ficha (product/0030,
          requisitos 6.2-6.4): mismo `DecisionEditor` que la fila del
          ranking, sobre el mismo registro. `key={openDecision.id}` reinicia
          el motivo en edición al abrir el diálogo para un modelo distinto,
          en vez de que un componente reutilizado arrastre el texto del
          anterior. */}
      <dialog
        ref={decisionDialogRef}
        className={styles.dialog}
        onClose={handleDecisionDialogClose}
      >
        {openDecision && (
          <>
            <h2 className={styles.decisionDialogTitle}>{openDecision.name}</h2>
            <DecisionEditor
              key={openDecision.id}
              entry={entryOf(decisionLog, openDecision.id)}
              onSetDecision={(state, reason) =>
                onSetDecision(openDecision.id, state, reason)
              }
              onClear={() => onClearDecision(openDecision.id)}
            />
            <button
              type="button"
              className={styles.dialogClose}
              onClick={() => decisionDialogRef.current?.close()}
              aria-label="Cerrar"
            >
              <span aria-hidden="true" className={styles.dialogCloseGlyph}>
                ×
              </span>
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
