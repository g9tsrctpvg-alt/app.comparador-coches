import { useState } from 'react';
import type { Car } from '../domain/car';
import {
  decisionOf,
  passesDecisionFilter,
  type DecisionFilter,
  type DecisionLog,
} from '../domain/decisions';
import { buildFicha, type FichaField } from '../domain/ficha';
import { photoSrc } from '../domain/photo';
import type {
  AxisBreakdown,
  CarScoreBreakdown,
} from '../domain/scoring/breakdown';
import type { AxisWeights } from '../domain/scoring/weights';
import {
  TEST_DRIVE_JUDGEMENTS,
  TEST_DRIVE_JUDGEMENT_LABELS,
  TEST_DRIVE_JUDGEMENT_PROMPTS,
  answeredCount,
  entryOf,
  isTested,
  type TestDriveJudgement,
  type TestDriveLog,
} from '../domain/testDrives';
import { visitaHashFor } from './useHashRoute';
import { COMPLETE_FIELD_DEFS, type FieldDef } from './FichaPage';
import { DecisionFilterControl } from './components/DecisionFilterControl';
import { DECISION_FILTER_LABELS } from './decisionLabels';
import { TECHNOLOGY_LABELS } from './technologyLabels';
import { formatDate, formatEur, formatNumber } from './format';
import primitives from './primitives.module.css';
import shellStyles from './components/AppShell.module.css';
import styles from './VisitaPage.module.css';

/** Las dos magnitudes opcionales que hoy tiene sentido preguntar en el
 * concesionario cuando el catálogo no las declara (requisito 5.2.3 de
 * product/0037): las únicas que pueden faltarle a **cualquier** coche,
 * cualquiera que sea su tecnología. `electricRangeKm`/`batteryKwh` también
 * son `'missing'` en un térmico, pero ahí no faltan por no haberse medido
 * todavía: no aplican, y preguntar por ellas en el concesionario no tendría
 * sentido. */
const ASKABLE_OPTIONAL_FIELDS: FichaField[] = [
  'turningCircleM',
  'maxRoofLoadKg',
];

function fieldDefOf(field: FichaField): FieldDef {
  const def = COMPLETE_FIELD_DEFS.get(field);
  if (def === undefined) {
    throw new Error(`FieldDef no declarado en COMPLETE_BLOCKS: ${field}`);
  }
  return def;
}

/** `cellUnit` es la unidad real de la celda —la de `SourcedValue`, no la
 * unidad por defecto del campo—, con el mismo criterio que `CellValue` en
 * `FichaPage.tsx`: importa en campos como `residualPct5y`, que no declaran
 * `unitFallback` porque su unidad («%») ya viaja en el propio dato. */
function formatFieldValue(
  value: number,
  def: FieldDef,
  cellUnit?: string,
): string {
  if (def.isEuro) return formatEur(value);
  const unit = cellUnit ?? def.unitFallback ?? '';
  const formatted = formatNumber(value, def.decimals ?? 0);
  return unit ? `${formatted} ${unit}` : formatted;
}

interface Question {
  field: FichaField;
  label: string;
  text: string;
}

/** El bloque «lo que hay que preguntar» (requisito 5.2.3): una línea por
 * magnitud con fuente vigente estimada, más una por cada magnitud opcional
 * preguntable que este coche no declara. Determinista: mismo coche, mismo
 * resultado siempre — no depende de nada externo. */
function questionsFor(car: Car): Question[] {
  const [entity] = buildFicha([car], []);
  if (entity === undefined) return [];

  const questions: Question[] = [];
  for (const [key, cell] of Object.entries(entity.cells) as [
    FichaField,
    (typeof entity.cells)[FichaField],
  ][]) {
    if (cell.kind === 'sourced' && cell.estimated) {
      const def = fieldDefOf(key);
      questions.push({
        field: key,
        label: def.label,
        text: `¿Es correcto ${def.label.toLowerCase()}? El catálogo lo declara estimado: ${formatFieldValue(cell.value, def, cell.unit)}.`,
      });
    }
  }
  for (const field of ASKABLE_OPTIONAL_FIELDS) {
    if (entity.cells[field].kind === 'missing') {
      const def = fieldDefOf(field);
      questions.push({
        field,
        label: def.label,
        text: `¿Cuál es ${def.label.toLowerCase()}? El catálogo no lo declara.`,
      });
    }
  }
  return questions;
}

