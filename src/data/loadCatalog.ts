import { z } from 'zod';
import { CarSchema, type Car } from '../domain/car';
import carsRaw from './cars.json';

const CatalogSchema = z.array(CarSchema);

export class CatalogValidationError extends Error {}

function recordLabel(raw: unknown, index: number | undefined): string {
  if (index === undefined) {
    return 'catálogo';
  }
  // Zod solo añade un índice numérico al path al validar contra
  // z.array(...), así que si `index` existe, `raw` ya es ese array.
  const record: unknown = (raw as unknown[])[index];
  if (
    record !== null &&
    typeof record === 'object' &&
    'id' in record &&
    typeof record.id === 'string'
  ) {
    return record.id;
  }
  return `índice ${index}`;
}

export function parseCatalog(raw: unknown): Car[] {
  const result = CatalogSchema.safeParse(raw);
  if (result.success) {
    return result.data;
  }

  // Zod solo produce un ZodError cuando safeParse falla, y en ese caso
  // `issues` siempre tiene al menos un elemento: no hay caso "sin detalle".
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- invariante de zod, justificada arriba
  const issue = result.error.issues[0]!;
  const [index, ...fieldPath] = issue.path;
  const field =
    fieldPath.length > 0 ? fieldPath.join('.') : '(registro completo)';
  const label = recordLabel(raw, typeof index === 'number' ? index : undefined);

  throw new CatalogValidationError(
    `Catálogo inválido en el registro «${label}», campo «${field}»: ${issue.message}`,
  );
}

export function loadCatalog(): Car[] {
  return parseCatalog(carsRaw);
}
