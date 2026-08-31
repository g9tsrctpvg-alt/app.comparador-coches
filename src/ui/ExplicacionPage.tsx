import { useMemo } from 'react';
import type { Car } from '../domain/car';
import { AXIS_THEME_CLASS } from './axisTheme';
import { AxisIcon } from './components/AxisIcon';
import {
  AXIS_LABELS,
  AXIS_ORDER,
  DEFAULT_WEIGHTS,
} from '../domain/scoring/weights';
import { DEFAULT_ASSUMPTIONS } from '../domain/scoring/assumptions';
import { scoreCatalog } from '../domain/scoring/score';
import { formatSigned } from './format';
import {
  AXIS_CONTENT,
  CURVE_EXPLANATION,
  ELIMINATORY_EXPLANATION,
  KNOWN_LIMITATIONS,
  PROVENANCE_EXPLANATION,
  WEIGHT_TIE_WARNING,
} from './content/explicacionContent';
import { SCurveChart } from './components/SCurveChart';
import primitives from './primitives.module.css';
import shellStyles from './components/AppShell.module.css';
import styles from './ExplicacionPage.module.css';

interface ExplicacionPageProps {
  cars: Car[];
}

/** `scoreCatalog` con un catálogo no vacío garantiza estas presencias por
 * construcción; esto solo se lo dice a TypeScript sin recurrir a `!`. */
function mustGet<T>(value: T | undefined, description: string): T {
  if (value === undefined) {
    throw new Error(`Invariante rota: ${description}`);
  }
  return value;
}

const TOC = [
  { id: 'ejes', label: 'Los siete ejes' },
  { id: 'pesos', label: 'Los pesos' },
  { id: 'supuestos', label: 'Supuestos globales' },
  { id: 'penalizaciones', label: 'Penalizaciones condicionales' },
  { id: 'imprescindibles', label: 'Criterios eliminatorios' },
  { id: 'limitaciones', label: 'Limitaciones conocidas' },
  { id: 'procedencia', label: 'De dónde vienen los datos' },
];

/**
 * «Cómo se calcula todo» (product/0011): el modelo entero, sin coche
 * delante. Los valores —nombres, etiquetas, fórmulas, pesos, supuestos y
 * anclajes— se leen de `src/domain/scoring/` puntuando el catálogo real con
 * los valores por defecto, nunca a mano (requisito 3): es la misma vía
 * —`scoreCatalog`— que usa el desglose por coche, la única que
 * `ui-no-scoring-internals` permite. El razonamiento de cada anclaje vive en
 * `content/explicacionContent.ts` y se empareja por posición, no por
 * etiqueta.
 */
