import { z } from 'zod';

export const PHOTO_VIEWS = [
  'front',
  'side',
  'rear',
  'trunk',
  'interior',
] as const;
export type PhotoView = (typeof PHOTO_VIEWS)[number];

/**
 * Una foto no se estima ni compite con otra medición de sí misma —el
 * problema que resuelve `sourcedValueSchema`—, así que no lo reutiliza
 * (product/0014, requisito 2). Lo que sí necesita, y ninguna magnitud
 * numérica necesita, es de quién es la imagen y qué versión enseña:
 * `shows` existe porque el CR-V puntuado es la HEV 4x4 y el Corolla Cross
 * el 140H, y una foto de otro acabado enseñaría un coche que no es ese.
 */
export const PhotoSchema = z.object({
  url: z.string().url().startsWith('https://'),
  credit: z.string().min(1),
  shows: z.string().min(1),
});
export type Photo = z.infer<typeof PhotoSchema>;

export const PhotosSchema = z
  .object({
    front: PhotoSchema.optional(),
    side: PhotoSchema.optional(),
    rear: PhotoSchema.optional(),
    trunk: PhotoSchema.optional(),
    interior: PhotoSchema.optional(),
  })
  .default({});
export type Photos = z.infer<typeof PhotosSchema>;

/**
 * Punto único de resolución de la URL servida (product/0014, requisito 2):
 * hoy las imágenes se enlazan tal cual. Copiarlas al propio despliegue más
 * adelante sería cambiar esta función y nada más, sin tocar ni un
 * componente de `src/ui/`.
 */
export function photoSrc(photo: Photo): string {
  return photo.url;
}