interface WeakAxis {
  axisId: AxisBreakdown['axisId'];
  label: string;
  score: number;
  worstSubcomponentLabel: string | null;
}

/** Los tres ejes en los que peor queda el coche, `prueba` excluido —no
 * tendría sentido decir «flojea en la prueba real» antes de haberla hecho
 * (requisito 5.2.4)—, cada uno con el sumando más flojo de su desglose. */
function weakestAxes(car: CarScoreBreakdown, count = 3): WeakAxis[] {
  return [...car.axes]
    .filter((axis) => axis.axisId !== 'prueba')
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map((axis) => {
      const worst = (axis.subcomponents ?? [])
        .slice()
        .sort((a, b) => (a.scale?.score ?? 10) - (b.scale?.score ?? 10))[0];
      return {
        axisId: axis.axisId,
        label: axis.label,
        score: axis.score,
        worstSubcomponentLabel: worst?.label ?? null,
      };
    });
}

interface JudgementRowProps {
  judgement: TestDriveJudgement;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

function JudgementRow({ judgement, value, onChange }: JudgementRowProps) {
  const inputId = `visita-judgement-${judgement}`;
  return (
    <div className={styles.judgementRow}>
      <label className={primitives.fieldLabel} htmlFor={inputId}>
        {TEST_DRIVE_JUDGEMENT_LABELS[judgement]}
      </label>
      <p className={styles.judgementPrompt}>
        {TEST_DRIVE_JUDGEMENT_PROMPTS[judgement]}
      </p>
      <select
        id={inputId}
        className={primitives.fieldSelect}
        value={value ?? ''}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === '' ? undefined : Number(raw));
        }}
      >
        <option value="">Sin contestar</option>
        {[1, 2, 3, 4, 5].map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
    </div>
  );
}

interface VisitaSheetProps {
  car: Car;
  breakdown: CarScoreBreakdown;
  testDriveLog: TestDriveLog;
  onSetJudgement: (
    carId: string,
    judgement: TestDriveJudgement,
    value: number,
  ) => void;
  onClearJudgement: (carId: string, judgement: TestDriveJudgement) => void;
  onSetNotes: (carId: string, notes: string) => void;
  onSetTestDriveDate: (carId: string, date: string) => void;
  weight: number;
  onEnableTestDriveWeight: () => void;
}

