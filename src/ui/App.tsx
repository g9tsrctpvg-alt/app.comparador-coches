import { useCallback, useMemo } from 'react';
import { loadCatalog } from '../data/loadCatalog';
import { loadReferences } from '../data/loadReferences';
import { publishedCars, type Car } from '../domain/car';
import type { Reference } from '../domain/reference';
import { scoreCatalog } from '../domain/scoring/score';
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
import { useHashRoute } from './useHashRoute';
import { useConfig } from './useConfig';
import { useDecisions } from './useDecisions';
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

  const scored = useMemo(() => {
    // Las reglas de los hooks obligan a que este `useMemo` corra también en
    // la rama de error, así que la guarda va dentro: puntuar un catálogo
    // vacío lanzaría y se llevaría por delante el mensaje de error de abajo.
    if ('error' in catalogResult) return [];
    const carsWithOverrides = catalogResult.cars.map((car) =>
      applyOverride(car, overrides[car.id]),
    );
    return scoreCatalog(carsWithOverrides, weights, assumptions, budgetEur);
  }, [catalogResult, overrides, weights, assumptions, budgetEur]);

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

  const leader = splitByEligibility(
    scored,
    catalogResult.cars,
    eliminatoryRules,
    decisionLog,
  ).eligible[0];

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
          />
          <DecisionFilterControl
            filter={decisionLog.filter}
            onChange={setDecisionFilter}
          />
          <WeightSliders weights={weights} onChange={setWeights} />
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
