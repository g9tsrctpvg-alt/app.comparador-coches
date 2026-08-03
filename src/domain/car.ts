import { z } from 'zod';

export const SourceEntrySchema = z.object({
  label: z.string().min(1),
  value: z.union([z.number(), z.string()]),
  estimated: z.boolean(),
  current: z.boolean(),
  discardedReason: z.string().min(1).optional(),
});
export type SourceEntry = z.infer<typeof SourceEntrySchema>;

function sourcedValueSchema<Value extends z.ZodTypeAny>(valueSchema: Value) {
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

const SourcedNumberSchema = sourcedValueSchema(z.number());
export type SourcedNumber = {
  value: number;
  unit?: string;
  sources: SourceEntry[];
};

const UserRatingSchema = z.object({
  value: z.number().min(1).max(5),
  label: z.string().min(1),
});
export type UserRating = z.infer<typeof UserRatingSchema>;

export const TechnologySchema = z.enum(['ICE', 'MHEV', 'HEV', 'PHEV', 'EV']);
export type Technology = z.infer<typeof TechnologySchema>;

export const CarSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  technology: TechnologySchema,
  notes: z.array(z.string()).default([]),
  lengthMm: SourcedNumberSchema,
  widthMm: SourcedNumberSchema,
  heightMm: SourcedNumberSchema,
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
  residualPct5y: SourcedNumberSchema.optional(),
  aestheticsExterior: UserRatingSchema,
  aestheticsInterior: UserRatingSchema,
  travelComfort: UserRatingSchema,
});
export type Car = z.infer<typeof CarSchema>;
