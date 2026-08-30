import type { Car, SourcedNumber } from '../../domain/car';
import type {
  DecisionEntry,
  DecisionState,
  StoredDecisionState,
} from '../../domain/decisions';
import type { CarScoreBreakdown } from '../../domain/scoring/breakdown';
import type { RatingOverride } from '../../domain/scoring/overrides';
import { percentageOf } from '../../domain/scoring/score';
import { splitScoreGap, topGapLines } from '../../domain/scoring/scoreGap';
import type { AxisWeights } from '../../domain/scoring/weights';
import { DECISION_LABELS } from '../decisionLabels';
import { formatDate, formatEur, formatNumber, formatSigned } from '../format';
import primitives from '../primitives.module.css';
import { AxisBreakdownView } from './AxisBreakdownView';
import { DecisionEditor } from './DecisionEditor';
import { DecisionMark } from './DecisionMark';
import { EstimatedMark } from './EstimatedMark';
import type { EditableRating } from './RankingList';
import { TECHNOLOGY_LABELS } from '../technologyLabels';
import styles from './RankingRow.module.css';

/** El podio (product/0022, los tres primeros de la lista visible) y el
 * resto comparten fila: mismos datos, mismo control de despliegue, mismo
 * nombre accesible. Lo único que cambia entre `'podium'` y `'list'` es qué
 * marcado envuelve esas piezas — nunca la lógica de `aria-expanded` ni de
 * qué texto anuncia el control, que viven una sola vez más abajo. */
type RankingRowVariant = 'podium' | 'list';

interface RankingRowProps {
  car: CarScoreBreakdown;
  rawCar?: Car;
  rank: number;
  isLeader: boolean;
  variant: RankingRowVariant;
  expanded: boolean;
  onToggle: () => void;
  editableRatings: EditableRating[];
  onRatingChange: (override: RatingOverride) => void;
  /** El líder para toda fila que no sea la suya, y el segundo para la del
   * líder (product/0029, requisito 4). `undefined` cuando no hay con qué
   * comparar —un único coche visible—, y entonces la fila no enseña
   * resumen. */
  compareTo?: CarScoreBreakdown;
  weights: AxisWeights;
  /** El estado de decisión de este coche (product/0030): `undefined` de
   * entrada no existe — siempre llega `'undecided'` cuando no hay entrada,
   * lo resuelve `decisionOf` antes de llegar aquí. */
  decisionState: DecisionState;
  decisionEntry: DecisionEntry | undefined;
  onSetDecision: (
    state: StoredDecisionState,
    reason: string | undefined,
  ) => void;
  onClearDecision: () => void;
}

/** El estado, el motivo y la fecha en texto corrido, por delante del
 * resumen del duelo (requisito 5.2): nada para `undecided`. Sin motivo
 * escrito, la línea es solo el estado y la fecha. */
function DecisionSummaryLine({
  state,
  entry,
}: {
  state: DecisionState;
  entry: DecisionEntry | undefined;
}) {
  if (state === 'undecided' || entry === undefined) return null;
  return (
    <p className={styles.decisionSummary}>
      {DECISION_LABELS[state]} el {formatDate(entry.date)}
      {entry.reason && ` — ${entry.reason}`}
    </p>
  );
}

/** El resumen de una línea del duelo contra `compareTo` (requisito 4): la
 * diferencia de nota y los dos ejes que más la explican, uno de cada
 * signo cuando lo haya. No calcula nada por su cuenta
 * (`ui-no-scoring-internals`): `splitScoreGap` y `topGapLines` ya entregan
 * las líneas listas. */
function GapSummaryLine({
  car,
  compareTo,
  weights,
}: {
  car: CarScoreBreakdown;
  compareTo: CarScoreBreakdown;
  weights: AxisWeights;
}) {
  const gap = splitScoreGap(car, compareTo);
  const top = topGapLines(gap);

  return (
    <p className={styles.gapSummary}>
      Frente a {compareTo.carName}:{' '}
      <span className={primitives.numeric}>
        {formatSigned(gap.percentageDiff, 1)} pp
      </span>
      {top.length > 0 && (
        <>
          {' — '}
          {top
            .map(
              (line) =>
                `${line.label} ${formatSigned(percentageOf(line.value, weights), 1)}`,
            )
            .join(', ')}
        </>
      )}
    </p>
  );
}

function currentSource(sourced: SourcedNumber) {
  return sourced.sources.find((source) => source.current);
}

