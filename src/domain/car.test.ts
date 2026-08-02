import { describe, expect, it } from 'vitest';
import { CarSchema } from './car';

const validCar = {
  id: 'kia-sportage-hev',
  name: 'Kia Sportage HEV',
  brand: 'Kia',
  technology: 'HEV',
  lengthMm: 4540,
  widthMm: 1865,
  heightMm: 1645,
  trunkLiters: 587,
  priceEur: 36000,
};

describe('CarSchema', () => {
  it('accepts a car with every field present and positive', () => {
    const result = CarSchema.safeParse(validCar);
    expect(result.success).toBe(true);
  });

  it('rejects a technology outside the declared enum', () => {
    const result = CarSchema.safeParse({ ...validCar, technology: 'DIESEL' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-positive dimension', () => {
    const result = CarSchema.safeParse({ ...validCar, trunkLiters: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects a missing required field', () => {
    const withoutId: Record<string, unknown> = { ...validCar };
    delete withoutId.id;
    const result = CarSchema.safeParse(withoutId);
    expect(result.success).toBe(false);
  });
});
