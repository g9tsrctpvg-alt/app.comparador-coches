import type { CarScoreBreakdown } from '../../domain/scoring/breakdown';
import { percentageOf } from '../../domain/scoring/score';
import { splitScoreGap, topAdvantageLine } from '../../domain/scoring/scoreGap';
import type { AxisWeights } from '../../domain/scoring/weights';
import { AXIS_THEME_CLASS } from '../axisTheme';
import { formatSigned } from '../format';
import primitives from '../primitives.module.css';
import { AxisIcon } from './AxisIcon';
import styles from './AdvantageMark.module.css';

interface AdvantageMarkProps {
  car: CarScoreBreakdown;
  /** El clasificado inmediatamente posterior (product/0042, requisito 2):
   * el rival de un puesto es quien lo disputa, no el líder. */
  rival: CarScoreBreakdown;
  weights: AxisWeights;
}

/** El eje en el que este coche saca más ventaja al siguiente clasificado,
 * dicho con su icono (product/0042). No calcula nada por su cuenta
 * (`ui-no-scoring-internals`): `topAdvantageLine` ya elige la línea, y esta
 * pieza solo la dibuja.
 *
 * El icono es el mismo dibujo y el mismo color que ese eje tiene en su
 * desglose y en la ficha (technical/0011), así que el mapa eje → icono se
 * aprende en un sitio y sirve en todos. Como aquí el icono va **solo**, sin
 * el nombre del eje en texto al lado, el significado lo lleva el texto
 * accesible —nunca el color, igual que `DecisionMark` nunca se fía de él—, y
 * `AxisIcon` sigue siendo `aria-hidden` sin excepción.
 *
 * `null` cuando no hay ninguna ventaja que contar: dos coches empatados eje
 * a eje. Sin hueco ni relleno (requisito 3.2). */
export function AdvantageMark({ car, rival, weights }: AdvantageMarkProps) {
  const line = topAdvantageLine(splitScoreGap(car, rival));
  if (line === undefined) return null;

  const description = `Donde más ventaja saca frente a ${rival.carName}: ${line.label}, ${formatSigned(percentageOf(line.value, weights), 1)} pp`;

  return (
    <span
      className={`${styles.mark} ${AXIS_THEME_CLASS[line.axisId]}`}
      title={description}
    >
      <AxisIcon axisId={line.axisId} />
      <span className={primitives.visuallyHidden}>{description}</span>
    </span>
  );
}
