import type { Car, SourcedNumber } from '../../domain/car';
import type { CarScoreBreakdown } from '../../domain/scoring/breakdown';
import type { RatingOverride } from '../../domain/scoring/overrides';
import { formatEur, formatNumber } from '../format';
import primitives from '../primitives.module.css';
import { AxisBreakdownView } from './AxisBreakdownView';
import { EstimatedMark } from './EstimatedMark';
import type { EditableRating } from './RankingList';
import { TECHNOLOGY_LABELS } from '../technologyLabels';
import styles from './RankingRow.module.css';

interface RankingRowProps {
  car: CarScoreBreakdown;
  rawCar?: Car;
  rank: number;
  isLeader: boolean;
  expanded: boolean;
  onToggle: () => void;
  editableRatings: EditableRating[];
  onRatingChange: (override: RatingOverride) => void;
}

function currentSource(sourced: SourcedNumber) {
  return sourced.sources.find((source) => source.current);
}

export function RankingRow({
  car,
  rawCar,
  rank,
  isLeader,
  expanded,
  onToggle,
  editableRatings,
  onRatingChange,
}: RankingRowProps) {
  const position = String(rank).padStart(2, '0');
  const accelEstimated = rawCar
    ? (currentSource(rawCar.acceleration0to100)?.estimated ?? false)
    : false;

  return (
    <li className={isLeader ? styles.rowLeader : styles.row}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span className={isLeader ? styles.positionLeader : styles.position}>
          {position}
        </span>{' '}
        <span className={styles.name}>{car.carName}</span>
        <span className={primitives.visuallyHidden}>
          {expanded ? ', ocultar desglose' : ', ver desglose'}
        </span>
      </button>

      {rawCar && (
        <p className={styles.secondaryLine}>
          <span>{TECHNOLOGY_LABELS[rawCar.technology]}</span>
          <span>·</span>
          <span>{formatNumber(rawCar.powerCv.value, 0)} CV</span>
          <span>·</span>
          <span>
            {formatNumber(rawCar.acceleration0to100.value, 1)}s
            {accelEstimated && <EstimatedMark />}
          </span>
          <span>·</span>
          <span>{formatEur(rawCar.priceEur.value)}</span>
          {car.overBudget && (
            <span className={primitives.statusMark}>Fuera de presupuesto</span>
          )}
        </p>
      )}

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

      {expanded && (
        <div className={styles.expanded}>
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
      )}
    </li>
  );
}
