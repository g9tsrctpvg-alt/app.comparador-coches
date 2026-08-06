import styles from './SCurveChart.module.css';

/**
 * Puntos de la curva en S —`nota = 10 × (1 − t²(3 − 2t))`, con `t` la
 * posición entre el anclaje bueno (0) y el malo (1)— precalculados como
 * datos estáticos. No es una fórmula que corra en la interfaz: dibujar la
 * forma de la curva no es puntuar un coche, pero para no dejar ni la
 * apariencia de recalcular algo, el dibujo es tabla, no cálculo
 * (product/0011, requisito 12).
 */
const CURVE_POINTS: ReadonlyArray<readonly [t: number, nota: number]> = [
  [0.0, 10.0],
  [0.05, 9.9275],
  [0.1, 9.72],
  [0.15, 9.3925],
  [0.2, 8.96],
  [0.25, 8.4375],
  [0.3, 7.84],
  [0.35, 7.1825],
  [0.4, 6.48],
  [0.45, 5.7475],
  [0.5, 5.0],
  [0.55, 4.2525],
  [0.6, 3.52],
  [0.65, 2.8175],
  [0.7, 2.16],
  [0.75, 1.5625],
  [0.8, 1.04],
  [0.85, 0.6075],
  [0.9, 0.28],
  [0.95, 0.0725],
  [1.0, 0.0],
];

const WIDTH = 200;
const HEIGHT = 100;

function pathFrom(points: ReadonlyArray<readonly [number, number]>): string {
  return points
    .map(([t, nota], index) => {
      const x = t * WIDTH;
      const y = HEIGHT - nota * (HEIGHT / 10);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export function SCurveChart() {
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Gráfica de la curva en S: la nota parte de 10 en el anclaje bueno, baja despacio al principio, rápido en el centro, y despacio otra vez hasta 0 en el anclaje malo."
      >
        <line
          className={styles.axisLine}
          x1={0}
          y1={HEIGHT}
          x2={WIDTH}
          y2={HEIGHT}
        />
        <line className={styles.axisLine} x1={0} y1={0} x2={0} y2={HEIGHT} />
        <path className={styles.curve} d={pathFrom(CURVE_POINTS)} />
      </svg>
      <figcaption className={styles.caption}>
        Eje horizontal: posición entre el anclaje bueno (izquierda) y el anclaje
        malo (derecha). Eje vertical: nota de 10 a 0.
      </figcaption>
    </figure>
  );
}
