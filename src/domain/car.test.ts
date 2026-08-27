import { describe, expect, it } from 'vitest';
import { CarSchema, publishedCars, type Car } from './car';
import { sportageFixture } from './scoring/testFixtures';

function sourced(
  value: number,
  overrides: Partial<{ sources: unknown[] }> = {},
) {
  return {
    value,
    sources: overrides.sources ?? [
      {
        label: 'Especificación del proyecto (julio 2026)',
        value,
        estimated: false,
        current: true,
      },
    ],
  };
}

function rating(value: number) {
  return { value, label: 'Nota del usuario' };
}

const validCar = {
  id: 'kia-sportage-hev',
  name: 'Sportage HEV',
  brand: 'Kia',
  technology: 'HEV',
  generation: { launchYear: sourced(2021), code: 'NQ5' },
  notes: [],
  lengthMm: sourced(4540),
  widthMm: sourced(1865),
  wheelbaseMm: sourced(2680),
  rearShoulderWidthMm: sourced(1390),
  heightMm: sourced(1645),
  groundClearanceMm: sourced(170),
  trunkLiters: sourced(587),
  powerCv: sourced(239),
  weightKg: sourced(1620),
  acceleration0to100: sourced(7.9),
  consumption: sourced(6.2),
  maintenanceEurYear: sourced(400),
  priceEur: sourced(36000),
  reliabilityOcu: sourced(89),
  warrantyYears: sourced(7),
  residualPct5y: sourced(0.52),
  aestheticsExterior: rating(2),
  aestheticsInterior: rating(4),
};