function VisitaSheet({
  car,
  breakdown,
  testDriveLog,
  onSetJudgement,
  onClearJudgement,
  onSetNotes,
  onSetTestDriveDate,
  weight,
  onEnableTestDriveWeight,
}: VisitaSheetProps) {
  const entry = entryOf(testDriveLog, car.id);
  const tested = isTested(testDriveLog, car.id);
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [copied, setCopied] = useState(false);

  const questions = questionsFor(car);
  const weak = weakestAxes(breakdown);
  const frontPhoto = car.photos.front;

  const sheetText = buildVisitSheetText({
    car,
    entry,
    questions,
    weak,
  });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(sheetText);
      setCopied(true);
    } catch {
      // Sin Clipboard API no hay nada que hacer, igual que en
      // `ConfigActions`: no es un error que el usuario deba ver.
    }
  }

  function commitNotes() {
    onSetNotes(car.id, notes);
  }

  return (
    <article className={styles.sheet}>
      <header className={styles.identity}>
        {frontPhoto && (
          <img
            className={styles.identityPhoto}
            src={photoSrc(frontPhoto)}
            alt={`${car.name}, vista frontal`}
            loading="lazy"
          />
        )}
        <div>
          <h2 className={styles.identityName}>{car.name}</h2>
          <p className={styles.identityMeta}>
            {car.brand} · {TECHNOLOGY_LABELS[car.technology]}
          </p>
          {tested ? (
            <label className={styles.dateField}>
              <span className={primitives.fieldLabel}>Fecha de la prueba</span>
              <input
                type="date"
                className={primitives.fieldSelect}
                value={entry?.date}
                onChange={(event) =>
                  onSetTestDriveDate(car.id, event.target.value)
                }
              />
            </label>
          ) : (
            <p className={styles.untested}>Sin probar todavía</p>
          )}
        </div>
      </header>

      {weight === 0 && tested && (
        <p className={styles.enableWeight}>
          {answeredCount(entry)} de 5 juicios contestados.{' '}
          <button
            type="button"
            className={primitives.buttonGhost}
            onClick={onEnableTestDriveWeight}
          >
            Que la prueba cuente
          </button>
        </p>
      )}

      <section aria-labelledby="visita-juicios" className={styles.section}>
        <h3 id="visita-juicios" className={styles.sectionTitle}>
          Lo que solo se sabe dentro
        </h3>
        {TEST_DRIVE_JUDGEMENTS.map((judgement) => (
          <JudgementRow
            key={judgement}
            judgement={judgement}
            value={entry?.ratings[judgement]}
            onChange={(value) => {
              if (value === undefined) onClearJudgement(car.id, judgement);
              else onSetJudgement(car.id, judgement, value);
            }}
          />
        ))}
      </section>

      {questions.length > 0 && (
        <section aria-labelledby="visita-preguntar" className={styles.section}>
          <h3 id="visita-preguntar" className={styles.sectionTitle}>
            Lo que hay que preguntar
          </h3>
          <ul className={styles.questions}>
            {questions.map((question) => (
              <li key={question.field}>{question.text}</li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="visita-flojea" className={styles.section}>
        <h3 id="visita-flojea" className={styles.sectionTitle}>
          Dónde flojea este coche
        </h3>
        <ul className={styles.weakAxes}>
          {weak.map((axis) => (
            <li key={axis.axisId}>
              {axis.label}: {formatNumber(axis.score, 1)}/10
              {axis.worstSubcomponentLabel !== null &&
                ` — sobre todo en ${axis.worstSubcomponentLabel.toLowerCase()}`}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="visita-notas" className={styles.section}>
        <h3 id="visita-notas" className={styles.sectionTitle}>
          Notas
        </h3>
        <label className={styles.notesField}>
          <span className={primitives.visuallyHidden}>
            Notas de la prueba de {car.name}
          </span>
          <textarea
            className={styles.notesInput}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={commitNotes}
          />
        </label>
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className={primitives.buttonGhost}
          onClick={handleCopy}
        >
          {copied ? 'Hoja copiada' : 'Copiar'}
        </button>
        {copied && (
          <span role="status" className={primitives.visuallyHidden}>
            Hoja copiada al portapapeles
          </span>
        )}
      </div>
    </article>
  );
}

/** El texto plano de la hoja (requisito 5.4): la misma función que
 * construye lo que se copia, para que copiar y ver en pantalla sean
 * siempre la misma información. */
function buildVisitSheetText({
  car,
  entry,
  questions,
  weak,
}: {
  car: Car;
  entry: ReturnType<typeof entryOf>;
  questions: Question[];
  weak: WeakAxis[];
}): string {
  const lines: string[] = [`${car.name} — hoja de visita`];
  if (entry !== undefined) {
    lines.push(`Prueba del ${formatDate(entry.date)}`);
  } else {
    lines.push('Sin probar todavía');
  }
  lines.push('');
  lines.push('Lo que solo se sabe dentro:');
  for (const judgement of TEST_DRIVE_JUDGEMENTS) {
    const value = entry?.ratings[judgement];
    lines.push(
      `- ${TEST_DRIVE_JUDGEMENT_LABELS[judgement]}: ${value ?? 'sin contestar'}`,
    );
  }
  if (questions.length > 0) {
    lines.push('');
    lines.push('Lo que hay que preguntar:');
    for (const question of questions) {
      lines.push(`- ${question.text}`);
    }
  }
  lines.push('');
  lines.push('Dónde flojea:');
  for (const axis of weak) {
    lines.push(
      `- ${axis.label}: ${axis.score.toFixed(1)}/10${
        axis.worstSubcomponentLabel !== null
          ? ` (${axis.worstSubcomponentLabel})`
          : ''
      }`,
    );
  }
  if (entry?.notes !== undefined) {
    lines.push('');
    lines.push('Notas:');
    lines.push(entry.notes);
  }
  return lines.join('\n');
}

interface VisitaIndexProps {
  cars: Car[];
  scoredCars: CarScoreBreakdown[];
  decisionLog: DecisionLog;
  onDecisionFilterChange: (filter: DecisionFilter) => void;
  testDriveLog: TestDriveLog;
}

function VisitaIndex({
  cars,
  scoredCars,
  decisionLog,
  onDecisionFilterChange,
  testDriveLog,
}: VisitaIndexProps) {
  const carNameById = new Map(cars.map((car) => [car.id, car.name]));
  const visible = scoredCars
    .filter((car) =>
      passesDecisionFilter(
        decisionOf(decisionLog, car.carId),
        decisionLog.filter,
      ),
    )
    .slice()
    .sort((a, b) => b.total - a.total);

  return (
    <>
      <DecisionFilterControl
        filter={decisionLog.filter}
        onChange={onDecisionFilterChange}
      />
      {visible.length === 0 && decisionLog.filter !== 'all' ? (
        <p role="status" className={styles.emptyFiltered}>
          El filtro «{DECISION_FILTER_LABELS[decisionLog.filter]}» no deja
          ningún coche visible.{' '}
          <button
            type="button"
            className={primitives.buttonGhost}
            onClick={() => onDecisionFilterChange('all')}
          >
            Volver a Todos
          </button>
        </p>
      ) : (
        <ul className={styles.index}>
          {visible.map((car) => {
            const entry = entryOf(testDriveLog, car.carId);
            return (
              <li key={car.carId} className={styles.indexRow}>
                <a href={visitaHashFor(car.carId)}>
                  {carNameById.get(car.carId) ?? car.carName}
                </a>
                <span className={styles.indexStatus}>
                  {entry !== undefined
                    ? `Probado el ${formatDate(entry.date)}`
                    : 'Sin probar'}
                  {' · '}
                  {answeredCount(entry)} de 5 contestados
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export interface VisitaPageProps {
  cars: Car[];
  scoredCars: CarScoreBreakdown[];
  weights: AxisWeights;
  decisionLog: DecisionLog;
  onDecisionFilterChange: (filter: DecisionFilter) => void;
  testDriveLog: TestDriveLog;
  onSetJudgement: (
    carId: string,
    judgement: TestDriveJudgement,
    value: number,
  ) => void;
  onClearJudgement: (carId: string, judgement: TestDriveJudgement) => void;
  onSetNotes: (carId: string, notes: string) => void;
  onSetTestDriveDate: (carId: string, date: string) => void;
  onEnableTestDriveWeight: () => void;
  /** `null` en el índice; el `carId` de la ruta en una hoja de coche
   * (`useVisitaCarId`, `useHashRoute.ts`). */
  carId: string | null;
}

/**
 * La hoja de visita (product/0037, requisito 5): qué mirar y qué preguntar
 * delante de un coche, y el registro de lo que solo se sabe sentado
 * dentro. `#/visita` es el índice; `#/visita/<carId>` es la hoja de un
 * coche — la misma ruta (`Route`, `useHashRoute.ts`) para las dos, así que
 * `App.tsx` decide aquí, con `carId`, cuál mostrar.
 */
export function VisitaPage({
  cars,
  scoredCars,
  weights,
  decisionLog,
  onDecisionFilterChange,
  testDriveLog,
  onSetJudgement,
  onClearJudgement,
  onSetNotes,
  onSetTestDriveDate,
  onEnableTestDriveWeight,
  carId,
}: VisitaPageProps) {
  if (carId === null) {
    return (
      <>
        <h1 className={shellStyles.viewTitle}>Visita</h1>
        <VisitaIndex
          cars={cars}
          scoredCars={scoredCars}
          decisionLog={decisionLog}
          onDecisionFilterChange={onDecisionFilterChange}
          testDriveLog={testDriveLog}
        />
      </>
    );
  }

  const car = cars.find((c) => c.id === carId);
  const breakdown = scoredCars.find((c) => c.carId === carId);

  if (car === undefined || breakdown === undefined) {
    return (
      <>
        <h1 className={shellStyles.viewTitle}>Visita</h1>
        <p role="alert" className={styles.notFound}>
          No hay ningún coche publicado con ese identificador.{' '}
          <a href="#/visita">Volver al índice</a>.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className={shellStyles.viewTitle}>{car.name}</h1>
      <VisitaSheet
        car={car}
        breakdown={breakdown}
        testDriveLog={testDriveLog}
        onSetJudgement={onSetJudgement}
        onClearJudgement={onClearJudgement}
        onSetNotes={onSetNotes}
        onSetTestDriveDate={onSetTestDriveDate}
        weight={weights.prueba}
        onEnableTestDriveWeight={onEnableTestDriveWeight}
      />
    </>
  );
}
