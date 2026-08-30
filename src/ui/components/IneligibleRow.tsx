import type { RuleFailure } from '../../domain/eliminatoryRules';
import { COMPLETE_FIELD_DEFS, type FieldDef } from '../FichaPage';
import { formatEur, formatNumber } from '../format';
import primitives from '../primitives.module.css';
import { fieldLabel } from './EliminatoryRulesPanel';
import type { IneligibleCar } from './ranking';
import styles from './IneligibleRow.module.css';

function fieldDefOf(field: RuleFailure['field']): FieldDef {
  const def = COMPLETE_FIELD_DEFS.get(field);
  if (def === undefined) {
    throw new Error(`FieldDef no declarado en COMPLETE_BLOCKS: ${field}`);
  }
  return def;
}

function formatFieldValue(value: number, def: FieldDef): string {
  if (def.isEuro) return formatEur(value);
  const unit = def.unitFallback ?? '';
  const formatted = formatNumber(value, def.decimals ?? 0);
  return unit ? `${formatted} ${unit}` : formatted;
}

/** `≥`/`≤`, no el nombre del operador: la frase completa —«pides ≥ 500
 * L»— ya dice qué exige (requisito 4.2). */
function operatorSymbol(operator: RuleFailure['operator']): string {
  return operator === 'min' ? '≥' : '≤';
}

function failureText(failure: RuleFailure): string {
  const def = fieldDefOf(failure.field);
  return (
    `${fieldLabel(failure.field)}: pides ${operatorSymbol(failure.operator)} ` +
    `${formatFieldValue(failure.threshold, def)}, tiene ` +
    `${formatFieldValue(failure.actual, def)}`
  );
}

/**
 * Una fila del tramo no elegible (product/0031, requisito 4.2): sin
 * posición —no está en una clasificación de la que este tramo está
 * fuera—, con la razón exacta del incumplimiento en vez de un genérico «no
 * cumple». Informativa, no desplegable: no repite el desglose completo ni
 * la edición de decisión que sí tiene `RankingRow`.
 */
export function IneligibleRow({ car, overBudget, failures }: IneligibleCar) {
  const reasons = [
    ...(overBudget ? ['Fuera de presupuesto'] : []),
    ...failures.map(failureText),
  ];

  return (
    <li className={styles.row}>
      <div className={styles.top}>
        <span className={styles.name}>{car.carName}</span>
        <span className={styles.score}>{formatNumber(car.percentage, 0)}%</span>
      </div>
      <div className={primitives.proportionBarRow}>
        <div
          className={primitives.proportionBarFillDimmed}
          style={{ width: `${Math.max(0, Math.min(100, car.percentage))}%` }}
        />
      </div>
      <p className={styles.reasons}>{reasons.join(' · ')}</p>
    </li>
  );
}
