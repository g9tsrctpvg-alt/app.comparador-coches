import { Fragment, useMemo, useRef, useState } from 'react';
import type { Car } from '../domain/car';
import type { Reference } from '../domain/reference';
import {
  buildFichaCompleta,
  type FichaCompletaCell,
  type FichaCompletaEntity,
  type FichaCompletaField,
} from '../domain/fichaCompleta';
import {
  PHOTO_VIEWS,
  photoSrc,
  type Photo,
  type PhotoView,
} from '../domain/photo';
import { formatEur, formatNumber } from './format';
import { TECHNOLOGY_LABELS } from './technologyLabels';
import { EstimatedMark } from './components/EstimatedMark';
import { ViewSwitcher } from './components/ViewSwitcher';
import { EXPLICACION_HASH } from './useHashRoute';
import primitives from './primitives.module.css';
import styles from './FichaCompletaPage.module.css';

interface FichaCompletaPageProps {
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
  key: FichaCompletaField;
  label: string;
  unitFallback?: string;
  decimals?: number;
  isEuro?: boolean;
}

interface BlockDef {
  id: string;
  label: string;
  fields: FieldDef[];
}

/**
 * Las diecinueve magnitudes de `product/0014` (requisito 1), agrupadas y
 * rotuladas — el dominio (`fichaCompleta.ts`) solo declara las claves y
 * extrae los valores; etiquetas, unidades de respaldo y decimales son
 * decisión de la interfaz, igual que `DIMENSION_COLUMNS` en
 * `FichaTecnicaPage`.
 */
const BLOCKS: BlockDef[] = [
  {
    id: 'tamano',
    label: 'Tamaño y espacio',
    fields: [
      { key: 'lengthMm', label: 'Longitud', unitFallback: 'mm' },
      { key: 'widthMm', label: 'Anchura', unitFallback: 'mm' },
      { key: 'heightMm', label: 'Altura', unitFallback: 'mm' },
      { key: 'wheelbaseMm', label: 'Batalla', unitFallback: 'mm' },
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
      { key: 'travelComfort', label: 'Confort de viaje' },
    ],
  },
];

// Exportado para que el test de estructura compruebe el número de filas de
// datos sin repetir la cuenta a mano.
export const TOTAL_FIELD_COUNT = BLOCKS.reduce(
  (sum, block) => sum + block.fields.length,
  0,
);

interface OpenPhoto {
  entity: FichaCompletaEntity;
  view: PhotoView;
  photo: Photo;
}