export function RankingRow({
  car,
  rawCar,
  rank,
  isLeader,
  variant,
  expanded,
  onToggle,
  editableRatings,
  onRatingChange,
  compareTo,
  weights,
  decisionState,
  decisionEntry,
  onSetDecision,
  onClearDecision,
}: RankingRowProps) {
  const position = String(rank).padStart(2, '0');
  const accelEstimated = rawCar
    ? (currentSource(rawCar.acceleration0to100)?.estimated ?? false)
    : false;
  const isPodium = variant === 'podium';

  const toggle = (
    <button
      type="button"
      className={isPodium ? styles.togglePodium : styles.toggle}
      aria-expanded={expanded}
      onClick={onToggle}
    >
      <span className={isLeader ? styles.positionLeader : styles.position}>
        {position}
      </span>{' '}
      <span className={styles.name}>{car.carName}</span>{' '}
      <DecisionMark state={decisionState} />
      <span className={primitives.visuallyHidden}>
        {expanded ? ', ocultar desglose' : ', ver desglose'}
      </span>
    </button>
  );

  // El maletero sustituye a la potencia (product/0022): es la magnitud de
  // mayor peso del eje `viaje`, el que más pesa por defecto, y se lee tal
  // cual del catálogo, igual que hoy se lee la potencia — la interfaz no
  // calcula nada nuevo.
  const secondaryLine = rawCar && (
    <p className={isPodium ? styles.secondaryLinePodium : styles.secondaryLine}>
      <span>{TECHNOLOGY_LABELS[rawCar.technology]}</span>
      <span>·</span>
      <span>
        {formatNumber(rawCar.acceleration0to100.value, 1)}s
        {accelEstimated && <EstimatedMark />}
      </span>
      <span>·</span>
      <span>{formatNumber(rawCar.trunkLiters.value, 0)} L</span>
      <span>·</span>
      <span>{formatEur(rawCar.priceEur.value)}</span>
    </p>
  );

  const expandedContent = expanded && (
    <div className={styles.expanded}>
      <DecisionSummaryLine state={decisionState} entry={decisionEntry} />
      <DecisionEditor
        entry={decisionEntry}
        onSetDecision={onSetDecision}
        onClear={onClearDecision}
      />

      {compareTo && (
        <GapSummaryLine car={car} compareTo={compareTo} weights={weights} />
      )}

      {editableRatings.length > 0 && (
        <div className={styles.ratings}>
          <h3 className={styles.ratingsHeading}>Tus valoraciones</h3>
          {editableRatings.map((rating) => (
            <label key={rating.field} className={styles.ratingRow}>
              <span className={styles.ratingTop}>
                <span className={styles.ratingName}>{rating.label}</span>
                <span className={styles.ratingValue}>
                  {rating.value.toFixed(1)}
                </span>
              </span>
              <input
                className={styles.ratingSlider}
                type="range"
                min={1}
                max={5}
                step={0.5}
                value={rating.value}
                onChange={(event) =>
                  onRatingChange({
                    [rating.field]: Number(event.target.value),
                  })
                }
              />
            </label>
          ))}
        </div>
      )}

      {car.axes.map((axis) => (
        <AxisBreakdownView key={axis.axisId} breakdown={axis} />
      ))}
    </div>
  );

  if (isPodium) {
    return (
      <li className={styles.podiumCard}>
        <div className={styles.podiumHeader}>
          {toggle}
          <div className={styles.podiumMeta}>
            {secondaryLine}
            <span
              className={
                isLeader ? styles.scorePodiumLeader : styles.scorePodium
              }
            >
              {formatNumber(car.percentage, 0)}%
            </span>
          </div>
        </div>
        <div className={styles.barPodium}>
          <div
            className={primitives.proportionBarFill}
            style={{ width: `${Math.max(0, Math.min(100, car.percentage))}%` }}
          />
        </div>
        {expandedContent}
      </li>
    );
  }

  return (
    <li className={isLeader ? styles.rowLeader : styles.row}>
      {toggle}
      {secondaryLine}
      <div className={styles.scoreRow}>
        <div className={styles.bar}>
          <div
            className={primitives.proportionBarFill}
            style={{ width: `${Math.max(0, Math.min(100, car.percentage))}%` }}
          />
        </div>
        <span className={isLeader ? styles.scoreLeader : styles.score}>
          {formatNumber(car.percentage, 0)}%
        </span>
      </div>
      {expandedContent}
    </li>
  );
}
