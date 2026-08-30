import type { RuleFailure } from '../../domain/eliminatoryRules';
import styles from './EligibilityMark.module.css';

interface EligibilityMarkProps {
  overBudget: boolean;
  failures: RuleFailure[];
}

/** El texto de la marca (requisito 5.1): nombra qué falla, nunca solo un
 * genérico «No cumple» — mismo criterio de `DecisionMark`, texto siempre
 * escrito, nunca solo color. */
function eligibilityLabel(overBudget: boolean, failureCount: number): string {
  const parts: string[] = [];
  if (overBudget) parts.push('presupuesto');
  if (failureCount > 0) {
    parts.push(
      `${failureCount} imprescindible${failureCount === 1 ? '' : 's'}`,
    );
  }
  return `No cumple ${parts.join(' y ')}`;
}

/**
 * La marca de incumplimiento (product/0031, requisito 5): candidatos que no
 * cumplen presupuesto o alguna regla eliminatoria activa. A diferencia de
 * `DecisionMark`, es puramente informativa —no abre ningún diálogo—: las
 * reglas se editan solo desde el panel de la clasificación (requisito 5.3).
 * `null` cuando el coche cumple todo: el ruido visual se reserva a lo que
 * de verdad falla.
 */
export function EligibilityMark({
  overBudget,
  failures,
}: EligibilityMarkProps) {
  if (!overBudget && failures.length === 0) return null;
  return (
    <span className={styles.mark}>
      {eligibilityLabel(overBudget, failures.length)}
    </span>
  );
}
