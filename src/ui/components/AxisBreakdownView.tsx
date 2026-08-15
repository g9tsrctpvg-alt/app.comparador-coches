import type { AxisBreakdown } from '../../domain/scoring/breakdown';
import { AXIS_THEME_CLASS } from '../axisTheme';
import { formatEur, formatNumber, formatSigned } from '../format';
import primitives from '../primitives.module.css';
import { AxisIcon } from './AxisIcon';
import styles from './AxisBreakdownView.module.css';
import { EstimatedMark } from './EstimatedMark';

function formatValue(value: number, unit?: string): string {
  if (unit === '€') return formatEur(value);
  const formatted = formatNumber(value, Number.isInteger(value) ? 0 : 2);
  return unit ? `${formatted} ${unit}` : formatted;
}

interface AxisBreakdownViewProps {
  breakdown: AxisBreakdown;
}

export function AxisBreakdownView({ breakdown }: AxisBreakdownViewProps) {
  const barPct = Math.max(0, Math.min(100, (breakdown.score / 10) * 100));
  const dimmed = breakdown.weight === 0;

  return (
    <div className={`${styles.axis} ${AXIS_THEME_CLASS[breakdown.axisId]}`}>
      <header className={styles.header}>
        <span className={styles.name}>
          <AxisIcon axisId={breakdown.axisId} />
          {breakdown.label}
        </span>
        <span className={styles.meta}>
          peso <span className={styles.metaValue}>{breakdown.weight}</span>
        </span>
        <span className={styles.score}>{formatNumber(breakdown.score)}/10</span>
        <span className={styles.meta}>
          aportación{' '}
          <span className={styles.metaValue}>
            {formatNumber(breakdown.contribution)}
          </span>
        </span>
      </header>

      <div className={primitives.proportionBarAxis}>
        <div
          className={
            dimmed
              ? primitives.proportionBarFillDimmed
              : primitives.proportionBarFill
          }
          style={{ width: `${barPct}%` }}
        />
      </div>

      <p className={styles.formula}>{breakdown.formulaDescription}</p>

      {breakdown.inputs.length > 0 && (
        <div>
          <span className={styles.groupLabel}>Datos de entrada</span>
          <ul className={styles.list}>
            {breakdown.inputs.map((input) => (
              <li key={input.label} className={styles.inputRow}>
                <span className={styles.inputLabel}>{input.label}</span>
                <span className={styles.inputValue}>
                  {formatValue(input.value, input.unit)}
                </span>
                {input.estimated && <EstimatedMark />}
                <span className={styles.source}>
                  fuente: {input.sourceLabel}
                </span>
                {input.discardedSources.length > 0 && (
                  <ul className={styles.discardedList}>
                    {input.discardedSources.map((discarded) => (
                      <li key={discarded.label}>
                        Descartada: {discarded.label} (
                        {typeof discarded.value === 'number'
                          ? formatValue(discarded.value, input.unit)
                          : discarded.value}
                        )
                        {discarded.discardedReason
                          ? ` — ${discarded.discardedReason}`
                          : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {breakdown.assumptionsUsed.length > 0 && (
        <div>
          <span className={styles.groupLabel}>Supuestos aplicados</span>
          <ul className={styles.list}>
            {breakdown.assumptionsUsed.map((assumption) => (
              <li key={assumption.label} className={styles.inputRow}>
                <span className={styles.inputLabel}>{assumption.label}</span>
                <span className={styles.inputValue}>{assumption.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {breakdown.info && breakdown.info.length > 0 && (
        <div>
          <span className={styles.groupLabel}>Información</span>
          <ul className={styles.list}>
            {breakdown.info.map((item) => (
              <li key={item.label} className={styles.inputRow}>
                <span className={styles.inputLabel}>{item.label}</span>
                <span className={styles.source}>{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {breakdown.subcomponents && breakdown.subcomponents.length > 0 && (
        <div>
          <span className={styles.groupLabel}>Pasos intermedios</span>
          <ul className={styles.list}>
            {breakdown.subcomponents.map((sub) => (
              <li key={sub.label}>
                <div className={styles.inputRow}>
                  <span className={styles.inputLabel}>{sub.label}</span>
                  <span className={styles.inputValue}>
                    {formatValue(sub.rawValue, sub.unit)}
                  </span>
                </div>
                {sub.normalization && (
                  <p className={styles.source}>
                    Normalizado{' '}
                    {formatNumber(sub.normalization.normalizedValue)}/10 (mín.{' '}
                    {sub.normalization.min.carName}{' '}
                    {formatValue(sub.normalization.min.value, sub.unit)}, máx.{' '}
                    {sub.normalization.max.carName}{' '}
                    {formatValue(sub.normalization.max.value, sub.unit)})
                  </p>
                )}
                {sub.scale && (
                  <div className={styles.anchors}>
                    <span className={styles.anchor}>
                      <span className={primitives.visuallyHidden}>
                        Valor que puntúa 10:{' '}
                      </span>
                      {formatValue(sub.scale.goodAnchor, sub.unit)}
                    </span>{' '}
                    <span className={styles.anchorScore}>→ 10</span>
                    <span className={styles.anchor}>
                      <span className={primitives.visuallyHidden}>
                        Valor que puntúa 0:{' '}
                      </span>
                      {formatValue(sub.scale.badAnchor, sub.unit)}
                    </span>{' '}
                    <span className={styles.anchorScore}>→ 0</span>
                    <span className={styles.source}>
                      nota {formatNumber(sub.scale.score)}/10
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {breakdown.normalization && (
        <div>
          <span className={styles.groupLabel}>Normalización del eje</span>
          <p className={styles.source}>
            Valor crudo{' '}
            {formatValue(breakdown.normalization.rawValue, breakdown.rawUnit)},
            dirección {breakdown.normalization.direction}. Mínimo:{' '}
            {breakdown.normalization.min.carName} (
            {formatValue(breakdown.normalization.min.value, breakdown.rawUnit)}
            ). Máximo: {breakdown.normalization.max.carName} (
            {formatValue(breakdown.normalization.max.value, breakdown.rawUnit)}
            ). Normalizado:{' '}
            {formatNumber(breakdown.normalization.normalizedValue)}/10.
          </p>
        </div>
      )}

      <div>
        <span className={styles.groupLabel}>Penalizaciones</span>
        {breakdown.penalties.length === 0 ? (
          <p className={styles.penaltyInactive}>No aplican a este eje.</p>
        ) : (
          <ul className={styles.list}>
            {breakdown.penalties.map((penalty) => (
              <li key={penalty.label} className={styles.inputRow}>
                <span className={styles.inputLabel}>
                  {penalty.label} — {penalty.condition}
                </span>
                <span
                  className={
                    penalty.active
                      ? styles.penaltyActive
                      : styles.penaltyInactive
                  }
                >
                  {penalty.active ? (
                    <>
                      activa,{' '}
                      <span className={primitives.mono}>
                        {formatSigned(penalty.effect)}
                      </span>{' '}
                      puntos
                    </>
                  ) : (
                    'no activa'
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
