import { useState } from 'react';
import type { Car } from '../../domain/car';
import {
  decisionOf,
  entryOf,
  type DecisionFilter,
  type DecisionLog,
  type StoredDecisionState,
} from '../../domain/decisions';
import type { EliminatoryRule } from '../../domain/eliminatoryRules';
import type {
  CarScoreBreakdown,
  EditableRatingField,
  SubcomponentBreakdown,
} from '../../domain/scoring/breakdown';
import type { RatingOverride } from '../../domain/scoring/overrides';
import type { AxisWeights } from '../../domain/scoring/weights';
import { DECISION_FILTER_LABELS } from '../decisionLabels';
import primitives from '../primitives.module.css';
import { CollapsiblePanel } from './CollapsiblePanel';
import { IneligibleRow } from './IneligibleRow';
import { splitByEligibility } from './ranking';
import { RankingRow } from './RankingRow';
import styles from './RankingList.module.css';

interface RankingListProps {
  cars: CarScoreBreakdown[];
  rawCars: Car[];
  eliminatoryRules: EliminatoryRule[];
  hideFailingRules: boolean;
  onClearRules: () => void;
  weights: AxisWeights;
  decisionLog: DecisionLog;
  onSetDecision: (
    carId: string,
    state: StoredDecisionState,
    reason: string | undefined,
  ) => void;
  onClearDecision: (carId: string) => void;
  onDecisionFilterChange: (filter: DecisionFilter) => void;
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
  eliminatoryRules,
  hideFailingRules,
  onClearRules,
  weights,
  decisionLog,
  onSetDecision,
  onClearDecision,
  onDecisionFilterChange,
  onRatingChange,
}: RankingListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { eligible, ineligible } = splitByEligibility(
    cars,
    rawCars,
    eliminatoryRules,
    decisionLog,
  );
  const decisionFilteredCount = eligible.length + ineligible.length;

  // Vacía por el filtro de decisión y no por falta de datos (requisito
  // 4.6 de product/0030): un mensaje que nombra el filtro activo, nunca
  // una lista en blanco ni el mensaje de catálogo no cargado, que es otra
  // cosa.
  if (decisionFilteredCount === 0 && decisionLog.filter !== 'all') {
    return (
      <p role="status" className={styles.emptyFiltered}>
        El filtro «{DECISION_FILTER_LABELS[decisionLog.filter]}» no deja ningún
        coche visible.{' '}
        <button
          type="button"
          className={primitives.buttonGhost}
          onClick={() => onDecisionFilterChange('all')}
        >
          Volver a Todos
        </button>
      </p>
    );
  }

  const rawById = new Map(rawCars.map((car) => [car.id, car]));
  // La fila del líder se compara con el segundo; todas las demás, con el
  // líder (product/0029, requisito 4). `undefined` con un único candidato
  // visible: no hay con qué comparar, y la fila no enseña resumen.
  const leader = eligible[0];
  const second = eligible[1];

  const ineligibleSection = !hideFailingRules && ineligible.length > 0 && (
    <div className={styles.ineligibleSection}>
      <CollapsiblePanel
        ariaLabel="Coches que no cumplen tus imprescindibles"
        title={`No cumplen tus imprescindibles (${ineligible.length})`}
        summary="Presupuesto o algún imprescindible"
      >
        <ol
          aria-label="No cumplen tus imprescindibles"
          className={styles.ineligibleList}
        >
          {ineligible.map((entry) => (
            <IneligibleRow key={entry.car.carId} {...entry} />
          ))}
        </ol>
      </CollapsiblePanel>
    </div>
  );

  // Tramo elegible vacío habiendo al menos un coche visible (product/0031,
  // requisito 4.4): sustituye el límite conocido que documentaba
  // `docs/estado/interfaz.md` — una lista vacía por presupuesto con el
  // filtro de decisión en «Todos» no se distinguía de nada. El botón solo
  // aparece cuando hay una regla que de verdad quitar: si lo único que
  // vacía la lista es el presupuesto, no hay imprescindible que este botón
  // pueda borrar.
  if (eligible.length === 0 && decisionFilteredCount > 0) {
    return (
      <>
        <p role="status" className={styles.emptyFiltered}>
          Ningún coche cumple tus imprescindibles vigentes.{' '}
          {eliminatoryRules.length > 0 && (
            <button
              type="button"
              className={primitives.buttonGhost}
              onClick={onClearRules}
            >
              Quitar imprescindibles
            </button>
          )}
        </p>
        {ineligibleSection}
      </>
    );
  }

  return (
    <>
      <ol aria-label="Ranking" className={styles.list}>
        {eligible.map((car, index) => {
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
              compareTo={index === 0 ? second : leader}
              weights={weights}
              decisionState={decisionOf(decisionLog, car.carId)}
              decisionEntry={entryOf(decisionLog, car.carId)}
              onSetDecision={(state, reason) =>
                onSetDecision(car.carId, state, reason)
              }
              onClearDecision={() => onClearDecision(car.carId)}
            />
          );
        })}
      </ol>
      {ineligibleSection}
    </>
  );
}
