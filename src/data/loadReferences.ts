import { z } from 'zod';
import { ReferenceSchema, type Reference } from '../domain/reference';
import referencesRaw from './references.json';

// La lista admite estar vacía: una referencia es información adicional, no
// el dato sin el que la ficha técnica no tiene sentido (a diferencia del
// catálogo de candidatos, que sí lo exige).
const ReferenceListSchema = z.array(ReferenceSchema);

export class ReferenceValidationError extends Error {}

function recordLabel(raw: unknown, index: number | undefined): string {
  if (index === undefined) {
    return 'lista de referencias';
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

export function parseReferences(raw: unknown): Reference[] {
  const result = ReferenceListSchema.safeParse(raw);
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

  throw new ReferenceValidationError(
    `Lista de referencias inválida en el registro «${label}», campo «${field}»: ${issue.message}`,
  );
}

export function loadReferences(): Reference[] {
  return parseReferences(referencesRaw);
}
