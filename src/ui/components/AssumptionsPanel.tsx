import type { GlobalAssumptions } from '../../domain/scoring/assumptions';
import primitives from '../primitives.module.css';
import { CollapsiblePanel } from './CollapsiblePanel';
import styles from './AssumptionsPanel.module.css';

interface AssumptionsPanelProps {
  assumptions: GlobalAssumptions;
  onChange: (next: GlobalAssumptions) => void;
  budgetEur: number;
  onBudgetChange: (next: number) => void;
}

export function AssumptionsPanel({
  assumptions,
  onChange,
  budgetEur,
  onBudgetChange,
}: AssumptionsPanelProps) {
  function set<K extends keyof GlobalAssumptions>(
    key: K,
    value: GlobalAssumptions[K],
  ) {
    onChange({ ...assumptions, [key]: value });
  }

  const summary = `Presupuesto ${budgetEur.toLocaleString('es-ES')} € · ${assumptions.kmPorAnio.toLocaleString('es-ES')} km/año`;

  return (
    <CollapsiblePanel
      ariaLabel="Supuestos globales"
      title="Supuestos de coste y presupuesto"
      summary={summary}
    >
      <p className={styles.intro}>
        Se editan aquí, en un único sitio. Los desgloses por eje muestran el
        valor aplicado, pero no lo editan.
      </p>

      <div className={styles.rows}>
        <label className={styles.row}>
          <span className={styles.top}>
            <span className={styles.assumptionName}>Presupuesto máximo</span>
            <span className={styles.value}>
              {budgetEur.toLocaleString('es-ES')} €
            </span>
          </span>
          <input
            className={styles.slider}
            type="range"
            min={20000}
            max={100000}
            step={500}
            value={budgetEur}
            onChange={(event) => onBudgetChange(Number(event.target.value))}
          />
        </label>
        <p className={primitives.secondaryText}>
          El presupuesto es también un imprescindible: se edita aquí o en el
          panel «Imprescindibles», sobre el mismo dato.
        </p>

        <label className={styles.row}>
          <span className={styles.top}>
            <span className={styles.assumptionName}>Km/año</span>
            <span className={styles.value}>
              {assumptions.kmPorAnio.toLocaleString('es-ES')}
            </span>
          </span>
          <input
            className={styles.slider}
            type="range"
            min={5000}
            max={40000}
            step={1000}
            value={assumptions.kmPorAnio}
            onChange={(event) => set('kmPorAnio', Number(event.target.value))}
          />
        </label>

        <label className={styles.row}>
          <span className={styles.top}>
            <span className={styles.assumptionName}>€/litro</span>
            <span className={styles.value}>
              {assumptions.precioLitro.toFixed(2)}
            </span>
          </span>
          <input
            className={styles.slider}
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={assumptions.precioLitro}
            onChange={(event) => set('precioLitro', Number(event.target.value))}
          />
        </label>

        <label className={styles.row}>
          <span className={styles.top}>
            <span className={styles.assumptionName}>€/kWh</span>
            <span className={styles.value}>
              {assumptions.precioKwh.toFixed(2)}
            </span>
          </span>
          <input
            className={styles.slider}
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={assumptions.precioKwh}
            onChange={(event) => set('precioKwh', Number(event.target.value))}
          />
        </label>

        <label className={styles.row}>
          <span className={styles.top}>
            <span className={styles.assumptionName}>
              Mezcla estética (exterior/interior)
            </span>
            <span className={styles.value}>
              {assumptions.mezclaEstetica.toFixed(1)}
            </span>
          </span>
          <input
            className={styles.slider}
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={assumptions.mezclaEstetica}
            onChange={(event) =>
              set('mezclaEstetica', Number(event.target.value))
            }
          />
        </label>

        <label className={styles.row}>
          <span className={styles.top}>
            <span className={styles.assumptionName}>
              Ponderación anchura en uso diario
            </span>
            <span className={styles.value}>
              {assumptions.ponderacionAnchoDiario.toFixed(1)}
            </span>
          </span>
          <input
            className={styles.slider}
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={assumptions.ponderacionAnchoDiario}
            onChange={(event) =>
              set('ponderacionAnchoDiario', Number(event.target.value))
            }
          />
        </label>

        <label className={primitives.checkboxRow}>
          <input
            type="checkbox"
            checked={assumptions.pensandoVender}
            onChange={(event) => set('pensandoVender', event.target.checked)}
          />
          Pienso venderlo (resta valor residual al coste)
        </label>
        <label className={primitives.checkboxRow}>
          <input
            type="checkbox"
            checked={assumptions.cargaEnCasa}
            onChange={(event) => set('cargaEnCasa', event.target.checked)}
          />
          Tengo carga en casa
        </label>
      </div>
    </CollapsiblePanel>
  );
}
