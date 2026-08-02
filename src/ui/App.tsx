import { useMemo } from 'react';
import { loadCatalog } from '../data/loadCatalog';
import type { Car } from '../domain/car';
import { logError } from '../logging/logger';

interface AppProps {
  load?: () => Car[];
}

type CatalogResult = { cars: Car[] } | { error: string };

export function App({ load = loadCatalog }: AppProps) {
  const result = useMemo<CatalogResult>(() => {
    try {
      return { cars: load() };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logError('catalog_load_failed', { 'error.message': message });
      return { error: message };
    }
  }, [load]);

  if ('error' in result) {
    return (
      <p role="alert">No se ha podido cargar el catálogo: {result.error}</p>
    );
  }

  return (
    <main>
      <h1>Comparador de coches</h1>
      <ul>
        {result.cars.map((car) => (
          <li key={car.id}>
            {car.brand} {car.name}
          </li>
        ))}
      </ul>
    </main>
  );
}
