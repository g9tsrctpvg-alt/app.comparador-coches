import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { Car } from '../domain/car';
import type { Reference } from '../domain/reference';
import {
  buildFicha,
  sortFicha,
  withComparison,
  type DeltaDirection,
  type FichaCell,
  type FichaEntity,
  type FichaField,
  type FichaSortCriterion,
} from '../domain/ficha';
import {
  PHOTO_VIEWS,
  photoSrc,
  type Photo,
  type PhotoView,
} from '../domain/photo';
import { formatEur, formatNumber, formatSigned } from './format';
import { TECHNOLOGY_LABELS } from './technologyLabels';
import { EstimatedMark } from './components/EstimatedMark';
import primitives from './primitives.module.css';
import shellStyles from './components/AppShell.module.css';
import styles from './FichaPage.module.css';

interface FichaPageProps {
  cars: Car[];
  references: Reference[];
}

const PHOTO_VIEW_LABELS: Record<PhotoView, string> = {
  front: 'Frontal',
  side: 'Lateral',
  rear: 'Trasera',
  trunk: 'Maletero',
  interior: 'Interior',
};

interface FieldDef {
  key: FichaField;
  label: string;
  unitFallback?: string;
  decimals?: number;
  isEuro?: boolean;
}

interface BlockDef {
  id: string;
  /** `null` cuando el grupo no necesita cabecera propia (requisito 4.3):
   * en «Esenciales» solo hay un grupo, y rotularlo no añade nada. */
  label: string | null;
  fields: FieldDef[];
}

/**
 * Las veinte magnitudes de la ficha (product/0014, requisito 1; product/0018
 * las reparte en dos conjuntos), agrupadas y rotuladas — el dominio
 * (`ficha.ts`) solo declara las claves y extrae los valores; etiquetas,
 * unidades de respaldo y decimales son decisión de la interfaz.
 */
const COMPLETE_BLOCKS: BlockDef[] = [
  {
    id: 'tamano',
    label: 'Tamaño y espacio',
    fields: [
      { key: 'lengthMm', label: 'Longitud', unitFallback: 'mm' },
      { key: 'widthMm', label: 'Anchura', unitFallback: 'mm' },
      { key: 'heightMm', label: 'Altura', unitFallback: 'mm' },
      { key: 'wheelbaseMm', label: 'Batalla', unitFallback: 'mm' },
      {
        key: 'rearShoulderWidthMm',
        label: 'Anchura de hombros atrás',
        unitFallback: 'mm',
      },
      {
        key: 'groundClearanceMm',
        label: 'Altura libre al suelo',
        unitFallback: 'mm',
      },
      { key: 'trunkLiters', label: 'Maletero', unitFallback: 'L' },
      {
        key: 'litersPerSquareMeter',
        label: 'Litros por m²',
        unitFallback: 'L/m²',
        decimals: 1,
      },
    ],
  },
  {
    id: 'mecanica',
    label: 'Mecánica y prestaciones',
    fields: [
      { key: 'powerCv', label: 'Potencia', unitFallback: 'CV' },
      { key: 'weightKg', label: 'Peso', unitFallback: 'kg' },
      {
        key: 'acceleration0to100',
        label: 'Aceleración 0-100',
        unitFallback: 's',
        decimals: 1,
      },
      { key: 'consumption', label: 'Consumo', decimals: 1 },
    ],
  },
  {
    id: 'coste',
    label: 'Coste',
    fields: [
      { key: 'priceEur', label: 'Precio', isEuro: true },
      { key: 'maintenanceEurYear', label: 'Mantenimiento', isEuro: true },
      {
        key: 'residualPct5y',
        label: 'Valor residual a 5 años',
        decimals: 2,
      },
    ],
  },
  {
    id: 'fiabilidad',
    label: 'Fiabilidad y respaldo',
    fields: [
      { key: 'reliabilityOcu', label: 'Fiabilidad OCU' },
      { key: 'warrantyYears', label: 'Garantía', unitFallback: 'años' },
      {
        key: 'warrantyExtensionYears',
        label: 'Extensión de garantía',
        unitFallback: 'años',
      },
    ],
  },
  {
    id: 'juicio',
    label: 'Juicio propio',
    fields: [
      { key: 'aestheticsExterior', label: 'Estética exterior' },
      { key: 'aestheticsInterior', label: 'Estética interior' },
    ],
  },
];