describe('CarSchema', () => {
  it('accepts a fully populated car with single-source data', () => {
    const result = CarSchema.safeParse(validCar);
    expect(result.success).toBe(true);
  });

  it('accepts a car without the optional residual value', () => {
    const { residualPct5y: _residualPct5y, ...withoutResidual } = validCar;
    const result = CarSchema.safeParse(withoutResidual);
    expect(result.success).toBe(true);
  });

  it('accepts a warranty extension and keeps it separate from the unconditional years', () => {
    // product/0007 puntúa solo `warrantyYears`; la extensión es informativa y
    // no debe confundirse con ella. Un Toyota tiene 3 años incondicionales y
    // hasta 15 sujetos a mantenimiento en red oficial.
    const result = CarSchema.safeParse({
      ...validCar,
      warrantyYears: sourced(3),
      warrantyExtension: {
        years: sourced(15),
        kmLimit: sourced(250000),
        condition: 'Exige todos los mantenimientos en red oficial',
      },
    });
    expect(result.success).toBe(true);
    expect(result.data?.warrantyYears.value).toBe(3);
    expect(result.data?.warrantyExtension?.years.value).toBe(15);
  });

  it('rejects a warranty extension with no condition declared', () => {
    // Una extensión sin condición escrita es indistinguible de garantía
    // incondicional, que es justo lo que este campo existe para separar.
    const result = CarSchema.safeParse({
      ...validCar,
      warrantyExtension: { years: sourced(15), condition: '' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a sourced value whose top-level value does not match the current source', () => {
    const result = CarSchema.safeParse({
      ...validCar,
      trunkLiters: {
        value: 999,
        sources: [
          {
            label: 'Especificación del proyecto',
            value: 587,
            estimated: false,
            current: true,
          },
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a sourced value with no source marked current', () => {
    const result = CarSchema.safeParse({
      ...validCar,
      trunkLiters: {
        value: 587,
        sources: [
          {
            label: 'Especificación del proyecto',
            value: 587,
            estimated: false,
            current: false,
          },
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a sourced value with more than one source marked current', () => {
    const result = CarSchema.safeParse({
      ...validCar,
      trunkLiters: {
        value: 587,
        sources: [
          { label: 'Fuente A', value: 587, estimated: false, current: true },
          { label: 'Fuente B', value: 590, estimated: false, current: true },
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it('accepts multiple sources when exactly one is current and discards declare a reason', () => {
    const result = CarSchema.safeParse({
      ...validCar,
      trunkLiters: {
        value: 587,
        sources: [
          {
            label: 'Ficha oficial del fabricante',
            value: 620,
            estimated: false,
            current: false,
            discardedReason:
              'Medido hasta el techo, no hasta la bandeja (norma VDA).',
          },
          {
            label: 'Medición independiente km77',
            value: 587,
            estimated: false,
            current: true,
          },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects a discarded source with no discard reason when there is more than one source', () => {
    const result = CarSchema.safeParse({
      ...validCar,
      trunkLiters: {
        value: 587,
        sources: [
          {
            label: 'Ficha oficial del fabricante',
            value: 620,
            estimated: false,
            current: false,
          },
          {
            label: 'Medición independiente km77',
            value: 587,
            estimated: false,
            current: true,
          },
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a user rating outside the 1-5 range', () => {
    const result = CarSchema.safeParse({
      ...validCar,
      aestheticsInterior: rating(6),
    });
    expect(result.success).toBe(false);
  });

  it('rejects a technology outside the declared enum', () => {
    const result = CarSchema.safeParse({ ...validCar, technology: 'DIESEL' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing required field', () => {
    const withoutId: Record<string, unknown> = { ...validCar };
    delete withoutId.id;
    const result = CarSchema.safeParse(withoutId);
    expect(result.success).toBe(false);
  });

  it('defaults notes to an empty array when omitted', () => {
    const withoutNotes: Record<string, unknown> = { ...validCar };
    delete withoutNotes.notes;
    const result = CarSchema.safeParse(withoutNotes);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toEqual([]);
    }
  });

  it('defaults published to true when omitted (product/0015): no existing car changes state', () => {
    const withoutPublished: Record<string, unknown> = { ...validCar };
    delete withoutPublished.published;
    const result = CarSchema.safeParse(withoutPublished);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.published).toBe(true);
    }
  });

  it('accepts published: false explicitly', () => {
    const result = CarSchema.safeParse({ ...validCar, published: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.published).toBe(false);
    }
  });

  it('rejects a car with no generation declared (product/0021)', () => {
    const withoutGeneration: Record<string, unknown> = { ...validCar };
    delete withoutGeneration.generation;
    const result = CarSchema.safeParse(withoutGeneration);
    expect(result.success).toBe(false);
  });

  it('accepts a generation with only the launch year, no facelift or code', () => {
    const result = CarSchema.safeParse({
      ...validCar,
      generation: { launchYear: sourced(2021) },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a facelift year equal to the launch year', () => {
    const result = CarSchema.safeParse({
      ...validCar,
      generation: {
        launchYear: sourced(2021),
        faceliftYear: sourced(2021),
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects a facelift year earlier than the launch year', () => {
    const result = CarSchema.safeParse({
      ...validCar,
      generation: {
        launchYear: sourced(2021),
        faceliftYear: sourced(2020),
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('CarSchema, magnitudes de electrificación (product/0028)', () => {
  const range = sourced(510);
  const battery = sourced(65.4);

  const plugIn = {
    ...validCar,
    technology: 'EV',
    electricRangeKm: range,
    batteryKwh: battery,
  };

  it('accepts a plug-in that declares both magnitudes', () => {
    expect(CarSchema.safeParse(plugIn).success).toBe(true);
    expect(CarSchema.safeParse({ ...plugIn, technology: 'PHEV' }).success).toBe(
      true,
    );
  });

  it.each(['EV', 'PHEV'] as const)(
    'rejects a %s that does not declare the electric range, naming the field',
    (technology) => {
      const { electricRangeKm: _range, ...withoutRange } = plugIn;
      const result = CarSchema.safeParse({ ...withoutRange, technology });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (candidate) => candidate.path[0] === 'electricRangeKm',
        );
        expect(issue?.message).toBe(
          `un ${technology} debe declarar la autonomía eléctrica`,
        );
      }
    },
  );

  it.each(['EV', 'PHEV'] as const)(
    'rejects a %s that does not declare the battery capacity, naming the field',
    (technology) => {
      const { batteryKwh: _battery, ...withoutBattery } = plugIn;
      const result = CarSchema.safeParse({ ...withoutBattery, technology });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (candidate) => candidate.path[0] === 'batteryKwh',
        );
        expect(issue?.message).toBe(
          `un ${technology} debe declarar la capacidad de la batería`,
        );
      }
    },
  );

  it('rejects an ICE that declares either magnitude: no le aplica', () => {
    const rangeResult = CarSchema.safeParse({
      ...validCar,
      technology: 'ICE',
      electricRangeKm: range,
    });
    expect(rangeResult.success).toBe(false);
    if (!rangeResult.success) {
      expect(rangeResult.error.issues[0]?.message).toBe(
        'un ICE no puede declarar la autonomía eléctrica: no le aplica',
      );
    }

    const batteryResult = CarSchema.safeParse({
      ...validCar,
      technology: 'ICE',
      batteryKwh: battery,
    });
    expect(batteryResult.success).toBe(false);
    if (!batteryResult.success) {
      expect(batteryResult.error.issues[0]?.message).toBe(
        'un ICE no puede declarar la capacidad de la batería: no le aplica',
      );
    }
  });

  it('accepts an ICE that declares neither', () => {
    expect(
      CarSchema.safeParse({ ...validCar, technology: 'ICE' }).success,
    ).toBe(true);
  });

  it.each(['HEV', 'MHEV'] as const)(
    'leaves both magnitudes genuinely optional on a %s: with both, with one and with none',
    (technology) => {
      const base = { ...validCar, technology };
      expect(CarSchema.safeParse(base).success).toBe(true);
      expect(
        CarSchema.safeParse({ ...base, batteryKwh: sourced(1.32) }).success,
      ).toBe(true);
      expect(
        CarSchema.safeParse({ ...base, electricRangeKm: sourced(2) }).success,
      ).toBe(true);
      expect(
        CarSchema.safeParse({
          ...base,
          electricRangeKm: sourced(2),
          batteryKwh: sourced(1.32),
        }).success,
      ).toBe(true);
    },
  );
});

describe('publishedCars', () => {
  function carWith(id: string, published: boolean): Car {
    return { ...sportageFixture, id, published };
  }

  it('keeps every car when none are unpublished', () => {
    const cars = [carWith('a', true), carWith('b', true)];
    expect(publishedCars(cars)).toEqual(cars);
  });

  it('drops exactly the unpublished cars, keeping the rest in order', () => {
    const a = carWith('a', true);
    const b = carWith('b', false);
    const c = carWith('c', true);
    expect(publishedCars([a, b, c])).toEqual([a, c]);
  });

  it('returns an empty list when every car is unpublished', () => {
    const cars = [carWith('a', false), carWith('b', false)];
    expect(publishedCars(cars)).toEqual([]);
  });
});
