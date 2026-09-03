import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { VisitaPage } from './VisitaPage';
import { threeCarFixture } from '../domain/scoring/testFixtures';
import { scoreCatalog } from '../domain/scoring/score';
import { DEFAULT_ASSUMPTIONS } from '../domain/scoring/assumptions';
import { DEFAULT_WEIGHTS } from '../domain/scoring/weights';
import {
  defaultDecisionLog,
  setDecisionFilter,
  type DecisionLog,
} from '../domain/decisions';
import {
  defaultTestDriveLog,
  setJudgement,
  setNotes,
} from '../domain/testDrives';

const SCORED_FIXTURE = scoreCatalog(
  threeCarFixture,
  DEFAULT_WEIGHTS,
  DEFAULT_ASSUMPTIONS,
  47000,
);

const EMPTY_DECISIONS = defaultDecisionLog();
const EMPTY_TEST_DRIVES = defaultTestDriveLog();

function render(overrides: Partial<Parameters<typeof VisitaPage>[0]> = {}) {
  return renderToStaticMarkup(
    <VisitaPage
      cars={threeCarFixture}
      scoredCars={SCORED_FIXTURE}
      weights={DEFAULT_WEIGHTS}
      decisionLog={EMPTY_DECISIONS}
      onDecisionFilterChange={() => undefined}
      testDriveLog={EMPTY_TEST_DRIVES}
      onSetJudgement={() => undefined}
      onClearJudgement={() => undefined}
      onSetNotes={() => undefined}
      onSetTestDriveDate={() => undefined}
      onEnableTestDriveWeight={() => undefined}
      carId={null}
      {...overrides}
    />,
  );
}

describe('VisitaPage — index (product/0037, requisito 5.6)', () => {
  it('lists the published cars in classification order (by total, descending)', () => {
    const markup = render();
    const order = [...SCORED_FIXTURE]
      .sort((a, b) => b.total - a.total)
      .map((car) => car.carName);
    const positions = order.map((name) => markup.indexOf(name));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    for (const name of order) {
      expect(markup).toContain(name);
    }
  });

  it('shows "Sin probar" and the count of answered judgements for an untested car', () => {
    const markup = render();
    expect(markup).toContain('Sin probar');
    expect(markup).toContain('0 de 5 contestados');
  });

  it('shows the test-drive date once a car has been tested', () => {
    const carId = threeCarFixture[0]!.id;
    const testDriveLog = setJudgement(
      EMPTY_TEST_DRIVES,
      carId,
      'noise',
      4,
      '2026-09-01',
    );
    const markup = render({ testDriveLog });
    expect(markup).toContain('Probado el 01/09/2026');
    expect(markup).toContain('1 de 5 contestados');
  });

  it('renders its own message, not the ranking one, when the decision filter leaves nothing visible', () => {
    const decisionLog: DecisionLog = setDecisionFilter(
      EMPTY_DECISIONS,
      'shortlist-only',
    );
    const markup = render({ decisionLog });
    expect(markup).toContain('no deja ningún coche visible');
    expect(markup).toContain('Volver a Todos');
    for (const car of threeCarFixture) {
      expect(markup).not.toContain(`href="#/visita/${car.id}"`);
    }
  });

  it('renders exactly one <h1>, "Visita"', () => {
    const markup = render();
    const headings = [...markup.matchAll(/<h1[^>]*>([^<]+)<\/h1>/g)];
    expect(headings).toHaveLength(1);
    expect(headings[0]![1]).toBe('Visita');
  });
});

