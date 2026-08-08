import { z } from 'zod';
import { PhotosSchema } from './photo';

export const SourceEntrySchema = z.object({
  label: z.string().min(1),
  value: z.union([z.number(), z.string()]),
  estimated: z.boolean(),
  current: z.boolean(),
  discardedReason: z.string().min(1).optional(),
});
export type SourceEntry = z.infer<typeof SourceEntrySchema>;

export function sourcedValueSchema<Value extends z.ZodTypeAny>(
  valueSchema: Value,
) {
  return z
    .object({
      value: valueSchema,
      unit: z.string().optional(),
      sources: z.array(SourceEntrySchema).min(1),
    })
    .superRefine((data, ctx) => {
      const current = data.sources.filter((s) => s.current);
      if (current.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `debe declarar exactamente una fuente vigente (hay ${current.length})`,
          path: ['sources'],
        });
        return;
      }
      // El chequeo de arriba ya garantiza current.length === 1.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- invariante comprobada arriba
      if (current[0]!.value !== data.value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'el valor no coincide con el de la fuente vigente',
          path: ['value'],
        });
      }
      if (data.sources.length > 1) {
        data.sources.forEach((source, index) => {
          if (!source.current && !source.discardedReason) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                'una fuente descartada debe declarar el motivo del descarte',
              path: ['sources', index, 'discardedReason'],
            });
          }
        });
      }
    });
}

export const SourcedNumberSchema = sourcedValueSchema(z.number());
export type SourcedNumber = {
  value: number;
  unit?: string;
  sources: SourceEntry[];
};

export const UserRatingSchema = z.object({
  value: z.number().min(1).max(5),
  label: z.string().min(1),
});
export type UserRating = z.infer<typeof UserRatingSchema>;

export const TechnologySchema = z.enum(['ICE', 'MHEV', 'HEV', 'PHEV', 'EV']);
export type Technology = z.infer<typeof TechnologySchema>;

/**
 * Extensión de garantía condicionada a mantenimiento en red oficial. Se
 * declara aparte de `warrantyYears` a propósito: `product/0007` puntúa solo
 * los años incondicionales, porque una extensión que se renueva servicio a
 * servicio es un compromiso del comprador, no del fabricante. Esta sección
 * es informativa y no entra en ninguna nota.
 */
export const WarrantyExtensionSchema = z.object({
  years: SourcedNumberSchema,
  kmLimit: SourcedNumberSchema.optional(),
  condition: z.string().min(1),
});
export type WarrantyExtension = {
  years: SourcedNumber;
  kmLimit?: SourcedNumber;
  condition: string;
};

export const CarSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  technology: TechnologySchema,
  notes: z.array(z.string()).default([]),
  published: z.boolean().default(true),
  lengthMm: SourcedNumberSchema,
  widthMm: SourcedNumberSchema,
  heightMm: SourcedNumberSchema,
  wheelbaseMm: SourcedNumberSchema,
  /**
   * Anchura interior de la segunda fila medida a la altura de los hombros
   * (product/0017). km77 la publica en centímetros enteros, así que la
   * resolución real es de 10 mm aunque se guarde en milímetros como el
   * resto de medidas.
   */
  rearShoulderWidthMm: SourcedNumberSchema,
  groundClearanceMm: SourcedNumberSchema,
  trunkLiters: SourcedNumberSchema,
  powerCv: SourcedNumberSchema,
  weightKg: SourcedNumberSchema,
  acceleration0to100: SourcedNumberSchema,
  consumption: SourcedNumberSchema,
  maintenanceEurYear: SourcedNumberSchema,
  priceEur: SourcedNumberSchema,
  reliabilityOcu: SourcedNumberSchema,
  warrantyYears: SourcedNumberSchema,
  warrantyExtension: WarrantyExtensionSchema.optional(),
  residualPct5y: SourcedNumberSchema.optional(),
  aestheticsExterior: UserRatingSchema,
  aestheticsInterior: UserRatingSchema,
  photos: PhotosSchema,
});
export type Car = z.infer<typeof CarSchema>;

/**
 * Los candidatos activos hoy (product/0015): `loadCatalog` sigue validando
 * y devolviendo *todos* los coches del fichero, publicados o no —un coche
 * oculto sigue siendo un dato real del catálogo—, así que el filtro vive
 * aquí, en un único sitio, para que ranking, ficha técnica, ficha completa
 * y la página de explicación no tengan cada una que acordarse de mirar
 * `published` por su cuenta.
 */
export function publishedCars(cars: Car[]): Car[] {
  return cars.filter((car) => car.published);
}
