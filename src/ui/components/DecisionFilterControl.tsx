import { DECISION_FILTERS, type DecisionFilter } from '../../domain/decisions';
import { DECISION_FILTER_LABELS } from '../decisionLabels';
import primitives from '../primitives.module.css';

interface DecisionFilterControlProps {
  filter: DecisionFilter;
  onChange: (filter: DecisionFilter) => void;
}

/** El filtro de tres posiciones (product/0030, requisito 4.1), con la misma
 * pastilla que la barra de la ficha (`technical/0010`): reutiliza
 * `.field`/`.fieldLabel`/`.fieldSelect` en vez de declarar una superficie
 * de control nueva para un tercer sitio. */
export function DecisionFilterControl({
  filter,
  onChange,
}: DecisionFilterControlProps) {
  return (
    <div className={primitives.field}>
      <label className={primitives.fieldLabel} htmlFor="decision-filter-select">
        Decisión
      </label>
      <select
        id="decision-filter-select"
        className={primitives.fieldSelect}
        value={filter}
        onChange={(event) => onChange(event.target.value as DecisionFilter)}
      >
        {DECISION_FILTERS.map((option) => (
          <option key={option} value={option}>
            {DECISION_FILTER_LABELS[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
