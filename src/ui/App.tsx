import { useCallback, useMemo } from 'react';
import { loadCatalog } from '../data/loadCatalog';
import { loadReferences } from '../data/loadReferences';
import { publishedCars, type Car } from '../domain/car';
import type { Reference } from '../domain/reference';
import { scoreCatalog } from '../domain/scoring/score';
import { profileOf } from '../domain/calibration';
import { applyOverride } from '../domain/scoring/overrides';
import { logError } from '../logging/logger';
import { clearViewState } from '../adapters/localStorageConfigPort';
import { AssumptionsPanel } from './components/AssumptionsPanel';
import { WeightSliders } from './components/WeightSliders';
import { EliminatoryRulesPanel } from './components/EliminatoryRulesPanel';
import { RankingList } from './components/RankingList';
import { LeaderCard } from './components/LeaderCard';
import { ConfigActions } from './components/ConfigActions';
import { DecisionFilterControl } from './components/DecisionFilterControl';
import { AppShell } from './components/AppShell';
import { splitByEligibility } from './components/ranking';
import { ExplicacionPage } from './ExplicacionPage';
import { FichaPage } from './FichaPage';
import { VisitaPage } from './VisitaPage';
import { useHashRoute, useVisitaCarId } from './useHashRoute';
import { useConfig } from './useConfig';
import { useDecisions } from './useDecisions';
import { useTestDrives } from './useTestDrives';
import shellStyles from './components/AppShell.module.css';
import styles from './App.module.css';

interface AppProps {
  load?: () => Car[];
  loadReferences?: () => Reference[];
}

type CatalogResult =
  { cars: Car[]; references: Reference[] } | { error: string };

