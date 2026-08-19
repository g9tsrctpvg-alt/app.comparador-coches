import { z } from 'zod';
import { logError } from '../logging/logger';
import {
  FICHA_SORT_CRITERIA,
  FIELD_SETS,
  type FichaSortCriterion,
  type FieldSet,
} from './ficha';
import { PHOTO_VIEWS, type PhotoView } from './photo';

/** Sube cuando la forma de `ViewState` cambia de manera incompatible
 * (product/0024, requisito 3). Independiente de `CONFIG_VERSION`: las dos
 * claves se descartan por separado, así que un cambio en un control de la
 * ficha no tiene por qué tirar la configuración —pesos, supuestos,
 * valoraciones— por la borda. */
export const VIEW_STATE_VERSION = 1;

/**
 * Las cinco elecciones de la ficha que sobreviven a cerrar el navegador
 * (product/0024, requisito 1): el modelo de comparación, el conjunto de
 * campos, el criterio de orden, la vista de foto y el candidato enfocado
 * en la tira móvil. Nunca viaja en el enlace compartible —eso sigue siendo
 * solo `AppConfig`—, así que no tiene forma `configUrl.ts`.
 */
export interface ViewState {
  version: number;
  comparisonId: string | null;
  fieldSet: FieldSet;
  sortCriterion: FichaSortCriterion;
  photoView: PhotoView;
  focusedId: string | null;
}

/**
 * El valor por defecto no es una constante: `comparisonId` por defecto es
 * la primera referencia del catálogo (requisito 12), y qué referencia es
 * esa lo decide `references.json`, que `domain/` no lee. Quien restaura o
 * inicializa este estado pasa ese id —o `null` si no hay ninguna
 * referencia— igual que `restoreConfig` recibe `validCarIds` desde fuera.
 */
export function defaultViewState(
  defaultComparisonId: string | null,
): ViewState {
  return {
    version: VIEW_STATE_VERSION,
    comparisonId: defaultComparisonId,
    fieldSet: 'esenciales',
    sortCriterion: 'lengthMm',
    photoView: 'side',
    focusedId: null,
  };
}

const FieldSetSchema = z.enum(FIELD_SETS);
const SortCriterionSchema = z.enum(FICHA_SORT_CRITERIA);
const PhotoViewSchema = z.enum(PHOTO_VIEWS);
/** `null` es «Ninguno», un valor elegido, no la ausencia de dato (requisito
 * 9): solo `z.string().min(1)` sería un campo obligatorio y perdería esa
 * distinción. */
const NullableIdSchema = z.string().min(1).nullable();

function restoreField<T>(
  field: string,
  value: unknown,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  if (value === undefined) return fallback;
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    logError('view_state_field_discarded', { field });
    return fallback;
  }
  return parsed.data;
}

/**
 * `comparisonId` y `focusedId` son identificadores de entidad de la ficha
 * —coche o referencia, requisito 8—, no un valor de un conjunto cerrado:
 * se validan también contra el catálogo vigente, no solo contra la forma
 * `string | null`. Ausente no cuenta como descarte (requisito 7); presente
 * pero inválido o huérfano sí, y cae al valor por defecto de ese campo, no
 * a `null` a ciegas.
 */
function restoreEntityId(
  field: string,
  value: unknown,
  validEntityIds: ReadonlySet<string>,
  fallback: string | null,
): string | null {
  if (value === undefined) return fallback;
  const parsed = NullableIdSchema.safeParse(value);
  if (!parsed.success) {
    logError('view_state_field_discarded', { field });
    return fallback;
  }
  if (parsed.data !== null && !validEntityIds.has(parsed.data)) {
    logError('view_state_entity_discarded', {
      field,
      'entity.id': parsed.data,
    });
    return fallback;
  }
  return parsed.data;
}

export interface RestoreViewStateResult {
  viewState: ViewState;
  /** Verdadero cuando `raw` no era un objeto restaurable en absoluto —JSON
   * corrupto o versión desconocida—, igual que `RestoreResult` de
   * `config.ts`. No afecta a `AppConfig`: las dos claves se restauran por
   * separado. */
  discardedEntirely: boolean;
}

/**
 * Restaura el estado de vista desde JSON ya parseado, con la misma
 * degradación por partes que `restoreConfig` (product/0024, requisito 7):
 * un dato inválido no rompe la ficha, se descarta y esa parte cae a su
 * valor por defecto. `validEntityIds` es el conjunto de ids de coches y
 * referencias vigente hoy (requisito 8); `defaultComparisonId` es la
 * primera referencia del catálogo, o `null` si no hay ninguna.
 */
export function restoreViewState(
  raw: unknown,
  validEntityIds: ReadonlySet<string>,
  defaultComparisonId: string | null,
): RestoreViewStateResult {
  const fallback = defaultViewState(defaultComparisonId);

  if (typeof raw !== 'object' || raw === null) {
    logError('view_state_discarded', { reason: 'not_an_object' });
    return { viewState: fallback, discardedEntirely: true };
  }

  const record = raw as Record<string, unknown>;
  if (record.version !== VIEW_STATE_VERSION) {
    logError('view_state_discarded', {
      reason: 'unknown_version',
      'view_state.version': String(record.version),
    });
    return { viewState: fallback, discardedEntirely: true };
  }

  const viewState: ViewState = {
    version: VIEW_STATE_VERSION,
    comparisonId: restoreEntityId(
      'comparisonId',
      record.comparisonId,
      validEntityIds,
      defaultComparisonId,
    ),
    fieldSet: restoreField(
      'fieldSet',
      record.fieldSet,
      FieldSetSchema,
      fallback.fieldSet,
    ),
    sortCriterion: restoreField(
      'sortCriterion',
      record.sortCriterion,
      SortCriterionSchema,
      fallback.sortCriterion,
    ),
    photoView: restoreField(
      'photoView',
      record.photoView,
      PhotoViewSchema,
      fallback.photoView,
    ),
    focusedId: restoreEntityId(
      'focusedId',
      record.focusedId,
      validEntityIds,
      fallback.focusedId,
    ),
  };
  return { viewState, discardedEntirely: false };
}