// Exportado para que el test de estructura pueda comprobar el conjunto real
// de claves que «Completa» renderiza contra `FICHA_FIELDS`, no solo su
// recuento (`TOTAL_FIELD_COUNT` por sí solo es tautológico: sale de esta
// misma lista).
export const COMPLETE_FIELD_DEFS = new Map<FichaField, FieldDef>(
  COMPLETE_BLOCKS.flatMap((block) =>
    block.fields.map((def) => [def.key, def] as const),
  ),
);

/** Busca un `FieldDef` ya declarado en «Completa» — para que «Esenciales»
 * no pueda tener una etiqueta, unidad o decimales distintos del mismo campo
 * por una edición que solo toque uno de los dos sitios. */
function completeFieldDef(key: FichaField): FieldDef {
  const def = COMPLETE_FIELD_DEFS.get(key);
  if (def === undefined) {
    throw new Error(`FieldDef no declarado en COMPLETE_BLOCKS: ${key}`);
  }
  return def;
}

/**
 * El conjunto «Esenciales» (product/0020, requisito 1): tamaño —longitud,
 * anchura, altura libre al suelo, maletero—, potencia y precio, sin
 * cabecera de bloque porque aquí solo hay un grupo. Altura y litros por m²
 * —las dos de la extinta ficha técnica que no sobrevivieron aquí— siguen en
 * «Completa»: la primera no tiene dirección declarada
 * (`docs/estado/dominio.md`, tabla de polaridad: `neutral`) y la segunda es
 * una métrica derivada, no una medida directa. Las seis reutilizan tal cual
 * el `FieldDef` de «Completa» (requisito 3): mismo `key`, misma etiqueta,
 * mismo formato — `completeFieldDef` lo hace estructuralmente imposible de
 * incumplir, no solo una convención a seguir a mano.
 */
const ESSENTIAL_BLOCKS: BlockDef[] = [
  {
    id: 'esenciales',
    label: null,
    fields: (
      [
        'lengthMm',
        'widthMm',
        'groundClearanceMm',
        'trunkLiters',
        'powerCv',
        'priceEur',
      ] as const
    ).map(completeFieldDef),
  },
];

type FieldSet = 'esenciales' | 'completa';

const SORT_OPTIONS: { value: FichaSortCriterion; label: string }[] = [
  { value: 'catalog', label: 'Catálogo' },
  { value: 'lengthMm', label: 'Longitud' },
  { value: 'widthMm', label: 'Anchura' },
  { value: 'priceEur', label: 'Precio' },
];

// Exportado para que el test de estructura compruebe el número de filas de
// datos sin repetir la cuenta a mano.
export const TOTAL_FIELD_COUNT = COMPLETE_BLOCKS.reduce(
  (sum, block) => sum + block.fields.length,
  0,
);

interface OpenPhoto {
  entity: FichaEntity;
  view: PhotoView;
  photo: Photo;
}

const DIRECTION_CLASS: Record<DeltaDirection, string> = {
  better: styles.deltaBetter ?? '',
  worse: styles.deltaWorse ?? '',
  neutral: styles.deltaNeutral ?? '',
};

// Ninguna de las dos depende de la entidad ni del campo: se calculan una
// sola vez, no en cada celda de cada fila de cada columna.
const PINNED_CELL_CLASS = `${primitives.numeric} ${styles.pinnedCell}`;
const MODEL_CELL_CLASS = `${primitives.numeric} ${styles.modelCell}`;

/** El signo va siempre escrito (product/0013, requisito 10, que esta fusión
 * no relaja): el color de `DIRECTION_CLASS` es refuerzo, nunca la única
 * vía de leer si una diferencia es favorable. `cellUnit` —la unidad real de
 * la celda, no la unidad por defecto del campo— importa en `consumption`:
 * es lo único que distingue litros de kWh cuando dos coches comparten
 * unidad y sí llegan a tener una Δ numérica. */
function formatDelta(value: number, def: FieldDef, cellUnit?: string): string {
  if (def.isEuro) {
    const magnitude = formatEur(Math.abs(value));
    if (value > 0) return `+${magnitude}`;
    if (value < 0) return `−${magnitude}`;
    return magnitude;
  }
  const unit = cellUnit ?? def.unitFallback ?? '';
  const formatted = formatSigned(value, def.decimals ?? 0);
  return unit ? `${formatted} ${unit}` : formatted;
}

