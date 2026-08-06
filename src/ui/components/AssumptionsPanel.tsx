import type { GlobalAssumptions } from '../../domain/scoring/assumptions';

interface AssumptionsPanelProps {
  assumptions: GlobalAssumptions;
  onChange: (next: GlobalAssumptions) => void;
  budgetEur: number;
  onBudgetChange: (next: number) => void;
  hideOverBudget: boolean;
  onHideOverBudgetChange: (next: boolean) => void;
}

export function AssumptionsPanel({
  assumptions,
  onChange,
  budgetEur,
  onBudgetChange,
  hideOverBudget,
  onHideOverBudgetChange,
}: AssumptionsPanelProps) {
  function set<K extends keyof GlobalAssumptions>(
    key: K,
    value: GlobalAssumptions[K],
  ) {
    onChange({ ...assumptions, [key]: value });
  }

  return (
    <section aria-label="Supuestos globales">
      <h2>Supuestos globales</h2>
      <p>
        Se editan aquí, en un único sitio. Los desgloses por eje muestran el
        valor aplicado, pero no lo editan.
      </p>

      <label>
        Presupuesto máximo: {budgetEur.toLocaleString('es-ES')} €
        <input
          type="range"
          min={20000}
          max={100000}
          step={500}
          value={budgetEur}
          onChange={(event) => onBudgetChange(Number(event.target.value))}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={hideOverBudget}
          onChange={(event) => onHideOverBudgetChange(event.target.checked)}
        />
        Ocultar los que superan el presupuesto
      </label>

      <label>
        Km/año: {assumptions.kmPorAnio.toLocaleString('es-ES')}
        <input
          type="range"
          min={5000}
          max={40000}
          step={1000}
          value={assumptions.kmPorAnio}
          onChange={(event) => set('kmPorAnio', Number(event.target.value))}
        />
      </label>
      <label>
        €/litro: {assumptions.precioLitro.toFixed(2)}
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={assumptions.precioLitro}
          onChange={(event) => set('precioLitro', Number(event.target.value))}
        />
      </label>
      <label>
        €/kWh: {assumptions.precioKwh.toFixed(2)}
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.01}
          value={assumptions.precioKwh}
          onChange={(event) => set('precioKwh', Number(event.target.value))}
        />
      </label>
      <label>
        Mezcla estética (exterior/interior):{' '}
        {assumptions.mezclaEstetica.toFixed(1)}
        <input
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
      <label>
        Ponderación anchura en uso diario:{' '}
        {assumptions.ponderacionAnchoDiario.toFixed(1)}
        <input
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

      <label>
        <input
          type="checkbox"
          checked={assumptions.pensandoVender}
          onChange={(event) => set('pensandoVender', event.target.checked)}
        />
        Pienso venderlo (resta valor residual al coste)
      </label>
      <label>
        <input
          type="checkbox"
          checked={assumptions.cargaEnCasa}
          onChange={(event) => set('cargaEnCasa', event.target.checked)}
        />
        Tengo carga en casa
      </label>
    </section>
  );
}
