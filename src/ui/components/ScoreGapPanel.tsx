import { useState, type ReactNode } from 'react';
import type { CarScoreBreakdown } from '../../domain/scoring/breakdown';
import { percentageOf } from '../../domain/scoring/score';
import {
  crossingsInRange,
  splitScoreGap,
  stableAxes,
  type AxisGapLine,
} from '../../domain/scoring/scoreGap';
import type { AxisId, AxisWeights } from '../../domain/scoring/weights';
import { AXIS_THEME_CLASS } from '../axisTheme';
import { formatNumber, formatSigned } from '../format';
import primitives from '../primitives.module.css';
import { AxisBreakdownView } from './AxisBreakdownView';
import { AxisIcon } from './AxisIcon';
import styles from './ScoreGapPanel.module.css';

interface ScoreGapPanelProps {
  focusedName: string | undefined;
  pinnedName: string | undefined;
  focusedScore: CarScoreBreakdown | undefined;
  pinnedScore: CarScoreBreakdown | undefined;
  /** `false` cuando el modelo de comparación es «Ninguno» —distinto de que
   * sea una referencia sin nota, que se lee en `pinnedScore === undefined`
   * con `hasComparison` a `true` (product/0029, requisito 6). */
  hasComparison: boolean;
  weights: AxisWeights;
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <section
      aria-label="Detalle ejes"
      className={`${primitives.card} ${styles.panel}`}
    >
      <h2 className={styles.title}>Detalle ejes</h2>
      <p className={styles.emptyText}>{children}</p>
    </section>
  );
}

function pointsOf(line: AxisGapLine, weights: AxisWeights): number {
  return percentageOf(line.value, weights);
}

function AxisGapRow({
  line,
  maxAbsValue,
  weights,
  open,
  onToggle,
  focusedAxis,
  pinnedAxis,
}: {
  line: AxisGapLine;
  maxAbsValue: number;
  weights: AxisWeights;
  open: boolean;
  onToggle: () => void;
  focusedAxis: CarScoreBreakdown['axes'][number] | undefined;
  pinnedAxis: CarScoreBreakdown['axes'][number] | undefined;
}) {
  const points = pointsOf(line, weights);
  const halfWidthPct =
    maxAbsValue === 0 ? 0 : (Math.abs(line.value) / maxAbsValue) * 50;
  const side = line.value >= 0 ? styles.fillRight : styles.fillLeft;

  return (
    <div className={AXIS_THEME_CLASS[line.axisId]}>
      <button
        type="button"
        className={`${primitives.unstyledButton} ${styles.row}`}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className={styles.rowLabel}>
          <AxisIcon axisId={line.axisId} />
          {line.label}
        </span>
        <span className={styles.track} aria-hidden="true">
          <span
            className={`${styles.fill} ${side}`}
            style={{ width: `${halfWidthPct}%` }}
          />
        </span>
        <span className={`${primitives.numeric} ${styles.rowValue}`}>
          {formatSigned(points, 1)} pp
        </span>
      </button>
      {open && (
        <div className={styles.rowDetail}>
          {focusedAxis && <AxisBreakdownView breakdown={focusedAxis} />}
          {pinnedAxis && <AxisBreakdownView breakdown={pinnedAxis} />}
        </div>
      )}
    </div>
  );
}

function crossingSentence(line: AxisGapLine): string {
  const value = formatNumber(line.crossingWeight ?? 0, 1);
  return line.crossingDirection === 'below'
    ? `${line.label}: cambia el resultado por debajo de ${value}`
    : `${line.label}: cambia el resultado por encima de ${value}`;
}

/**
 * El bloque «Detalle ejes» (product/0029): reparte la diferencia de nota
 * entre el modelo enfocado y el modelo de comparación en la aportación de
 * cada eje, y dice qué pesos —movidos solos— pueden darle la vuelta al
 * resultado. No calcula nada por su cuenta (`ui-no-scoring-internals`):
 * `splitScoreGap` y sus dos selectores ya entregan cada línea lista.
 */
export function ScoreGapPanel({
  focusedName,
  pinnedName,
  focusedScore,
  pinnedScore,
  hasComparison,
  weights,
}: ScoreGapPanelProps) {
  const [open, setOpen] = useState(true);
  const [openAxisId, setOpenAxisId] = useState<AxisId | null>(null);

  if (focusedName === undefined) return null;

  if (!hasComparison) {
    return (
      <EmptyState>
        Elige un modelo con el que comparar en «Comparar» para ver el detalle
        por ejes.
      </EmptyState>
    );
  }
  if (pinnedScore === undefined) {
    return (
      <EmptyState>
        Comparando con «{pinnedName}» — es tu coche de referencia, no entra en
        la puntuación: aquí no hay nota que comparar.
      </EmptyState>
    );
  }
  if (focusedScore === undefined) {
    return (
      <EmptyState>
        «{focusedName}» es tu coche de referencia y no entra en la puntuación:
        aquí no hay nota que comparar.
      </EmptyState>
    );
  }

  const gap = splitScoreGap(focusedScore, pinnedScore);
  const nonZeroLines = gap.lines.filter((line) => line.value !== 0);
  const zeroLines = gap.lines.filter((line) => line.value === 0);
  const maxAbsValue = Math.max(
    ...nonZeroLines.map((line) => Math.abs(line.value)),
    0,
  );
  const inRange = crossingsInRange(gap);
  const stable = stableAxes(gap);

  const axisById = (
    score: CarScoreBreakdown,
    axisId: AxisId,
  ): CarScoreBreakdown['axes'][number] | undefined =>
    score.axes.find((axis) => axis.axisId === axisId);

  const winner = gap.totalDiff >= 0 ? focusedName : pinnedName;
  const headline =
    gap.totalDiff === 0
      ? `${focusedName} y ${pinnedName} empatan en nota.`
      : `${winner} gana por ${formatNumber(Math.abs(gap.percentageDiff), 1)} pp.`;

  return (
    <section
      aria-label="Detalle ejes"
      className={`${primitives.card} ${styles.panel}`}
    >
      <button
        type="button"
        className={`${primitives.unstyledButton} ${styles.header}`}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.title}>Detalle ejes</span>
        <span className={styles.headline}>{headline}</span>
      </button>

      {open && (
        <div className={styles.content}>
          {nonZeroLines.map((line) => (
            <AxisGapRow
              key={line.axisId}
              line={line}
              maxAbsValue={maxAbsValue}
              weights={weights}
              open={openAxisId === line.axisId}
              onToggle={() =>
                setOpenAxisId((current) =>
                  current === line.axisId ? null : line.axisId,
                )
              }
              focusedAxis={axisById(focusedScore, line.axisId)}
              pinnedAxis={axisById(pinnedScore, line.axisId)}
            />
          ))}

          {zeroLines.length > 0 && (
            <p className={styles.zeroLine}>
              Empatáis en {zeroLines.map((line) => line.label).join(', ')}.
            </p>
          )}

          <div className={styles.sensitivity}>
            {inRange.length > 0 ? (
              <>
                <ul className={styles.crossingList}>
                  {inRange.map((line) => (
                    <li key={line.axisId}>{crossingSentence(line)}</li>
                  ))}
                </ul>
                {stable.length > 0 && (
                  <details className={styles.stableDetails}>
                    <summary className={styles.stableSummary}>
                      Los demás ejes no cambian el resultado en su recorrido
                    </summary>
                    <p className={styles.stableText}>
                      {stable.map((line) => line.label).join(', ')}.
                    </p>
                  </details>
                )}
              </>
            ) : (
              <p className={styles.sensitivityText}>
                Ningún peso, movido solo, cambia este resultado.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
