import { useState } from 'react';
import type {
  CarScoreBreakdown,
  EditableRatingField,
  SubcomponentBreakdown,
} from '../../domain/scoring/breakdown';
import type { RatingOverride } from '../../domain/scoring/overrides';
import { formatNumber } from '../format';
import { AxisBreakdownView } from './AxisBreakdownView';

interface RankingListProps {
  cars: CarScoreBreakdown[];
  hideOverBudget: boolean;
  onRatingChange: (carId: string, override: RatingOverride) => void;
}

interface EditableRating {
  field: EditableRatingField;
  label: string;
  value: number;
}

function ratingLabel(sub: SubcomponentBreakdown): string {
  // La etiqueta del dominio lleva su propia coletilla «(editable)» porque
  // describe el paso de cálculo; aquí el control ya se ve editable.
  return sub.label.replace(/\s*\([^)]*editable[^)]*\)$/i, '');
}

/**
 * Recoge los subcomponentes que el dominio ha marcado como editables. La
 * interfaz no sabe —ni debe saber— cuáles son: se entera por la clave
 * `editableRating`, nunca por el texto de la etiqueta, que es copia y puede
 * reescribirse sin que nada avise.
 */
export function editableRatingsOf(car: CarScoreBreakdown): EditableRating[] {
  const found: EditableRating[] = [];
  for (const axis of car.axes) {
    for (const sub of axis.subcomponents ?? []) {
      if (sub.editableRating) {
        found.push({
          field: sub.editableRating,
          label: ratingLabel(sub),
          value: sub.rawValue,
        });
      }
    }
  }
  return found;
}

export function RankingList({
  cars,
  hideOverBudget,
  onRatingChange,
}: RankingListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visible = hideOverBudget ? cars.filter((car) => !car.overBudget) : cars;
  const ranked = [...visible].sort((a, b) => b.total - a.total);

  return (
    <ol aria-label="Ranking">
      {ranked.map((car) => {
        const expanded = expandedId === car.carId;

        return (
          <li key={car.carId}>
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : car.carId)}
            >
              {car.carName} — {formatNumber(car.total)} puntos
              {car.overBudget && ' — FUERA DE PRESUPUESTO'}
              {expanded ? ' (ocultar desglose)' : ' (ver desglose)'}
            </button>

            {expanded && (
              <div>
                {editableRatingsOf(car).map((rating) => (
                  <label key={rating.field}>
                    {rating.label}: {rating.value.toFixed(1)}
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.5}
                      value={rating.value}
                      onChange={(event) =>
                        onRatingChange(car.carId, {
                          [rating.field]: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                ))}

                {car.axes.map((axis) => (
                  <AxisBreakdownView key={axis.axisId} breakdown={axis} />
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
