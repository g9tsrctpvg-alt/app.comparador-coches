import { useState } from 'react';
import type { CarScoreBreakdown } from '../../domain/scoring/breakdown';
import { formatNumber } from '../format';
import { assertDefined } from '../assert';
import { AxisBreakdownView } from './AxisBreakdownView';

interface RatingOverride {
  aestheticsExterior?: number;
  aestheticsInterior?: number;
  travelComfort?: number;
}

interface RankingListProps {
  cars: CarScoreBreakdown[];
  hideOverBudget: boolean;
  onRatingChange: (carId: string, override: RatingOverride) => void;
}

function ratingInput(
  label: string,
  value: number,
  onChange: (next: number) => void,
) {
  return (
    <label>
      {label}: {value.toFixed(1)}
      <input
        type="range"
        min={1}
        max={5}
        step={0.5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function findAxis(car: CarScoreBreakdown, axisId: string) {
  return assertDefined(
    car.axes.find((axis) => axis.axisId === axisId),
    `El eje «${axisId}» no está en el desglose de ${car.carName}`,
  );
}

function findSubcomponent(
  axis: ReturnType<typeof findAxis>,
  predicate: (label: string) => boolean,
) {
  const subcomponents = assertDefined(
    axis.subcomponents,
    `El eje «${axis.axisId}» no tiene subcomponentes`,
  );
  return assertDefined(
    subcomponents.find((sub) => predicate(sub.label)),
    `No se encontró el subcomponente esperado en «${axis.axisId}»`,
  );
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
        const estetica = findAxis(car, 'estetica');
        const viaje = findAxis(car, 'viaje');
        const exterior = findSubcomponent(estetica, (label) =>
          label.startsWith('Nota exterior'),
        );
        const interior = findSubcomponent(estetica, (label) =>
          label.startsWith('Nota interior'),
        );
        const travel = findSubcomponent(viaje, (label) =>
          label.startsWith('Tu valoración'),
        );
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
                {ratingInput('Nota exterior', exterior.rawValue, (next) =>
                  onRatingChange(car.carId, { aestheticsExterior: next }),
                )}
                {ratingInput('Nota interior', interior.rawValue, (next) =>
                  onRatingChange(car.carId, { aestheticsInterior: next }),
                )}
                {ratingInput(
                  'Espacio y confort en viaje',
                  travel.rawValue,
                  (next) => onRatingChange(car.carId, { travelComfort: next }),
                )}

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