export function App({
  load = loadCatalog,
  loadReferences: loadReferencesProp = loadReferences,
}: AppProps) {
  const route = useHashRoute();
  const visitaCarId = useVisitaCarId();
  const catalogResult = useMemo<CatalogResult>(() => {
    try {
      // `load()` devuelve todos los coches del fichero, publicados o no
      // (product/0015): un catálogo con candidatos pero ninguno publicado
      // se trata igual que uno vacío, con el mismo mensaje de abajo, en vez
      // de dejar pasar una lista vacía a `scoreCatalog`, que lanzaría sin
      // capturar.
      const cars = publishedCars(load());
      if (cars.length === 0) {
        throw new Error('el catálogo no puede estar vacío');
      }
      return { cars, references: loadReferencesProp() };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logError('catalog_load_failed', { 'error.message': message });
      return { error: message };
    }
  }, [load, loadReferencesProp]);

  const validCarIds = useMemo(
    () =>
      'error' in catalogResult
        ? new Set<string>()
        : new Set(catalogResult.cars.map((car) => car.id)),
    [catalogResult],
  );
  const {
    config,
    setWeights,
    setAssumptions,
    setBudgetEur,
    setEliminatoryRules,
    setHideFailingRules,
    setOverride,
    resetToDefaults,
    shareUrl,
  } = useConfig(validCarIds);
  const {
    weights,
    assumptions,
    budgetEur,
    eliminatoryRules,
    hideFailingRules,
    overrides,
  } = config;

  // El estado de decisión de cada coche (product/0030): tercera clave
  // persistida, hermana de `AppConfig` y `ViewState`, instanciada aquí
  // porque tanto la clasificación como la ficha la leen y la editan sobre
  // el mismo registro.
  const {
    decisionLog,
    setDecision,
    clearDecision,
    setDecisionFilter,
    clearAllDecisions,
  } = useDecisions(validCarIds);

  // El registro de pruebas reales (product/0037): cuarta clave persistida,
  // hermana de `AppConfig`, `ViewState` y `DecisionLog`, instanciada aquí
  // porque tanto la hoja de visita como el desglose del eje `prueba` la
  // leen sobre el mismo registro.
  const {
    testDriveLog,
    setJudgement,
    clearJudgement,
    setNotes,
    setTestDriveDate,
    clearAllTestDrives,
  } = useTestDrives(validCarIds);

  // «Restablecer» deja la aplicación como una primera visita en las dos
  // claves de almacenamiento, no solo en `AppConfig` (product/0024,
  // requisito 13). `clearViewState` es una llamada directa al puerto, no al
  // hook `useViewState`: esta acción solo es alcanzable desde la vista de
  // clasificación, con `FichaPage` desmontada, así que no hay estado de
  // vista en memoria que resetear aquí — solo lo guardado.
  const handleReset = useCallback(() => {
    resetToDefaults();
    clearViewState();
  }, [resetToDefaults]);

  // Se calcula una vez y lo consumen tanto la puntuación como el cara a cara
  // de la calibración (product/0035): el diálogo enseña los mismos coches
  // que se han puntuado, con las valoraciones sobrescritas ya aplicadas.
  const carsWithOverrides = useMemo(
    () =>
      'error' in catalogResult
        ? []
        : catalogResult.cars.map((car) =>
            applyOverride(car, overrides[car.id]),
          ),
    [catalogResult, overrides],
  );

  const scored = useMemo(() => {
    // Las reglas de los hooks obligan a que este `useMemo` corra también en
    // la rama de error, así que la guarda va dentro: puntuar un catálogo
    // vacío lanzaría y se llevaría por delante el mensaje de error de abajo.
    if (carsWithOverrides.length === 0) return [];
    return scoreCatalog(
      carsWithOverrides,
      weights,
      assumptions,
      budgetEur,
      testDriveLog,
    );
  }, [carsWithOverrides, weights, assumptions, budgetEur, testDriveLog]);

  // «Que la prueba cuente» (product/0037, requisito 2.5): sube el peso de
  // `prueba` a 5 y solo eso. No se dispara solo al guardar una prueba —el
  // ADR 0012 lo exige—, así que es una acción explícita, propia.
  const handleEnableTestDriveWeight = useCallback(() => {
    setWeights({ ...weights, prueba: 5 });
  }, [setWeights, weights]);

  if ('error' in catalogResult) {
    return (
      <AppShell route={route}>
        <p role="alert" className={styles.error}>
          No se ha podido cargar el catálogo: {catalogResult.error}
        </p>
      </AppShell>
    );
  }

  if (route === 'explicacion') {
    return (
      <AppShell route={route}>
        <ExplicacionPage cars={catalogResult.cars} />
      </AppShell>
    );
  }

  if (route === 'ficha') {
    return (
      <AppShell route={route}>
        <FichaPage
          cars={catalogResult.cars}
          references={catalogResult.references}
          scoredCars={scored}
          weights={weights}
          eliminatoryRules={eliminatoryRules}
          decisionLog={decisionLog}
          onSetDecision={setDecision}
          onClearDecision={clearDecision}
        />
      </AppShell>
    );
  }

  if (route === 'visita') {
    return (
      <AppShell route={route}>
        <VisitaPage
          cars={catalogResult.cars}
          scoredCars={scored}
          weights={weights}
          decisionLog={decisionLog}
          onDecisionFilterChange={setDecisionFilter}
          testDriveLog={testDriveLog}
          onSetJudgement={setJudgement}
          onClearJudgement={clearJudgement}
          onSetNotes={setNotes}
          onSetTestDriveDate={setTestDriveDate}
          onEnableTestDriveWeight={handleEnableTestDriveWeight}
          carId={visitaCarId}
        />
      </AppShell>
    );
  }

  const eligible = splitByEligibility(
    scored,
    catalogResult.cars,
    eliminatoryRules,
    decisionLog,
  ).eligible;
  const leader = eligible[0];

  // Los candidatos de la tanda de calibración: solo el tramo elegible
  // (product/0035, requisito 11.1), para no preguntar por coches que ya
  // están fuera por presupuesto, por una regla o por estar descartados.
  const carsById = new Map(carsWithOverrides.map((car) => [car.id, car]));
  const calibrationCars = eligible
    .map((car) => carsById.get(car.carId))
    .filter((car): car is Car => car !== undefined);
  const calibrationProfiles = eligible.map(profileOf);

  return (
    <AppShell route={route}>
      <h1 className={shellStyles.viewTitle}>Clasificación</h1>

      {leader && <LeaderCard car={leader} />}

      <div className={styles.columns}>
        <div className={styles.controls}>
          <ConfigActions
            shareUrl={shareUrl}
            onReset={handleReset}
            decisionCount={Object.keys(decisionLog.entries).length}
            onClearDecisions={clearAllDecisions}
            testDriveCount={Object.keys(testDriveLog.entries).length}
            onClearTestDrives={clearAllTestDrives}
          />
          <DecisionFilterControl
            filter={decisionLog.filter}
            onChange={setDecisionFilter}
          />
          <WeightSliders
            weights={weights}
            onChange={setWeights}
            calibrationCars={calibrationCars}
            calibrationProfiles={calibrationProfiles}
          />
          <AssumptionsPanel
            assumptions={assumptions}
            onChange={setAssumptions}
            budgetEur={budgetEur}
            onBudgetChange={setBudgetEur}
          />
          <EliminatoryRulesPanel
            rules={eliminatoryRules}
            onRulesChange={setEliminatoryRules}
            budgetEur={budgetEur}
            onBudgetChange={setBudgetEur}
            hideFailingRules={hideFailingRules}
            onHideFailingRulesChange={setHideFailingRules}
          />
        </div>
        <RankingList
          cars={scored}
          rawCars={catalogResult.cars}
          eliminatoryRules={eliminatoryRules}
          hideFailingRules={hideFailingRules}
          onClearRules={() => setEliminatoryRules([])}
          weights={weights}
          decisionLog={decisionLog}
          onSetDecision={setDecision}
          onClearDecision={clearDecision}
          onDecisionFilterChange={setDecisionFilter}
          onRatingChange={setOverride}
        />
      </div>
    </AppShell>
  );
}
