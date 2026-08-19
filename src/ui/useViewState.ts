import { useCallback, useEffect, useState } from 'react';
import {
  defaultViewState,
  restoreViewState,
  type ViewState,
} from '../domain/viewState';
import {
  loadRawViewState,
  saveViewState,
} from '../adapters/localStorageConfigPort';
import type { FieldSet, FichaSortCriterion } from '../domain/ficha';
import type { PhotoView } from '../domain/photo';

/** Precedencia: solo hay una fuente, lo guardado localmente, y los valores
 * por defecto (product/0024, requisito 5). El estado de vista no viaja en
 * ningún enlace, así que no hay equivalente al «viene de fuera, no lo
 * guardes todavía» de `useConfig`. */
function resolveInitialViewState(
  validEntityIds: ReadonlySet<string>,
  defaultComparisonId: string | null,
): ViewState {
  const storedRaw = loadRawViewState();
  if (storedRaw !== undefined) {
    const { viewState, discardedEntirely } = restoreViewState(
      storedRaw,
      validEntityIds,
      defaultComparisonId,
    );
    if (!discardedEntirely) return viewState;
  }
  return defaultViewState(defaultComparisonId);
}

export interface UseViewStateResult {
  viewState: ViewState;
  setComparisonId: (comparisonId: string | null) => void;
  setFieldSet: (fieldSet: FieldSet) => void;
  setSortCriterion: (sortCriterion: FichaSortCriterion) => void;
  setPhotoView: (photoView: PhotoView) => void;
  setFocusedId: (focusedId: string | null) => void;
}

/**
 * Las cinco elecciones de la ficha, persistidas (product/0024). Hermano de
 * `useConfig`, con la misma forma —restauración tolerante, guardado al
 * cambiar, el *wiring* entre el dominio puro y `localStorage` detrás de su
 * puerto—, pero instanciado dentro de `FichaPage`, no en `App.tsx`: es
 * estado local de esta vista, igual que `expandedId` vive en `RankingList`
 * y no en la raíz de la aplicación. `App.tsx` sigue siendo el único sitio
 * que llama a `clearViewState` —desde «Restablecer»— porque esa acción
 * puede dispararse sin que `FichaPage` esté montada.
 */
export function useViewState(
  validEntityIds: ReadonlySet<string>,
  defaultComparisonId: string | null,
): UseViewStateResult {
  // El inicializador perezoso corre una sola vez, en el montaje: cambios
  // posteriores en `validEntityIds` o `defaultComparisonId` no vuelven a
  // disparar la restauración, igual que en `useConfig`.
  const [viewState, setViewState] = useState<ViewState>(() =>
    resolveInitialViewState(validEntityIds, defaultComparisonId),
  );

  useEffect(() => {
    saveViewState(viewState);
  }, [viewState]);

  const setComparisonId = useCallback((comparisonId: string | null) => {
    setViewState((prev) => ({ ...prev, comparisonId }));
  }, []);

  const setFieldSet = useCallback((fieldSet: FieldSet) => {
    setViewState((prev) => ({ ...prev, fieldSet }));
  }, []);

  const setSortCriterion = useCallback((sortCriterion: FichaSortCriterion) => {
    setViewState((prev) => ({ ...prev, sortCriterion }));
  }, []);

  const setPhotoView = useCallback((photoView: PhotoView) => {
    setViewState((prev) => ({ ...prev, photoView }));
  }, []);

  const setFocusedId = useCallback((focusedId: string | null) => {
    setViewState((prev) => ({ ...prev, focusedId }));
  }, []);

  return {
    viewState,
    setComparisonId,
    setFieldSet,
    setSortCriterion,
    setPhotoView,
    setFocusedId,
  };
}
