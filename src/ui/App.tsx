import { useMemo, useState } from 'react';
import { loadCatalog } from '../data/loadCatalog';
import type { Car } from '../domain/car';
import {
  DEFAULT_ASSUMPTIONS,
  type GlobalAssumptions,
} from '../domain/scoring/assumptions';
import { DEFAULT_WEIGHTS, type AxisWeights } from '../domain/scoring/weights';
import { scoreCatalog } from '../domain/scoring/score';
import { logError } from '../logging/logger';
import { AssumptionsPanel } from './components/AssumptionsPanel';
import { WeightSliders } from './components/WeightSliders';
import { RankingList } from './components/RankingList';

const DEFAULT_BUDGET_EUR = 47000;

interface RatingOverride {
  aestheticsExterior?: number;
  aestheticsInterior?: number;
  travelComfort?: number;
}

function applyOverride(car: Car, override: RatingOverride | undefined): Car {
  if (!override) return car;
  return {
    ...car,
    aestheticsExterior:
      override.aestheticsExterior === undefined
        ? car.aestheticsExterior
        : { ...car.aestheticsExterior, value: override.aestheticsExterior },
    aestheticsInterior:
      override.aestheticsInterior === undefined
        ? car.aestheticsInterior
        : { ...car.aestheticsInterior, value: override.aestheticsInterior },
    travelComfort:
      override.travelComfort === undefined
        ? car.travelComfort
        : { ...car.travelComfort, value: override.travelComfort },
  };
}

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
    const cars = 'cars' in catalogResult ? catalogResult.cars : [];
    const carsWithOverrides = cars.map((car) =>
      applyOverride(car, overrides[car.id]),
    );
    return scoreCatalog(carsWithOverrides, weights, assumptions, budgetEur);
  }, [catalogResult, overrides, weights, assumptions, budgetEur]);

  if ('error' in catalogResult) {
    return (
      <p role="alert">
        No se ha podido cargar el catálogo: {catalogResult.error}
      </p>
    );
  }

  return (
    <main>
      <h1>Comparador de coches</h1>

      <AssumptionsPanel
        assumptions={assumptions}
        onChange={setAssumptions}
        budgetEur={budgetEur}
        onBudgetChange={setBudgetEur}
        hideOverBudget={hideOverBudget}
        onHideOverBudgetChange={setHideOverBudget}
      />
      <WeightSliders weights={weights} onChange={setWeights} />
      <RankingList
        cars={scored}
        hideOverBudget={hideOverBudget}
        onRatingChange={(carId, override) =>
          setOverrides((prev) => ({
            ...prev,
            [carId]: { ...prev[carId], ...override },
          }))
        }
      />
    </main>
  );
}
