import { useState } from 'react';
import type { Car } from '../../domain/car';
import type {
  CarScoreBreakdown,
  EditableRatingField,
  SubcomponentBreakdown,
} from '../../domain/scoring/breakdown';
import type { RatingOverride } from '../../domain/scoring/overrides';
import { rankVisible } from './ranking';
import { RankingRow } from './RankingRow';
import styles from './RankingList.module.css';

interface RankingListProps {
  cars: CarScoreBreakdown[];
  rawCars: Car[];
  hideOverBudget: boolean;
  onRatingChange: (carId: string, override: RatingOverride) => void;
}

export interface EditableRating {
  field: EditableRatingField;
  label: string;
  value: number;
}

/** El podio (product/0022): los tres primeros de la lista visible llevan
 * tratamiento de tarjeta; el resto, la fila de siempre. Si hay tres coches
 * o menos, todos son podio y no hay «resto» — sin hueco ni relleno. */
const PODIUM_SIZE = 3;

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
  rawCars,
  hideOverBudget,
  onRatingChange,
}: RankingListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const ranked = rankVisible(cars, hideOverBudget);
  const rawById = new Map(rawCars.map((car) => [car.id, car]));

  return (
    <ol aria-label="Ranking" className={styles.list}>
      {ranked.map((car, index) => {
        const expanded = expandedId === car.carId;

        return (
          <RankingRow
            key={car.carId}
            car={car}
            rawCar={rawById.get(car.carId)}
            rank={index + 1}
            isLeader={index === 0}
            variant={index < PODIUM_SIZE ? 'podium' : 'list'}
            expanded={expanded}
            onToggle={() => setExpandedId(expanded ? null : car.carId)}
            editableRatings={editableRatingsOf(car)}
            onRatingChange={(override) => onRatingChange(car.carId, override)}
          />
        );
      })}
    </ol>
  );
}
