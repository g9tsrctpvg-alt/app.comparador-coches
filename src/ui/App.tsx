import { useMemo, useState } from 'react';
import { loadCatalog } from '../data/loadCatalog';
import type { Car } from '../domain/car';
import {
  DEFAULT_ASSUMPTIONS,
  type GlobalAssumptions,
} from '../domain/scoring/assumptions';
import { DEFAULT_WEIGHTS, type AxisWeights } from '../domain/scoring/weights';
import { scoreCatalog } from '../domain/scoring/score';
import {
  applyOverride,
  type RatingOverride,
} from '../domain/scoring/overrides';
import { logError } from '../logging/logger';
import { AssumptionsPanel } from './components/AssumptionsPanel';
import { WeightSliders } from './components/WeightSliders';
import { RankingList } from './components/RankingList';
import { LeaderCard } from './components/LeaderCard';
import { rankVisible } from './components/ranking';
import styles from './App.module.css';

const DEFAULT_BUDGET_EUR = 47000;

interface AppProps {
  load?: () => Car[];
}

type CatalogResult = { cars: Car[] } | { error: string };

export function App({ load = loadCatalog }: AppProps) {
  const catalogResult = useMemo<CatalogResult>(() => {
    try {
      return { cars: load() };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logError('catalog_load_failed', { 'error.message': message });
      return { error: message };
    }
  }, [load]);

  const [weights, setWeights] = useState<AxisWeights>(DEFAULT_WEIGHTS);
  const [assumptions, setAssumptions] =
    useState<GlobalAssumptions>(DEFAULT_ASSUMPTIONS);
  const [budgetEur, setBudgetEur] = useState(DEFAULT_BUDGET_EUR);
  const [hideOverBudget, setHideOverBudget] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, RatingOverride>>(
    {},
  );

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
      <p role="alert" className={styles.error}>
        No se ha podido cargar el catálogo: {catalogResult.error}
      </p>
    );
  }

  const leader = rankVisible(scored, hideOverBudget)[0];

  return (
    <main className={styles.app}>
      <h1 className={styles.title}>Comparador de coches</h1>

      {leader && <LeaderCard car={leader} />}

      <div className={styles.columns}>
        <div className={styles.controls}>
          <WeightSliders weights={weights} onChange={setWeights} />
          <AssumptionsPanel
            assumptions={assumptions}
            onChange={setAssumptions}
            budgetEur={budgetEur}
            onBudgetChange={setBudgetEur}
            hideOverBudget={hideOverBudget}
            onHideOverBudgetChange={setHideOverBudget}
          />
        </div>
        <RankingList
          cars={scored}
          rawCars={catalogResult.cars}
          hideOverBudget={hideOverBudget}
          onRatingChange={(carId, override) =>
            setOverrides((prev) => ({
              ...prev,
              [carId]: { ...prev[carId], ...override },
            }))
          }
        />
      </div>
    </main>
  );
}
