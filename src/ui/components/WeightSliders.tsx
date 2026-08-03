import {
  AXIS_LABELS,
  AXIS_ORDER,
  type AxisWeights,
} from '../../domain/scoring/weights';

interface WeightSlidersProps {
  weights: AxisWeights;
  onChange: (next: AxisWeights) => void;
}

export function WeightSliders({ weights, onChange }: WeightSlidersProps) {
  return (
    <section aria-label="Pesos por eje">
      <h2>Pesos por eje</h2>
      {AXIS_ORDER.map((axisId) => (
        <label key={axisId}>
          {AXIS_LABELS[axisId]}: {weights[axisId]}
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={weights[axisId]}
            onChange={(event) =>
              onChange({ ...weights, [axisId]: Number(event.target.value) })
            }
          />
        </label>
      ))}
    </section>
  );
}
