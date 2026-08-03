import { UserRatingSchema, type Car } from '../car';
import type { EditableRatingField } from './breakdown';

/** Las valoraciones que el usuario ha sobrescrito para un coche concreto. */
export type RatingOverride = Partial<Record<EditableRatingField, number>>;

export class InvalidRatingOverrideError extends Error {}

const EDITABLE_FIELDS: EditableRatingField[] = [
  'aestheticsExterior',
  'aestheticsInterior',
  'travelComfort',
];

/**
 * Aplica las valoraciones sobrescritas sobre un coche del catálogo.
 *
 * El rango 1-5 lo declara `UserRatingSchema` y solo se comprobaba al cargar
 * el catálogo; un override entraba al cálculo sin pasar por él. Aquí se
 * revalida: la cota es del dominio, no del `<input type="range">` que hoy
 * resulta ser el único que la respeta.
 */
export function applyOverride(
  car: Car,
  override: RatingOverride | undefined,
): Car {
  if (!override) return car;

  const result = { ...car };
  for (const field of EDITABLE_FIELDS) {
    const value = override[field];
    if (value === undefined) continue;

    const candidate = { ...car[field], value };
    const parsed = UserRatingSchema.safeParse(candidate);
    if (!parsed.success) {
      throw new InvalidRatingOverrideError(
        `Valoración «${field}» inválida para «${car.id}»: ${value} está fuera del rango permitido`,
      );
    }
    result[field] = parsed.data;
  }
  return result;
}