export function ExplicacionPage({ cars }: ExplicacionPageProps) {
  const breakdowns = useMemo(
    () =>
      scoreCatalog(
        cars,
        DEFAULT_WEIGHTS,
        DEFAULT_ASSUMPTIONS,
        Number.POSITIVE_INFINITY,
      ),
    [cars],
  );
  const reference = mustGet(
    breakdowns[0],
    'scoreCatalog con un catálogo no vacío debe devolver al menos un desglose',
  );
  const axisByAxisId = new Map(
    reference.axes.map((axis) => [axis.axisId, axis]),
  );

  const diarioAxis = mustGet(
    reference.axes.find((axis) => axis.axisId === 'diario'),
    'el eje diario debe existir en todo desglose',
  );
  const activeDiarioPenalty = breakdowns
    .flatMap(
      (breakdown) =>
        breakdown.axes.find((axis) => axis.axisId === 'diario')?.penalties ??
        [],
    )
    .find((penalty) => penalty.active);

  return (
    <>
      <h1 className={shellStyles.viewTitle}>Cómo se calcula todo</h1>
      <p className={styles.intro}>
        El desglose de cada coche responde «de dónde sale este número». Esta
        página responde «cómo funciona el modelo entero», sin ningún coche
        delante.
      </p>

      <nav aria-label="Índice de la página" className={styles.toc}>
        <ol>
          {TOC.map((entry) => (
            <li key={entry.id}>
              <a href={`#${entry.id}`}>{entry.label}</a>
            </li>
          ))}
        </ol>
      </nav>

      <section aria-labelledby="ejes" className={styles.section}>
        <h2 id="ejes" className={styles.sectionTitle}>
          Los siete ejes
        </h2>
        <p className={styles.sectionIntro}>{CURVE_EXPLANATION}</p>
        <SCurveChart />

        {AXIS_ORDER.map((axisId) => {
          const axis = mustGet(
            axisByAxisId.get(axisId),
            `el eje ${axisId} debe existir en el desglose de referencia`,
          );
          const content = AXIS_CONTENT[axisId];

          return (
            <article
              key={axisId}
              id={`eje-${axisId}`}
              className={`${styles.axisBlock} ${AXIS_THEME_CLASS[axisId]}`}
            >
              <h3 className={styles.axisTitle}>
                <AxisIcon axisId={axisId} />
                {AXIS_LABELS[axisId]}
              </h3>
              <p className={styles.measures}>{content.measures}</p>
              <p className={styles.secondary}>{content.data}</p>
              <p className={styles.formula}>{axis.formulaDescription}</p>
              <p className={styles.secondary}>
                Peso por defecto:{' '}
                <span className={primitives.mono}>
                  {DEFAULT_WEIGHTS[axisId]}
                </span>
              </p>

              {content.curveException && (
                <p className={styles.exception}>{content.curveException}</p>
              )}

              <dl className={styles.anchors}>
                {(axis.subcomponents ?? []).map((sub, index) => (
                  <div key={sub.label} className={styles.anchorRow}>
                    <dt className={styles.anchorLabel}>{sub.label}</dt>
                    <dd className={styles.anchorValues}>
                      {sub.scale?.goodAnchor}
                      {sub.unit ?? ''} → 10, {sub.scale?.badAnchor}
                      {sub.unit ?? ''} → 0
                    </dd>
                    <dd className={styles.reasoning}>
                      {content.anchorReasoning[index]}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })}
      </section>

      <section aria-labelledby="pesos" className={styles.section}>
        <h2 id="pesos" className={styles.sectionTitle}>
          Los pesos
        </h2>
        <p className={styles.sectionIntro}>
          Cada eje pesa de 0 a 10. Con las escalas absolutas de arriba, un peso
          multiplica la diferencia real entre los coches que estás mirando: no
          hace falta que sumen ningún total concreto.
        </p>
        <div className={styles.weightList}>
          {AXIS_ORDER.map((axisId) => (
            <div
              key={axisId}
              className={`${styles.weightRow} ${AXIS_THEME_CLASS[axisId]}`}
            >
              <span className={styles.weightName}>
                <AxisIcon axisId={axisId} />
                {AXIS_LABELS[axisId]}
              </span>
              <span className={styles.weightValue}>
                {DEFAULT_WEIGHTS[axisId]}
              </span>
            </div>
          ))}
        </div>
        <p className={styles.warning}>{WEIGHT_TIE_WARNING}</p>
      </section>

      <section aria-labelledby="supuestos" className={styles.section}>
        <h2 id="supuestos" className={styles.sectionTitle}>
          Supuestos globales
        </h2>
        <p className={styles.sectionIntro}>
          Se editan en un único sitio, el panel de supuestos de la comparativa;
          ningún desglose por eje ofrece edición propia, solo muestra el valor
          aplicado.
        </p>
        <div className={styles.assumptions}>
          <div className={styles.assumptionRow}>
            <span>Kilómetros al año</span>
            <span className={styles.assumptionValue}>
              {DEFAULT_ASSUMPTIONS.kmPorAnio.toLocaleString('es-ES')} km
            </span>
          </div>
          <div className={styles.assumptionRow}>
            <span>Precio del litro (combustión e híbridos)</span>
            <span className={styles.assumptionValue}>
              {DEFAULT_ASSUMPTIONS.precioLitro.toFixed(2)} €/l
            </span>
          </div>
          <div className={styles.assumptionRow}>
            <span>Precio del kWh (eléctricos)</span>
            <span className={styles.assumptionValue}>
              {DEFAULT_ASSUMPTIONS.precioKwh.toFixed(2)} €/kWh
            </span>
          </div>
          <div className={styles.assumptionRow}>
            <span>Mezcla exterior/interior en estética</span>
            <span className={styles.assumptionValue}>
              {DEFAULT_ASSUMPTIONS.mezclaEstetica.toFixed(1)} /{' '}
              {(1 - DEFAULT_ASSUMPTIONS.mezclaEstetica).toFixed(1)}
            </span>
          </div>
          <div className={styles.assumptionRow}>
            <span>Ponderación anchura/longitud en uso diario</span>
            <span className={styles.assumptionValue}>
              {DEFAULT_ASSUMPTIONS.ponderacionAnchoDiario.toFixed(1)} /{' '}
              {(1 - DEFAULT_ASSUMPTIONS.ponderacionAnchoDiario).toFixed(1)}
            </span>
          </div>
          <div className={styles.assumptionRow}>
            <span>Pienso venderlo</span>
            <span className={styles.assumptionValue}>
              {DEFAULT_ASSUMPTIONS.pensandoVender ? 'Sí' : 'No'} (hoy sin efecto
              en el eje de coste)
            </span>
          </div>
          <div className={styles.assumptionRow}>
            <span>Tengo carga en casa</span>
            <span className={styles.assumptionValue}>
              {DEFAULT_ASSUMPTIONS.cargaEnCasa ? 'Sí' : 'No'}
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="penalizaciones" className={styles.section}>
        <h2 id="penalizaciones" className={styles.sectionTitle}>
          Penalizaciones condicionales
        </h2>
        <div className={styles.assumptions}>
          {diarioAxis.penalties.map((penalty) => (
            <p key={penalty.label} className={styles.sectionIntro}>
              <strong>{penalty.label}.</strong> {penalty.condition}. Cuando se
              aplica, resta{' '}
              <span className={primitives.mono}>
                {formatSigned(activeDiarioPenalty?.effect ?? penalty.effect)}
              </span>{' '}
              puntos al eje de {AXIS_LABELS.diario}.
            </p>
          ))}
        </div>
      </section>

      <section aria-labelledby="imprescindibles" className={styles.section}>
        <h2 id="imprescindibles" className={styles.sectionTitle}>
          Criterios eliminatorios
        </h2>
        <p className={styles.sectionIntro}>{ELIMINATORY_EXPLANATION}</p>
      </section>

      <section aria-labelledby="limitaciones" className={styles.section}>
        <h2 id="limitaciones" className={styles.sectionTitle}>
          Limitaciones conocidas
        </h2>
        <div className={styles.limitations}>
          {KNOWN_LIMITATIONS.map((limitation) => (
            <div key={limitation.title}>
              <p className={styles.limitationTitle}>{limitation.title}</p>
              <p className={styles.limitationBody}>{limitation.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="procedencia" className={styles.section}>
        <h2 id="procedencia" className={styles.sectionTitle}>
          De dónde vienen los datos
        </h2>
        <p className={styles.sectionIntro}>{PROVENANCE_EXPLANATION}</p>
      </section>
    </>
  );
}