function CellContent({
  cell,
  def,
}: {
  cell: FichaCompletaCell;
  def: FieldDef;
}) {
  if (cell.kind === 'missing') {
    return (
      <>
        <span className={primitives.visuallyHidden}>Dato no disponible.</span>
        <span aria-hidden="true">—</span>
      </>
    );
  }
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

function PhotoBox({
  entity,
  photoView,
  onOpen,
}: {
  entity: FichaCompletaEntity;
  photoView: PhotoView;
  onOpen: (entity: FichaCompletaEntity, view: PhotoView, photo: Photo) => void;
}) {
  const photo = entity.photos[photoView];
  if (photo === undefined) {
    return (
      <div className={styles.photoPlaceholder}>
        <span className={primitives.visuallyHidden}>{entity.name}, </span>
        {PHOTO_VIEW_LABELS[photoView]} — sin foto
      </div>
    );
  }
  return (
    <button
      type="button"
      className={styles.photoButton}
      onClick={() => onOpen(entity, photoView, photo)}
    >
      <img
        src={photoSrc(photo)}
        alt={`${entity.name}, vista ${PHOTO_VIEW_LABELS[photoView].toLowerCase()}`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={styles.photo}
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
  entity: FichaCompletaEntity;
  isPinned: boolean;
  photoView: PhotoView;
  onPin: (id: string) => void;
  onOpenPhoto: (
    entity: FichaCompletaEntity,
    view: PhotoView,
    photo: Photo,
  ) => void;
}) {
  return (
    <th
      scope="col"
      className={isPinned ? styles.pinnedHeader : styles.modelHeader}
    >
      <input
        type="radio"
        name="pinned-model"
        value={entity.id}
        checked={isPinned}
        onChange={() => onPin(entity.id)}
        aria-label={`Comparar contra ${entity.name}`}
        className={styles.pinControl}
      />
      <PhotoBox entity={entity} photoView={photoView} onOpen={onOpenPhoto} />
      <span className={styles.modelName}>{entity.name}</span>
      <span className={primitives.secondaryText}>
        {entity.brand} · {TECHNOLOGY_LABELS[entity.technology]}
      </span>
      {entity.kind === 'reference' && (
        <span className={styles.referenceTag}>Referencia</span>
      )}
    </th>
  );
}

/**
 * La ficha completa (product/0014): una columna por modelo, una fila por
 * característica, con la columna de nombres y la de comparación fijas a la
 * izquierda mientras el resto se desplaza. No calcula nada: `fichaCompleta.ts`
 * ya entrega cada celda lista para formatear (`ui-no-scoring-internals`).
 */
export function FichaCompletaPage({
  cars,
  references,
}: FichaCompletaPageProps) {
  const entities = useMemo(
    () => buildFichaCompleta(cars, references),
    [cars, references],
  );

  const [pinnedId, setPinnedId] = useState<string>(
    () => references[0]?.id ?? entities[0]?.id ?? '',
  );
  const [photoView, setPhotoView] = useState<PhotoView>('side');
  const [openPhoto, setOpenPhoto] = useState<OpenPhoto | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  const pinnedEntity = entities.find((e) => e.id === pinnedId) ?? entities[0];
  const scrollableEntities = entities.filter((e) => e.id !== pinnedEntity?.id);
  const columnCount = 2 + scrollableEntities.length;

  function handlePin(id: string) {
    setPinnedId(id);
    // El modelo recién fijado no debe quedar fuera de pantalla en el mismo
    // gesto que lo elige (requisito 9.3).
    tableWrapperRef.current?.scrollTo({ left: 0 });
  }

  function handleOpenPhoto(
    entity: FichaCompletaEntity,
    view: PhotoView,
    photo: Photo,
  ) {
    setOpenPhoto({ entity, view, photo });
    dialogRef.current?.showModal();
  }

  function handleDialogClose() {
    setOpenPhoto(null);
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Comparador de coches</h1>
      <ViewSwitcher route="ficha-completa" />
      <a href={EXPLICACION_HASH} className={styles.explainLink}>
        Cómo se calcula todo →
      </a>

      <fieldset className={styles.viewSelector}>
        <legend className={primitives.label}>Vista de la foto</legend>
        {PHOTO_VIEWS.map((view) => (
          <label key={view} className={styles.viewOption}>
            <input
              type="radio"
              name="photo-view"
              value={view}
              checked={photoView === view}
              onChange={() => setPhotoView(view)}
            />
            {PHOTO_VIEW_LABELS[view]}
          </label>
        ))}
      </fieldset>

      <div
        className={styles.tableWrapper}
        ref={tableWrapperRef}
        tabIndex={0}
        role="group"
        aria-label="Ficha completa, con desplazamiento horizontal"
      >
        <table className={styles.table}>
          <caption className={primitives.visuallyHidden}>
            Ficha completa: las diecinueve magnitudes de cada modelo, con una
            columna fija para el modelo elegido como comparación
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
                  onPin={handlePin}
                  onOpenPhoto={handleOpenPhoto}
                />
              )}
              {scrollableEntities.map((entity) => (
                <ModelHeaderCell
                  key={entity.id}
                  entity={entity}
                  isPinned={false}
                  photoView={photoView}
                  onPin={handlePin}
                  onOpenPhoto={handleOpenPhoto}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {BLOCKS.map((block) => (
              <Fragment key={block.id}>
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={columnCount}
                    className={styles.blockHeader}
                  >
                    {block.label}
                  </th>
                </tr>
                {block.fields.map((def) => (
                  <tr key={def.key}>
                    <th scope="row" className={styles.featureCell}>
                      {def.label}
                    </th>
                    {pinnedEntity && (
                      <td
                        className={[primitives.mono, styles.pinnedCell].join(
                          ' ',
                        )}
                      >
                        <span className={styles.cellLabel}>{def.label}</span>
                        <CellContent
                          cell={pinnedEntity.cells[def.key]}
                          def={def}
                        />
                      </td>
                    )}
                    {scrollableEntities.map((entity) => (
                      <td
                        key={entity.id}
                        className={[primitives.mono, styles.modelCell].join(
                          ' ',
                        )}
                      >
                        <span className={styles.cellLabel}>{def.label}</span>
                        <CellContent cell={entity.cells[def.key]} def={def} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.legend}>
        Cada columna es un modelo; márquela para fijarla como comparación
        —empieza fijado el Alfa Romeo Giulietta, el coche a sustituir—. El
        selector de arriba cambia qué vista de foto enseñan todas las columnas a
        la vez. La marca <EstimatedMark /> señala un dato estimado, sin fuente
        publicada verificada directamente.
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
              <span aria-hidden="true">×</span>
            </button>
          </>
        )}
      </dialog>
    </main>
  );
}
