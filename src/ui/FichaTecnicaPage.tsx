import { Fragment, useMemo } from 'react';
import type { Car } from '../domain/car';
import type { Reference } from '../domain/reference';
import {
  buildTechnicalSheet,
  type TechnicalSheetDelta,
  type TechnicalSheetDimension,
  type TechnicalSheetRow,
} from '../domain/technicalSheet';
import { formatNumber, formatSigned } from './format';
import { TECHNOLOGY_LABELS } from './technologyLabels';
import { EstimatedMark } from './components/EstimatedMark';
import { ViewSwitcher } from './components/ViewSwitcher';
import { EXPLICACION_HASH } from './useHashRoute';
import primitives from './primitives.module.css';
import styles from './FichaTecnicaPage.module.css';

interface FichaTecnicaPageProps {
  cars: Car[];
  references: Reference[];
}

type DimensionField =
  'lengthMm' | 'widthMm' | 'heightMm' | 'groundClearanceMm' | 'trunkLiters';

const DIMENSION_COLUMNS: {
  field: DimensionField;
  label: string;
  unit: string;
}[] = [
  { field: 'lengthMm', label: 'Longitud', unit: 'mm' },
  { field: 'widthMm', label: 'Anchura', unit: 'mm' },
  { field: 'heightMm', label: 'Altura', unit: 'mm' },
  { field: 'groundClearanceMm', label: 'Altura libre al suelo', unit: 'mm' },
  { field: 'trunkLiters', label: 'Maletero', unit: 'L' },
];

function directionClass(direction: TechnicalSheetDelta['direction']): string {
  if (direction === 'better') return styles.deltaBetter ?? '';
  if (direction === 'worse') return styles.deltaWorse ?? '';
  return styles.deltaNeutral ?? '';
}

function DeltaCell({
  delta,
  emphasized,
}: {
  delta: TechnicalSheetDelta | null;
  emphasized: boolean;
}) {
  if (delta === null) {
    return (
      <td className={styles.delta}>
        <span className={primitives.visuallyHidden}>
          Sin diferencia que mostrar.
        </span>
        <span aria-hidden="true">—</span>
      </td>
    );
  }
  return (
    <td
      className={[
        styles.delta,
        directionClass(delta.direction),
        emphasized ? styles.deltaEmphasized : '',
      ].join(' ')}
    >
      {formatSigned(delta.value, 0)}
    </td>
  );
}

function DimensionValueCell({
  dimension,
  unit,
}: {
  dimension: TechnicalSheetDimension;
  unit: string;
}) {
  return (
    <td className={primitives.mono}>
      {formatNumber(dimension.valueMm, 0)} {unit}
      {dimension.estimated && <EstimatedMark />}
    </td>
  );
}

function SheetRow({ row }: { row: TechnicalSheetRow }) {
  return (
    <tr className={row.kind === 'reference' ? styles.referenceRow : undefined}>
      <th scope="row" className={styles.modelCell}>
        {row.name}
        {row.kind === 'reference' && (
          <span className={styles.referenceTag}>Referencia</span>
        )}
      </th>
      <td>{TECHNOLOGY_LABELS[row.technology]}</td>
      {DIMENSION_COLUMNS.map(({ field, unit }) => (
        <Fragment key={field}>
          <DimensionValueCell dimension={row[field]} unit={unit} />
          <DeltaCell
            delta={row[field].delta}
            emphasized={field === 'widthMm'}
          />
        </Fragment>
      ))}
      <td className={primitives.mono}>
        {formatNumber(row.litersPerSquareMeter.value, 1)} L/m²
        {row.litersPerSquareMeter.estimated && <EstimatedMark />}
      </td>
    </tr>
  );
}

/**
 * La ficha técnica comparada (product/0013): una tabla, no un ranking. Cada
 * dato dimensional lleva al lado su Δ frente a la referencia vigente —hoy el
 * Alfa Romeo Giulietta—, calculado en `src/domain/technicalSheet.ts` para
 * que aquí no se divida ni se multiplique nada (`ui-no-scoring-internals`).
 */
export function FichaTecnicaPage({ cars, references }: FichaTecnicaPageProps) {
  const rows = useMemo(
    () => buildTechnicalSheet(cars, references),
    [cars, references],
  );

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Comparador de coches</h1>
      <ViewSwitcher route="ficha-tecnica" />
      <a href={EXPLICACION_HASH} className={styles.explainLink}>
        Cómo se calcula todo →
      </a>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <caption className={primitives.visuallyHidden}>
            Ficha técnica comparada: dimensiones de cada candidato y su
            diferencia frente a la referencia
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles.modelHeader}>
                Modelo
              </th>
              <th scope="col">Tecnología</th>
              {DIMENSION_COLUMNS.map(({ field, label, unit }) => (
                <Fragment key={field}>
                  <th scope="col">
                    {label} ({unit})
                  </th>
                  <th scope="col">Δ {label.toLowerCase()}</th>
                </Fragment>
              ))}
              <th scope="col">L/m²</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <SheetRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.legend}>
        <strong>Δ</strong> es la diferencia con la fila de referencia, siempre
        con su signo escrito: el color no es el único portador del signo. En
        maletero, más es mejor; en anchura y longitud, más es peor, porque el
        problema que resuelve el proyecto es que los sustitutos son más grandes.
        Altura y altura libre al suelo no tienen una dirección declarada, así
        que su Δ no lleva juicio de color. La columna de anchura va en negrita:
        es la prioridad declarada del proyecto. <strong>L/m²</strong> son los
        litros de maletero por cada metro cuadrado de huella en el suelo —cuanto
        más alto, mejor aprovechado está el espacio—. La marca <EstimatedMark />{' '}
        señala un dato estimado, sin fuente publicada verificada directamente.
      </p>
    </main>
  );
}