function CellValue({
  cell,
  def,
}: {
  cell: Exclude<FichaCell, { kind: 'missing' }>;
  def: FieldDef;
}) {
  if (cell.kind === 'rating') {
    return <>{formatNumber(cell.value, 0)} / 5</>;
  }
  const unit = cell.unit ?? def.unitFallback ?? '';
  return (
    <>
      {def.isEuro
        ? formatEur(cell.value)
        : `${formatNumber(cell.value, def.decimals ?? 0)}${unit ? ` ${unit}` : ''}`}
      {cell.estimated && <EstimatedMark />}
    </>
  );
}

function CellContent({ cell, def }: { cell: FichaCell; def: FieldDef }) {
  if (cell.kind === 'missing') {
    return (
      <>
        <span className={primitives.visuallyHidden}>Dato no disponible.</span>
        <span aria-hidden="true">—</span>
      </>
    );
  }
  return (
    <>
      <span className={styles.cellValue}>
        <CellValue cell={cell} def={def} />
      </span>
      {cell.delta === 'unavailable' && (
        <span className={styles.cellDelta}>
          <span className={primitives.visuallyHidden}>
            Sin diferencia que mostrar.
          </span>
          <span aria-hidden="true">—</span>
        </span>
      )}
      {cell.delta !== null && cell.delta !== 'unavailable' && (
        <span
          className={[
            styles.cellDelta,
            DIRECTION_CLASS[cell.delta.direction],
            def.key === 'widthMm' ? styles.deltaEmphasized : '',
          ].join(' ')}
        >
          {formatDelta(
            cell.delta.value,
            def,
            cell.kind === 'sourced' ? cell.unit : undefined,
          )}
        </span>
      )}
    </>
  );
}

/** Una celda de dato, fijada o desplazable (mismo reparto que
 * `ModelHeaderCell` hace en la cabecera): las dos difieren solo en la clase
 * y en qué entidad leen, así que comparten esta única definición en vez de
 * repetir el `<td>` una vez por cada una. */
function DataCell({
  entity,
  def,
  isPinned,
}: {
  entity: FichaEntity;
  def: FieldDef;
  isPinned: boolean;
}) {
  return (
    <td className={isPinned ? PINNED_CELL_CLASS : MODEL_CELL_CLASS}>
      <span className={styles.cellLabel}>{def.label}</span>
      <CellContent cell={entity.cells[def.key]} def={def} />
    </td>
  );
}

function PhotoBox({
  entity,
  photoView,
  onOpen,
}: {
  entity: FichaEntity;
  photoView: PhotoView;
  onOpen: (entity: FichaEntity, view: PhotoView, photo: Photo) => void;
}) {
  // Una `src` que no carga —foto declarada, host caído o bloqueada por la
  // red de quien mira— degrada al mismo hueco que «sin foto» (product/0014,
  // sección 4.3), en vez de dejar el icono de imagen rota. Guardar la propia
  // `src` fallida, no un booleano, evita quedarse en modo «hueco» si el
  // usuario cambia de vista y esa sí carga.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const photo = entity.photos[photoView];
  if (photo === undefined || photoSrc(photo) === failedSrc) {
    return (
      <div className={styles.photoPlaceholder}>
        <span className={primitives.visuallyHidden}>{entity.name}, </span>
        {PHOTO_VIEW_LABELS[photoView]} — sin foto
      </div>
    );
  }
  const src = photoSrc(photo);
  return (
    <button
      type="button"
      className={styles.photoButton}
      onClick={() => onOpen(entity, photoView, photo)}
    >
      {/* Sin `decoding="async"`: era el último atributo que esta miniatura
          llevaba y la foto del diálogo —que sí se ve— no, y con una docena de
          imágenes pequeñas no compra nada medible. WebKit tiene fallos
          conocidos de pintado con decodificación asíncrona dentro de
          contenedores desplazables compuestos, que es exactamente donde vive
          esta tabla. */}
      <img
        src={src}
        alt={`${entity.name}, vista ${PHOTO_VIEW_LABELS[photoView].toLowerCase()}`}
        referrerPolicy="no-referrer"
        className={styles.photo}
        onError={() => setFailedSrc(src)}
      />
    </button>
  );
}

