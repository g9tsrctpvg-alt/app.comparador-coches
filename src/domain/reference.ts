import { z } from 'zod';
import { SourcedNumberSchema, TechnologySchema } from './car';

/**
 * Un coche de referencia (product/0013, requisitos 3 y 4): el punto de
 * comparación de la ficha técnica, no un candidato. Comparte con
 * `CarSchema` la forma de los datos con fuente —`SourcedNumberSchema`—,
 * pero no su lista de campos: solo lleva identidad, tecnología, dimensiones
 * y maletero, nada de lo que solo sirve para puntuar. Una lista separada de
 * `Reference` (no un booleano en `Car`) hace que pasarle una a
 * `scoreCatalog` sea un error de tipos, no un olvido posible en tiempo de
 * ejecución.
 */
export const ReferenceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  technology: TechnologySchema,
  lengthMm: SourcedNumberSchema,
  widthMm: SourcedNumberSchema,
  heightMm: SourcedNumberSchema,
  groundClearanceMm: SourcedNumberSchema,
  trunkLiters: SourcedNumberSchema,
});
export type Reference = z.infer<typeof ReferenceSchema>;
