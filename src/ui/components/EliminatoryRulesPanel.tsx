import type { FichaField } from '../../domain/ficha';
import {
  requiredOperatorFor,
  type EliminatoryRule,
  type RuleOperator,
} from '../../domain/eliminatoryRules';
import { COMPLETE_BLOCKS } from '../FichaPage';
import primitives from '../primitives.module.css';
import { CollapsiblePanel } from './CollapsiblePanel';
import styles from './EliminatoryRulesPanel.module.css';

interface EliminatoryRulesPanelProps {
  rules: EliminatoryRule[];
  onRulesChange: (rules: EliminatoryRule[]) => void;
  budgetEur: number;
  onBudgetChange: (value: number) => void;
  hideFailingRules: boolean;
  onHideFailingRulesChange: (value: boolean) => void;
}

const OPERATOR_LABELS: Record<RuleOperator, string> = {
  min: 'mínimo',
  max: 'máximo',
};

/** Busca la etiqueta de `field` en los mismos seis bloques que «Orden» ya
 * agrupa (`COMPLETE_BLOCKS`, `src/ui/FichaPage.tsx`), sin una segunda
 * declaración de las veintiséis etiquetas. Exportada para que
 * `IneligibleRow` (product/0031) nombre la magnitud de una regla
 * incumplida sin repetir esta búsqueda. */
export function fieldLabel(field: FichaField): string {
  for (const block of COMPLETE_BLOCKS) {
    const def = block.fields.find((candidate) => candidate.key === field);
    if (def) return def.label;
  }
  return field;
}

/** El presupuesto (product/0031, requisito 2.1): no es una `EliminatoryRule`
 * —sigue siendo `budgetEur`/`car.overBudget`—, así que este panel lo
 * enseña como una fila fija y no eliminable, sobre el mismo dato que
 * «Supuestos» edita. */
function BudgetRow({
  budgetEur,
  onBudgetChange,
}: {
  budgetEur: number;
  onBudgetChange: (value: number) => void;
}) {
  return (
    <label className={styles.row}>
      <span className={styles.top}>
        <span className={styles.ruleName}>Precio máximo</span>
        <span className={primitives.mono}>
          {budgetEur.toLocaleString('es-ES')} €
        </span>
      </span>
      <input
        type="number"
        className={styles.budgetInput}
        min={20000}
        max={100000}
        step={500}
        value={budgetEur}
        onChange={(event) => onBudgetChange(Number(event.target.value))}
      />
    </label>
  );
}

function RuleRow({
  rule,
  usedFields,
  onChange,
  onRemove,
}: {
  rule: EliminatoryRule;
  usedFields: ReadonlySet<FichaField>;
  onChange: (next: EliminatoryRule) => void;
  onRemove: () => void;
}) {
  const forced = requiredOperatorFor(rule.field);

  return (
    <div className={styles.row}>
      <select
        aria-label="Magnitud del imprescindible"
        className={styles.fieldSelect}
        value={rule.field}
        onChange={(event) => {
          const field = event.target.value as FichaField;
          const operator = requiredOperatorFor(field) ?? rule.operator;
          onChange({ field, operator, value: rule.value });
        }}
      >
        {COMPLETE_BLOCKS.map((block) => {
          const options = block.fields.filter(
            (def) => def.key === rule.field || !usedFields.has(def.key),
          );
          if (options.length === 0) return null;
          return (
            <optgroup key={block.id} label={block.label}>
              {options.map((def) => (
                <option key={def.key} value={def.key}>
                  {def.label}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>

      <div className={styles.ruleFields}>
        {forced === null ? (
          <select
            aria-label="Operador del imprescindible"
            className={styles.operatorSelect}
            value={rule.operator}
            onChange={(event) =>
              onChange({
                ...rule,
                operator: event.target.value as RuleOperator,
              })
            }
          >
            <option value="min">mínimo</option>
            <option value="max">máximo</option>
          </select>
        ) : (
          <span className={styles.operatorFixed}>
            {OPERATOR_LABELS[forced]}
          </span>
        )}

        <input
          type="number"
          aria-label={`Umbral de ${fieldLabel(rule.field)}`}
          className={styles.valueInput}
          value={rule.value}
          onChange={(event) =>
            onChange({ ...rule, value: Number(event.target.value) })
          }
        />

        <button
          type="button"
          className={styles.removeButton}
          onClick={onRemove}
          aria-label={`Quitar el imprescindible de ${fieldLabel(rule.field)}`}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  );
}

/**
 * El panel «Imprescindibles» (product/0031): reglas eliminatorias sobre
 * cualquier magnitud de la ficha, más el presupuesto como su primera fila
 * fija. No toca la nota de ningún coche — filtra qué se ve en la
 * clasificación (`splitByEligibility`, `components/ranking.ts`), nunca qué
 * se calcula (ADR 0004).
 */
export function EliminatoryRulesPanel({
  rules,
  onRulesChange,
  budgetEur,
  onBudgetChange,
  hideFailingRules,
  onHideFailingRulesChange,
}: EliminatoryRulesPanelProps) {
  const usedFields = new Set(rules.map((rule) => rule.field));
  const hasAvailableField = COMPLETE_BLOCKS.some((block) =>
    block.fields.some((def) => !usedFields.has(def.key)),
  );

  function updateRule(index: number, next: EliminatoryRule) {
    onRulesChange(rules.map((rule, i) => (i === index ? next : rule)));
  }

  function removeRule(index: number) {
    onRulesChange(rules.filter((_, i) => i !== index));
  }

  function addRule() {
    for (const block of COMPLETE_BLOCKS) {
      const first = block.fields.find((def) => !usedFields.has(def.key));
      if (first) {
        onRulesChange([
          ...rules,
          {
            field: first.key,
            operator: requiredOperatorFor(first.key) ?? 'min',
            value: 0,
          },
        ]);
        return;
      }
    }
  }

  const summary =
    rules.length === 0
      ? 'Ninguno'
      : `${rules.length} imprescindible${rules.length === 1 ? '' : 's'}${
          hideFailingRules ? ' · ocultando quien no cumple' : ''
        }`;

  return (
    <CollapsiblePanel
      ariaLabel="Imprescindibles"
      title="Imprescindibles"
      summary={summary}
    >
      <p className={styles.intro}>
        Un imprescindible filtra la clasificación entre quién cumple y quién no;
        no cambia la nota de ningún coche. «Altura de acceso» se aproxima con
        «Altura libre al suelo». Un coche que no declara la magnitud de un
        imprescindible no cuenta como incumplimiento.
      </p>

      <div className={styles.rows}>
        <BudgetRow budgetEur={budgetEur} onBudgetChange={onBudgetChange} />

        {rules.map((rule, index) => (
          <RuleRow
            key={rule.field}
            rule={rule}
            usedFields={usedFields}
            onChange={(next) => updateRule(index, next)}
            onRemove={() => removeRule(index)}
          />
        ))}

        {hasAvailableField && (
          <button
            type="button"
            className={primitives.buttonOutline}
            onClick={addRule}
          >
            Añadir imprescindible
          </button>
        )}

        <label className={primitives.checkboxRow}>
          <input
            type="checkbox"
            checked={hideFailingRules}
            onChange={(event) => onHideFailingRulesChange(event.target.checked)}
          />
          Ocultar los que no cumplen
        </label>
      </div>
    </CollapsiblePanel>
  );
}