function ModelHeaderCell({
  entity,
  isPinned,
  photoView,
  onPin,
  onOpenPhoto,
}: {
  entity: FichaEntity;
  isPinned: boolean;
  photoView: PhotoView;
  onPin: (id: string) => void;
  onOpenPhoto: (entity: FichaEntity, view: PhotoView, photo: Photo) => void;
}) {
  return (
    <th
      scope="col"
      className={isPinned ? styles.pinnedHeader : styles.modelHeader}
    >
      <PhotoBox entity={entity} photoView={photoView} onOpen={onOpenPhoto} />
      <label className={styles.pinLabel}>
        <input
          type="radio"
          name="pinned-model"
          value={entity.id}
          checked={isPinned}
          onChange={() => onPin(entity.id)}
          aria-label={`Comparar contra ${entity.name}`}
          className={styles.pinInput}
        />
        <span className={styles.modelInfo}>
          <span className={styles.modelName}>{entity.name}</span>
          <span className={primitives.secondaryText}>
            {entity.brand} · {TECHNOLOGY_LABELS[entity.technology]}
          </span>
        </span>
      </label>
      {entity.kind === 'reference' && (
        <span className={styles.referenceTag}>Referencia</span>
      )}
    </th>
  );
}

/** Por debajo de este movimiento acumulado, un gesto táctil no fija eje
 * todavía (technical/0007): es el temblor natural del dedo al posarse, no
 * una intención de desplazamiento. */
const AXIS_LOCK_THRESHOLD_PX = 10;

/**
 * Ancla un gesto táctil al eje que domina su primer movimiento
 * significativo (technical/0007, requisitos 2-4): `.tableWrapper` desplaza
 * en los dos ejes a la vez —columnas de modelo con anclaje de scroll,
 * filas cuando la tabla no cabe entera—, y un gesto pensado como «hacia
 * abajo» casi nunca es puramente vertical. Sin este bloqueo, el componente
 * horizontal mínimo de ese gesto podía bastar para saltar de una columna a
 * la siguiente.
 *
 * El eje que domina conserva su `overflow: auto` de siempre —el navegador
 * sigue resolviendo su inercia él solo—; el eje contrario nunca se
 * desactiva (technical/0008: desactivarlo con `overflow: hidden` es lo que
 * reseteaba el scroll horizontal al reactivarse, por su interacción con
 * `scroll-snap-type: x mandatory`). En vez de eso, se guarda la posición
 * del eje contrario al fijarse el gesto, y un listener de `scroll` la
 * reimpone en cada evento mientras dure — el eje bloqueado se queda quieto
 * porque se corrige a mano, no porque deje de ser desplazable.
 */
function attachScrollAxisLock(el: HTMLDivElement): () => void {
  let startX = 0;
  let startY = 0;
  let lockedAxis: 'x' | 'y' | null = null;
  let lockedScrollLeft = 0;
  let lockedScrollTop = 0;

  function unlock() {
    lockedAxis = null;
  }

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    if (touch === undefined) return;
    startX = touch.clientX;
    startY = touch.clientY;
    unlock();
  }

  function onTouchMove(event: TouchEvent) {
    if (lockedAxis !== null) return;
    const touch = event.touches[0];
    if (touch === undefined) return;
    const dx = Math.abs(touch.clientX - startX);
    const dy = Math.abs(touch.clientY - startY);
    if (Math.max(dx, dy) < AXIS_LOCK_THRESHOLD_PX) return;
    lockedAxis = dx > dy ? 'x' : 'y';
    lockedScrollLeft = el.scrollLeft;
    lockedScrollTop = el.scrollTop;
  }

  function onScroll() {
    if (lockedAxis === 'y') {
      el.scrollLeft = lockedScrollLeft;
    } else if (lockedAxis === 'x') {
      el.scrollTop = lockedScrollTop;
    }
  }

  el.addEventListener('touchstart', onTouchStart, { passive: true });
  el.addEventListener('touchmove', onTouchMove, { passive: true });
  el.addEventListener('touchend', unlock, { passive: true });
  el.addEventListener('touchcancel', unlock, { passive: true });
  el.addEventListener('scroll', onScroll, { passive: true });

  return () => {
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', unlock);
    el.removeEventListener('touchcancel', unlock);
    el.removeEventListener('scroll', onScroll);
  };
}

