import {
  AXIS_LABELS,
  AXIS_ORDER,
  type AxisWeights,
} from '../../domain/scoring/weights';
import styles from './WeightSliders.module.css';

interface WeightSlidersProps {
  weights: AxisWeights;
  onChange: (next: AxisWeights) => void;
}

export function WeightSliders({ weights, onChange }: WeightSlidersProps) {
  return (
    <section aria-label="Pesos por eje" className={styles.panel}>
      <h2 className={styles.heading}>Pesos de decisión</h2>
      <div className={styles.rows}>
        {AXIS_ORDER.map((axisId) => {
          const value = weights[axisId];
          return (
            <label key={axisId} className={styles.row}>
              <span className={styles.top}>
                <span className={styles.axisName}>{AXIS_LABELS[axisId]}</span>
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
    </section>
  );
}
