import type { AxisBreakdown } from '../../domain/scoring/breakdown';
import { formatEur, formatNumber, formatSigned } from '../format';

function formatValue(value: number, unit?: string): string {
  if (unit === '€') return formatEur(value);
  const formatted = formatNumber(value, Number.isInteger(value) ? 0 : 2);
  return unit ? `${formatted} ${unit}` : formatted;
}

interface AxisBreakdownViewProps {
  breakdown: AxisBreakdown;
}

export function AxisBreakdownView({ breakdown }: AxisBreakdownViewProps) {
  return (
    <div>
      <p>
        <strong>{breakdown.label}</strong> — peso {breakdown.weight}, puntuación{' '}
        {formatNumber(breakdown.score)}/10, aportación{' '}
        {formatNumber(breakdown.contribution)}
      </p>
      <p>{breakdown.formulaDescription}</p>

      {breakdown.inputs.length > 0 && (
        <div>
          <h4>Datos de entrada</h4>
          <ul>
            {breakdown.inputs.map((input) => (
              <li key={input.label}>
                {input.label}: {formatValue(input.value, input.unit)}
                {input.estimated ? ' (estimado)' : ' (verificado)'} — fuente:{' '}
                {input.sourceLabel}
                {input.discardedSources.length > 0 && (
                  <ul>
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
          <h4>Supuestos aplicados</h4>
          <ul>
            {breakdown.assumptionsUsed.map((assumption) => (
              <li key={assumption.label}>
                {assumption.label}: {assumption.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {breakdown.subcomponents && breakdown.subcomponents.length > 0 && (
        <div>
          <h4>Pasos intermedios</h4>
          <ul>
            {breakdown.subcomponents.map((sub) => (
              <li key={sub.label}>
                {sub.label}: {formatValue(sub.rawValue, sub.unit)}
                {sub.normalization && (
                  <>
                    {' '}
                    → normalizado{' '}
                    {formatNumber(sub.normalization.normalizedValue)}/10 (mín.{' '}
                    {sub.normalization.min.carName}{' '}
                    {formatValue(sub.normalization.min.value, sub.unit)}, máx.{' '}
                    {sub.normalization.max.carName}{' '}
                    {formatValue(sub.normalization.max.value, sub.unit)})
                  </>
                )}
                {sub.scale && (
                  <>
                    {' '}
                    → nota {formatNumber(sub.scale.score)}/10 (escala:{' '}
                    {formatValue(sub.scale.goodAnchor, sub.unit)} → 10,{' '}
                    {formatValue(sub.scale.badAnchor, sub.unit)} → 0)
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {breakdown.normalization && (
        <div>
          <h4>Normalización del eje</h4>
          <p>
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
        <h4>Penalizaciones</h4>
        {breakdown.penalties.length === 0 ? (
          <p>No aplican a este eje.</p>
        ) : (
          <ul>
            {breakdown.penalties.map((penalty) => (
              <li key={penalty.label}>
                {penalty.label} — {penalty.condition}:{' '}
                {penalty.active
                  ? `activa, ${formatSigned(penalty.effect)} puntos`
                  : 'no activa'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