/**
 * La ficha (product/0018): una columna por modelo, una fila por
 * característica, con la columna del modelo de comparación fija a la
 * izquierda mientras el resto se desplaza. Funde la extinta ficha técnica
 * (product/0013) y la ficha completa (product/0014) en una sola vista: la
 * Δ que antes solo existía contra el Alfa Romeo Giulietta ahora se calcula
 * contra cualquier modelo que se elija, y un conmutador de campos recupera
 * la lectura «de un vistazo» de seis magnitudes cuando no hace falta ver
 * las veinte. No calcula nada por su cuenta: `ficha.ts` ya entrega cada
 * celda lista para formatear (`ui-no-scoring-internals`).
 */
export function FichaPage({ cars, references }: FichaPageProps) {
  const baseEntities = useMemo(
    () => buildFicha(cars, references),
    [cars, references],
  );

  const [comparisonId, setComparisonId] = useState<string | null>(
    () => references[0]?.id ?? null,
  );
  const [fieldSet, setFieldSet] = useState<FieldSet>('esenciales');
  const [sortCriterion, setSortCriterion] =
    useState<FichaSortCriterion>('lengthMm');
  const [photoView, setPhotoView] = useState<PhotoView>('side');
  const [openPhoto, setOpenPhoto] = useState<OpenPhoto | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tableWrapperRef.current;
    if (el === null) return;
    return attachScrollAxisLock(el);
  }, []);

  const entitiesWithDelta = useMemo(
    () => withComparison(baseEntities, comparisonId),
    [baseEntities, comparisonId],
  );

  const pinnedEntity = useMemo(
    () => entitiesWithDelta.find((e) => e.id === comparisonId),
    [entitiesWithDelta, comparisonId],
  );
  const scrollableEntities = useMemo(
    () =>
      sortFicha(
        entitiesWithDelta.filter((e) => e.id !== pinnedEntity?.id),
        sortCriterion,
      ),
    [entitiesWithDelta, pinnedEntity, sortCriterion],
  );
  const columnCount = 1 + (pinnedEntity ? 1 : 0) + scrollableEntities.length;
  const blocks = fieldSet === 'esenciales' ? ESSENTIAL_BLOCKS : COMPLETE_BLOCKS;

  function handleComparisonChange(id: string | null) {
    setComparisonId(id);
    // El modelo recién fijado —o «Ninguno»— no debe dejar la tabla
    // desplazada a mitad de camino (requisito 9.3, extendido a este caso).
    tableWrapperRef.current?.scrollTo({ left: 0 });
  }

  function handleOpenPhoto(entity: FichaEntity, view: PhotoView, photo: Photo) {
    setOpenPhoto({ entity, view, photo });
    dialogRef.current?.showModal();
  }

  function handleDialogClose() {
    setOpenPhoto(null);
  }

  return (
    <>
      <h1 className={shellStyles.viewTitle}>Ficha</h1>

      <div className={styles.toolbar}>
        <div className={styles.toolbarControl}>
          <label className={primitives.label} htmlFor="field-set-select">
            Campos
          </label>
          <select
            id="field-set-select"
            className={styles.toolbarSelect}
            value={fieldSet}
            onChange={(event) => setFieldSet(event.target.value as FieldSet)}
          >
            <option value="esenciales">Esenciales</option>
            <option value="completa">Completa</option>
          </select>
        </div>

        <div className={styles.toolbarControl}>
          <span className={primitives.label} id="comparison-label">
            Comparar contra
          </span>
          <label className={styles.noneOption}>
            <input
              type="radio"
              name="pinned-model"
              checked={comparisonId === null}
              onChange={() => handleComparisonChange(null)}
              aria-label="No comparar contra ningún modelo"
            />
            Ninguno
          </label>
        </div>

        <div className={styles.toolbarControl}>
          <label className={primitives.label} htmlFor="sort-select">
            Orden
          </label>
          <select
            id="sort-select"
            className={styles.toolbarSelect}
            value={sortCriterion}
            onChange={(event) =>
              setSortCriterion(event.target.value as FichaSortCriterion)
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.viewSelector}>
          <label className={primitives.label} htmlFor="photo-view-select">
            Vista de la foto
          </label>
          <select
            id="photo-view-select"
            name="photo-view"
            className={styles.viewSelect}
            value={photoView}
            onChange={(event) => setPhotoView(event.target.value as PhotoView)}
          >
            {PHOTO_VIEWS.map((view) => (
              <option key={view} value={view}>
                {PHOTO_VIEW_LABELS[view]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className={
          pinnedEntity
            ? styles.tableWrapper
            : `${styles.tableWrapper} ${styles.tableWrapperNoPin}`
        }
        ref={tableWrapperRef}
        tabIndex={0}
        role="group"
        aria-label="Ficha, con desplazamiento horizontal"
      >
        <table className={styles.table}>
          <caption className={primitives.visuallyHidden}>
            Ficha comparada: las magnitudes de cada modelo, con su diferencia
            frente al modelo de comparación elegido, y una columna fija para ese
            modelo
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles.featureHeader}>
                {/* No visible (corrección 2026-08-07 del requisito 8.3): cada
                    fila ya lleva su propio rótulo al lado, así que repetir
                    "Característica" en la esquina no añadía información —
                    solo ocupaba sitio. Se queda para quien lee con lector de
                    pantalla la cabecera de la columna. */}
                <span className={primitives.visuallyHidden}>
                  Característica
                </span>
              </th>
              {pinnedEntity && (
                <ModelHeaderCell
                  entity={pinnedEntity}
                  isPinned
                  photoView={photoView}
                  onPin={handleComparisonChange}
                  onOpenPhoto={handleOpenPhoto}
                />
              )}
              {scrollableEntities.map((entity) => (
                <ModelHeaderCell
                  key={entity.id}
                  entity={entity}
                  isPinned={false}
                  photoView={photoView}
                  onPin={handleComparisonChange}
                  onOpenPhoto={handleOpenPhoto}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <Fragment key={block.id}>
                {block.label !== null && (
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={columnCount}
                      className={styles.blockHeader}
                    >
                      {/* La celda entera abarca todas las columnas para que
                          la banda de fondo cubra la fila (requisito 8.2);
                          el rótulo va en su propio `sticky` para seguir
                          legible al desplazar — sin esto, desaparece por la
                          izquierda en cuanto se avanza más allá de la
                          primera columna, porque una celda de ese ancho no
                          puede fijarse entera sin salirse de la tabla. */}
                      <span className={styles.blockHeaderLabel}>
                        {block.label}
                      </span>
                    </th>
                  </tr>
                )}
                {block.fields.map((def) => (
                  <tr key={def.key}>
                    <th scope="row" className={styles.featureCell}>
                      {def.label}
                    </th>
                    {pinnedEntity && (
                      <DataCell entity={pinnedEntity} def={def} isPinned />
                    )}
                    {scrollableEntities.map((entity) => (
                      <DataCell
                        key={entity.id}
                        entity={entity}
                        def={def}
                        isPinned={false}
                      />
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.legend}>
        Cada columna es un modelo; márquela —o marque «Ninguno»— para elegir
        contra qué se comparan las demás. Cuando hay un modelo de comparación,
        cada celda muestra debajo su diferencia, con el signo siempre escrito:
        el color es un refuerzo, nunca la única vía de leerlo. En maletero,
        litros por m², potencia, fiabilidad, garantía, extensión de garantía,
        valor residual a 5 años, anchura de hombros atrás y las dos notas de
        estética, más es mejor; en anchura, longitud, peso, aceleración,
        consumo, precio y mantenimiento, más es peor, porque el problema que
        resuelve el proyecto es que los sustitutos son más grandes y más caros.
        Altura, altura libre al suelo y batalla no tienen una dirección
        declarada. La columna de anchura va en negrita: es la prioridad
        declarada del proyecto. El selector de vista de foto cambia qué vista
        enseñan todas las columnas a la vez. La marca <EstimatedMark /> señala
        un dato estimado, sin fuente publicada verificada directamente.
      </p>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onClose={handleDialogClose}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
      >
        {openPhoto && (
          <>
            <figure className={styles.dialogFigure}>
              <img
                src={photoSrc(openPhoto.photo)}
                alt={`${openPhoto.entity.name}, vista ${PHOTO_VIEW_LABELS[openPhoto.view].toLowerCase()}`}
                className={styles.dialogImage}
              />
              <figcaption className={styles.dialogCaption}>
                {openPhoto.photo.shows} — {openPhoto.photo.credit}
              </figcaption>
            </figure>
            <button
              type="button"
              className={styles.dialogClose}
              onClick={() => dialogRef.current?.close()}
              aria-label="Cerrar la foto ampliada"
            >
              <span aria-hidden="true" className={styles.dialogCloseGlyph}>
                ×
              </span>
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