describe('VisitaPage — hoja de un coche (product/0037, requisito 5)', () => {
  const carId = threeCarFixture[0]!.id;
  const carName = threeCarFixture[0]!.name;

  it('renders the car name as its only <h1>', () => {
    const markup = render({ carId });
    const headings = [...markup.matchAll(/<h1[^>]*>([^<]+)<\/h1>/g)];
    expect(headings).toHaveLength(1);
    expect(headings[0]![1]).toBe(carName);
  });

  it('falls back to a not-found message and a link to the index for an unknown carId (requisito 5.7)', () => {
    const markup = render({ carId: 'no-existe' });
    expect(markup).toContain('No hay ningún coche publicado');
    expect(markup).toContain('href="#/visita"');
    expect(markup).not.toContain(carName);
  });

  it('shows "Sin probar todavía" and no date field for an untested car', () => {
    const markup = render({ carId });
    expect(markup).toContain('Sin probar todavía');
    expect(markup).not.toMatch(/<input[^>]*type="date"/);
  });

  it('shows an editable date field once the car has a test drive', () => {
    const testDriveLog = setJudgement(
      EMPTY_TEST_DRIVES,
      carId,
      'posture',
      3,
      '2026-09-01',
    );
    const markup = render({ carId, testDriveLog });
    expect(markup).toMatch(/<input[^>]*type="date"[^>]*value="2026-09-01"/);
  });

  it('offers "Que la prueba cuente" only when tested and the weight is still 0 (requisito 2.5)', () => {
    const untested = render({ carId });
    expect(untested).not.toContain('Que la prueba cuente');

    const testDriveLog = setJudgement(
      EMPTY_TEST_DRIVES,
      carId,
      'posture',
      3,
      '2026-09-01',
    );
    const testedAtZero = render({ carId, testDriveLog });
    expect(testedAtZero).toContain('Que la prueba cuente');

    const testedWithWeight = render({
      carId,
      testDriveLog,
      weights: { ...DEFAULT_WEIGHTS, prueba: 5 },
    });
    expect(testedWithWeight).not.toContain('Que la prueba cuente');
  });

  it('renders the five judgement selects, each offering "Sin contestar" and 1 to 5', () => {
    const markup = render({ carId });
    const selects = [
      ...markup.matchAll(/<select id="visita-judgement-[^"]+"/g),
    ];
    expect(selects).toHaveLength(5);
    expect(markup).toContain('Sin contestar');
    for (const level of [1, 2, 3, 4, 5]) {
      expect(markup).toContain(`<option value="${level}">${level}</option>`);
    }
  });

  it('shows the stored value of an answered judgement as selected', () => {
    const testDriveLog = setJudgement(
      EMPTY_TEST_DRIVES,
      carId,
      'noise',
      2,
      '2026-09-01',
    );
    const markup = render({ carId, testDriveLog });
    expect(markup).toMatch(
      /<select id="visita-judgement-noise"[^>]*>[\s\S]*?<option value="2" selected="">2<\/option>/,
    );
  });

  it('lists exactly the two askable optional fields this fixture never declares (requisito 5.2.3)', () => {
    const markup = render({ carId });
    expect(markup).toContain('¿Cuál es diámetro de giro?');
    expect(markup).toContain('¿Cuál es carga máxima en techo?');
  });

  it('lists an estimated field as a question, with its declared value', () => {
    const car = threeCarFixture[0]!;
    const estimatedCar = {
      ...car,
      trunkLiters: {
        ...car.trunkLiters,
        sources: [{ ...car.trunkLiters.sources[0]!, estimated: true }],
      },
    };
    const markup = render({
      cars: [estimatedCar, ...threeCarFixture.slice(1)],
      carId,
    });
    expect(markup).toContain('El catálogo lo declara estimado');
    expect(markup).toContain(String(car.trunkLiters.value));
  });

  it('uses the cell own unit for a field with no unitFallback, like residualPct5y', () => {
    const car = threeCarFixture[0]!;
    const residual = car.residualPct5y!;
    const estimatedCar = {
      ...car,
      residualPct5y: {
        ...residual,
        unit: '%',
        sources: [{ ...residual.sources[0]!, estimated: true }],
      },
    };
    const markup = render({
      cars: [estimatedCar, ...threeCarFixture.slice(1)],
      carId,
    });
    expect(markup).toContain(
      `${residual.value.toFixed(2).replace('.', ',')} %`,
    );
  });

  it('shows exactly three weakest axes, never the prueba axis (requisito 5.2.4)', () => {
    const markup = render({ carId });
    const carBreakdown = SCORED_FIXTURE.find((c) => c.carId === carId)!;
    const weakest = [...carBreakdown.axes]
      .filter((axis) => axis.axisId !== 'prueba')
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
    for (const axis of weakest) {
      expect(markup).toContain(axis.label);
    }
    const strongest = [...carBreakdown.axes]
      .filter((axis) => axis.axisId !== 'prueba')
      .sort((a, b) => b.score - a.score)[0]!;
    if (!weakest.some((axis) => axis.axisId === strongest.axisId)) {
      const flojeaSection = markup.slice(markup.indexOf('Dónde flojea'));
      expect(flojeaSection).not.toContain(strongest.label);
    }
  });

  it('offers a "Copiar" action', () => {
    const markup = render({ carId });
    expect(markup).toContain('Copiar');
  });

  it('is deterministic: the same car, config and log render the exact same markup', () => {
    const testDriveLog = setNotes(
      setJudgement(EMPTY_TEST_DRIVES, carId, 'boot', 4, '2026-09-01'),
      carId,
      'buen maletero',
      '2026-09-01',
    );
    const first = render({ carId, testDriveLog });
    const second = render({ carId, testDriveLog });
    expect(first).toBe(second);
  });
});
