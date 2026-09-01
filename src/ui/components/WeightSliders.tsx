import { useState } from 'react';
import type { Car } from '../../domain/car';
import {
  canCalibrate,
  MIN_CARS_TO_CALIBRATE,
  type CarProfile,
} from '../../domain/calibration';
import {
  AXIS_LABELS,
  AXIS_ORDER,
  type AxisWeights,
} from '../../domain/scoring/weights';
import { AXIS_THEME_CLASS } from '../axisTheme';
import { AxisIcon } from './AxisIcon';
import { CalibrationDialog } from './CalibrationDialog';
import { CollapsiblePanel } from './CollapsiblePanel';
import styles from './WeightSliders.module.css';

interface WeightSlidersProps {
  weights: AxisWeights;
  onChange: (next: AxisWeights) => void;
  /** Los coches elegibles ahora mismo. La tanda los congela al abrirse
   * (product/0035, requisito 11.2), así que lo que cambie después no la
   * afecta. */
  calibrationCars: Car[];
  calibrationProfiles: CarProfile[];
}

/** Lo que la tanda congela al abrirse. */
interface FrozenSession {
  cars: Car[];
  profiles: CarProfile[];
}

function summaryOf(weights: AxisWeights): string {
  return AXIS_ORDER.map(
    (axisId) => `${AXIS_LABELS[axisId]} ${weights[axisId]}`,
  ).join(' · ');
}

export function WeightSliders({
  weights,
  onChange,
  calibrationCars,
  calibrationProfiles,
}: WeightSlidersProps) {
  const [session, setSession] = useState<FrozenSession | null>(null);
  const available = canCalibrate(calibrationProfiles.length);

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
      <div className={styles.calibration}>
        <button
          type="button"
          className={styles.calibrateButton}
          disabled={!available}
          onClick={() =>
            setSession({
              cars: calibrationCars,
              profiles: calibrationProfiles,
            })
          }
        >
          Calibrar eligiendo coches
        </button>
        <p className={styles.calibrationHint}>
          {available
            ? 'Una tanda de cara a cara deduce los siete pesos de lo que prefieres, y estos deslizadores quedan para el ajuste fino.'
            : `Hacen falta al menos ${MIN_CARS_TO_CALIBRATE} coches elegibles para calibrar: con menos no hay bastantes parejas para distinguir siete pesos.`}
        </p>
      </div>
      {session !== null && (
        <CalibrationDialog
          cars={session.cars}
          profiles={session.profiles}
          currentWeights={weights}
          onApply={onChange}
          onClose={() => setSession(null)}
        />
      )}
    </CollapsiblePanel>
  );
}
