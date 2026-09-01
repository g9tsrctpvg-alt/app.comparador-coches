import { useEffect, useMemo, useRef, useState } from 'react';
import type { Car } from '../../domain/car';
import {
  buildFicha,
  withComparison,
  type FichaEntity,
} from '../../domain/ficha';
import { photoSrc } from '../../domain/photo';
import {
  calibrate,
  MAX_MATCHUPS,
  type CarProfile,
  type MatchupOutcome,
} from '../../domain/calibration';
import {
  AXIS_LABELS,
  AXIS_ORDER,
  type AxisWeights,
} from '../../domain/scoring/weights';
import { AXIS_THEME_CLASS } from '../axisTheme';
import { AxisIcon } from './AxisIcon';
import { COMPLETE_BLOCKS, CellContent } from '../FichaPage';
import primitives from '../primitives.module.css';
import styles from './CalibrationDialog.module.css';

interface CalibrationDialogProps {
  /** Los coches elegibles en el momento de abrir la tanda, ya congelados
   * por quien monta el diálogo (requisito 11.2). */
  cars: Car[];
  profiles: CarProfile[];
  currentWeights: AxisWeights;
  onApply: (weights: AxisWeights) => void;
  onClose: () => void;
}

function CarColumn({
  entity,
  onPrefer,
  label,
}: {
  entity: FichaEntity;
  onPrefer: () => void;
  label: string;
}) {
  const photo = entity.photos.front;
  return (
    <div className={styles.column}>
      <figure className={styles.figure}>
        {photo === undefined ? (
          <p className={styles.photoPlaceholder}>Sin foto</p>
        ) : (
          <img
            className={styles.photo}
            src={photoSrc(photo)}
            alt={`${entity.name}, vista frontal`}
            loading="lazy"
          />
        )}
      </figure>
      <h3 className={styles.carName}>{entity.name}</h3>
      <button type="button" className={styles.preferButton} onClick={onPrefer}>
        {label}
      </button>
      <dl className={styles.fields}>
        {COMPLETE_BLOCKS.map((block) => (
          <div key={block.id} className={styles.block}>
            <p className={styles.blockLabel}>{block.label}</p>
            {block.fields.map((def) => (
              <div key={def.key} className={styles.field}>
                <dt className={styles.fieldLabel}>{def.label}</dt>
                <dd className={`${primitives.numeric} ${styles.fieldValue}`}>
                  <CellContent
                    cell={entity.cells[def.key]}
                    def={def}
                    code={
                      def.key === 'generationLaunchYear'
                        ? entity.generationCode
                        : undefined
                    }
                  />
                </dd>
              </div>
            ))}
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * El cara a cara: los dos coches, con su foto y las mismas magnitudes que la
 * ficha, con su Δ el uno contra el otro (requisito 7.1).
 *
 * Exportado solo para el test, igual que `PhotoCarousel` en `FichaPage`: el
 * diálogo se abre con `showModal()`, que `renderToStaticMarkup` no ejecuta.
 */
export function MatchupView({
  a,
  b,
  onPrefer,
}: {
  a: FichaEntity;
  b: FichaEntity;
  onPrefer: (side: 'a' | 'b') => void;
}) {
  return (
    <>
      <p className={styles.hint}>
        Elige el coche que preferirías tener. No se enseña ninguna nota a
        propósito: la pregunta es cuál prefieres tú, no cuál prefiere la
        aplicación.
      </p>
      <div className={styles.pair}>
        <CarColumn
          entity={a}
          label={`Prefiero el ${a.name}`}
          onPrefer={() => onPrefer('a')}
        />
        <CarColumn
          entity={b}
          label={`Prefiero el ${b.name}`}
          onPrefer={() => onPrefer('b')}
        />
      </div>
    </>
  );
}

/**
 * El resultado de la tanda (requisito 10): los siete pesos propuestos, qué
 * han fijado las respuestas y qué no, y las dos salidas. Exportado solo para
 * el test, por el mismo motivo que `MatchupView`.
 */
export function CalibrationResult({
  proposedWeights,
  currentWeights,
  compatibleCount,
  contradicted,
  answered,
  onApply,
  onDiscard,
}: {
  proposedWeights: AxisWeights;
  currentWeights: AxisWeights;
  compatibleCount: number;
  contradicted: number;
  answered: number;
  onApply: () => void;
  onDiscard: () => void;
}) {
  const changed = AXIS_ORDER.filter(
    (axisId) => proposedWeights[axisId] !== currentWeights[axisId],
  );

  return (
    <section className={styles.result} aria-label="Pesos propuestos">
      {answered === 0 ? (
        <p className={styles.resultNote}>
          No has contestado ningún cara a cara, así que no hay nada que
          proponer: los pesos se quedan como están.
        </p>
      ) : (
        <>
          <ul className={styles.weights}>
            {AXIS_ORDER.map((axisId) => (
              <li
                key={axisId}
                className={`${styles.weightRow} ${AXIS_THEME_CLASS[axisId]}`}
              >
                <span className={styles.weightName}>
                  <AxisIcon axisId={axisId} />
                  {AXIS_LABELS[axisId]}
                </span>
                <span className={`${primitives.numeric} ${styles.weightValue}`}>
                  {proposedWeights[axisId]}
                  {proposedWeights[axisId] !== currentWeights[axisId] && (
                    <span className={styles.weightBefore}>
                      {' '}
                      antes {currentWeights[axisId]}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.resultNote}>
            {compatibleCount > 1
              ? `Estos pesos son una de las ${compatibleCount} combinaciones que explican lo que has contestado, no la medida de lo que valoras: lo que tus respuestas fijan es la clasificación, no los siete números.`
              : 'Es la única combinación de la rejilla que explica lo que has contestado. Aun así describe tu clasificación, no tus pesos: la rejilla es gruesa a propósito.'}
            {changed.length === 0 &&
              ' No cambia ningún peso respecto a los que ya tenías.'}
          </p>
          {contradicted > 0 && (
            <p className={styles.resultNote}>
              {contradicted === 1
                ? 'Una de tus respuestas no encaja con las demás, así que la mejor combinación la contradice.'
                : `${contradicted} de tus respuestas no encajan con las demás, así que la mejor combinación las contradice.`}
            </p>
          )}
        </>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          disabled={answered === 0}
          onClick={onApply}
        >
          Aplicar a los deslizadores
        </button>
        <button type="button" className={styles.secondary} onClick={onDiscard}>
          Descartar
        </button>
      </div>
    </section>
  );
}

/**
 * La tanda de cara a cara que calibra los siete pesos (product/0035).
 *
 * Todo el cálculo es de `calibrate`: aquí solo se guarda la lista de
 * respuestas, se pinta el par que toca y se ofrecen las tres salidas
 * (requisito 12.3). El diálogo no aplica nada por su cuenta —los pesos
 * propuestos solo llegan a los deslizadores si se pulsa «Aplicar»
 * (requisito 10.4)—, y las respuestas viven en memoria: cerrar sin aplicar
 * las pierde, a propósito.
 */
export function CalibrationDialog({
  cars,
  profiles,
  currentWeights,
  onApply,
  onClose,
}: CalibrationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [outcomes, setOutcomes] = useState<MatchupOutcome[]>([]);
  const [finishedEarly, setFinishedEarly] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const state = useMemo(
    () => calibrate(profiles, outcomes, currentWeights),
    [profiles, outcomes, currentWeights],
  );

  const entities = useMemo(() => buildFicha(cars, []), [cars]);

  const matchup = finishedEarly ? null : state.nextMatchup;

  // Cada columna lleva su Δ contra la otra, que es la misma resta que hace
  // la ficha (requisito 7.1). La entidad de comparación nunca lleva Δ
  // contra sí misma, así que hacen falta las dos orientaciones.
  const pair = useMemo(() => {
    if (matchup === null) return null;
    const a = withComparison(entities, matchup.bCarId).find(
      (entity) => entity.id === matchup.aCarId,
    );
    const b = withComparison(entities, matchup.aCarId).find(
      (entity) => entity.id === matchup.bCarId,
    );
    return a === undefined || b === undefined ? null : { a, b };
  }, [entities, matchup]);

  function answer(preferred: 'a' | 'b' | 'none') {
    if (matchup === null) return;
    setOutcomes((previous) => [...previous, { ...matchup, preferred }]);
  }

  const answered = outcomes.filter(
    (outcome) => outcome.preferred !== 'none',
  ).length;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Calibrar los pesos con cara a cara"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <div className={styles.body}>
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>
              {matchup === null ? 'Resultado de la tanda' : '¿Cuál prefieres?'}
            </h2>
            <p className={styles.progress}>
              {state.possibleLeaderIds.length === 1
                ? 'Solo un coche puede ya ser el primero'
                : `${state.possibleLeaderIds.length} de ${profiles.length} coches pueden todavía ser el primero`}
              {' · '}
              {state.settledPairs} de {state.totalPairs} enfrentamientos
              decididos
              {' · '}
              {answered} {answered === 1 ? 'respuesta' : 'respuestas'} de un
              máximo de {MAX_MATCHUPS}
            </p>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={() => dialogRef.current?.close()}
          >
            <span className={primitives.visuallyHidden}>
              Cerrar sin aplicar
            </span>
            <span aria-hidden="true">×</span>
          </button>
        </header>

        {matchup !== null && pair !== null && (
          <MatchupView a={pair.a} b={pair.b} onPrefer={answer} />
        )}

        <div className={styles.actions}>
          {matchup !== null && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => answer('none')}
            >
              Me da igual
            </button>
          )}
          {outcomes.length > 0 && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                setFinishedEarly(false);
                setOutcomes((previous) => previous.slice(0, -1));
              }}
            >
              Deshacer la última
            </button>
          )}
          {matchup !== null && outcomes.length > 0 && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setFinishedEarly(true)}
            >
              Terminar ahora
            </button>
          )}
        </div>

        {matchup === null && (
          <CalibrationResult
            proposedWeights={state.proposedWeights}
            currentWeights={currentWeights}
            compatibleCount={state.compatibleCount}
            contradicted={state.contradicted}
            answered={answered}
            onApply={() => {
              onApply(state.proposedWeights);
              dialogRef.current?.close();
            }}
            onDiscard={() => dialogRef.current?.close()}
          />
        )}
      </div>
    </dialog>
  );
}
