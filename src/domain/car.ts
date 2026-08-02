import { z } from 'zod';

export const CarSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  technology: z.enum(['ICE', 'MHEV', 'HEV', 'PHEV', 'EV']),
  lengthMm: z.number().positive(),
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  trunkLiters: z.number().positive(),
  priceEur: z.number().positive(),
});

export type Car = z.infer<typeof CarSchema>;
