import { z } from 'zod';
import { GenerationSchema, SourcedNumberSchema, TechnologySchema } from './car';
import { PhotosSchema } from './photo';

/**
 * Un coche de referencia (product/0013, requisitos 3 y 4): el punto de
 * comparación de la ficha técnica, no un candidato. Comparte con
 * `CarSchema` la forma de los datos con fuente —`SourcedNumberSchema`—,
 * pero no su lista de campos: solo lleva identidad, tecnología, generación,
 * dimensiones y maletero, nada de lo que solo sirve para puntuar. Una lista
 * separada de `Reference` (no un booleano en `Car`) hace que pasarle una a
 * `scoreCatalog` sea un error de tipos, no un olvido posible en tiempo de
 * ejecución.
 *
 * `generation` es la única excepción deliberada a «solo dimensiones»
 * (product/0021): el coche de referencia existe para dar contexto, y de
 * cuándo es el coche contra el que se compara todo es precisamente eso.
 */
export const ReferenceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  technology: TechnologySchema,
  generation: GenerationSchema,
  lengthMm: SourcedNumberSchema,
  widthMm: SourcedNumberSchema,
  /**
   * Diámetro de giro entre bordillos (product/0032): la primera excepción
   * a «solo dimensiones» desde `generation`, y por el mismo motivo — sin
   * ella, la Δ de esta magnitud quedaría `'unavailable'` para los
   * dieciocho candidatos siempre que se comparen contra esta referencia.
   */
  turningCircleM: SourcedNumberSchema.optional(),
  heightMm: SourcedNumberSchema,
  groundClearanceMm: SourcedNumberSchema,
  trunkLiters: SourcedNumberSchema,
  /**
   * Carga dinámica máxima sobre el techo (product/0034): la misma
   * excepción a «solo dimensiones» que `turningCircleM`, y por el mismo
   * motivo — sin ella, la Δ de esta magnitud quedaría `'unavailable'` para
   * los candidatos siempre que se comparen contra esta referencia.
   */
  maxRoofLoadKg: SourcedNumberSchema.optional(),
  photos: PhotosSchema,
});
export type Reference = z.infer<typeof ReferenceSchema>;
