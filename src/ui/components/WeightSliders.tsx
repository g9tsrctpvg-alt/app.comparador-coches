import {
  AXIS_LABELS,
  AXIS_ORDER,
  type AxisWeights,
} from '../../domain/scoring/weights';
import { AXIS_THEME_CLASS } from '../axisTheme';
import { AxisIcon } from './AxisIcon';
import { CollapsiblePanel } from './CollapsiblePanel';
import styles from './WeightSliders.module.css';

interface WeightSlidersProps {
  weights: AxisWeights;
  onChange: (next: AxisWeights) => void;
}

function summaryOf(weights: AxisWeights): string {
  return AXIS_ORDER.map(
    (axisId) => `${AXIS_LABELS[axisId]} ${weights[axisId]}`,
  ).join(' · ');
}

export function WeightSliders({ weights, onChange }: WeightSlidersProps) {
  return (
    <CollapsiblePanel
      ariaLabel="Pesos por eje"
      title="Pesos de decisión"
      summary={summaryOf(weights)}
    >
      <div className={styles.rows}>
        {AXIS_ORDER.map((axisId) => {
          const value = weights[axisId];
          return (
            <label
              key={axisId}
              className={`${styles.row} ${AXIS_THEME_CLASS[axisId]}`}
            >
              <span className={styles.top}>
                <span className={styles.axisName}>
                  <AxisIcon axisId={axisId} />
                  {AXIS_LABELS[axisId]}
                </span>
                <span
                  className={value === 0 ? styles.valueDimmed : styles.value}
                >
                  {value}
                </span>
              </span>
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={10}
                step={1}
                value={value}
                onChange={(event) =>
                  onChange({ ...weights, [axisId]: Number(event.target.value) })
                }
              />
            </label>
          );
        })}
      </div>
    </CollapsiblePanel>
  );
}
