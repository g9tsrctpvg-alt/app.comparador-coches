/**
 * Comprueba a mano, bajo demanda, que cada URL de foto del catálogo
 * responde 2xx (product/0014, requisito 7). No entra en la CI obligatoria:
 * convertir un tercero en condición de merge importaría su disponibilidad a
 * este repositorio, justo lo que `docs/proceso/ci-y-guardarrailes.md` evita.
 *
 * Lee `cars.json` y `references.json` como JSON crudo, sin pasar por Zod:
 * este script no valida el catálogo, solo comprueba enlaces.
 */
import { readFileSync } from 'node:fs';

interface PhotoEntry {
  recordId: string;
  view: string;
  url: string;
}

const PHOTO_VIEWS = ['front', 'side', 'rear', 'trunk', 'interior'] as const;

function collectPhotoEntries(records: unknown[]): PhotoEntry[] {
  const entries: PhotoEntry[] = [];
  for (const record of records) {
    if (record === null || typeof record !== 'object') continue;
    const recordId =
      'id' in record && typeof record.id === 'string' ? record.id : '(sin id)';
    if (
      !('photos' in record) ||
      record.photos === null ||
      typeof record.photos !== 'object'
    ) {
      continue;
    }
    const photos = record.photos as Record<string, unknown>;
    for (const view of PHOTO_VIEWS) {
      const photo = photos[view];
      if (photo === null || typeof photo !== 'object') continue;
      if ('url' in photo && typeof photo.url === 'string') {
        entries.push({ recordId, view, url: photo.url });
      }
    }
  }
  return entries;
}

async function checkUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.status === 405 || response.status === 501) {
      // Algunos hosts no admiten HEAD: se repite con GET antes de dar la
      // URL por rota.
      const getResponse = await fetch(url, { method: 'GET' });
      return String(getResponse.status);
    }
    return String(response.status);
  } catch (err) {
    return `error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function main() {
  const dataDir = new URL('../src/data/', import.meta.url);
  const cars = JSON.parse(
    readFileSync(new URL('cars.json', dataDir), 'utf-8'),
  ) as unknown[];
  const references = JSON.parse(
    readFileSync(new URL('references.json', dataDir), 'utf-8'),
  ) as unknown[];

  const entries = collectPhotoEntries([...cars, ...references]);

  if (entries.length === 0) {
    console.log('No hay fotos declaradas en el catálogo que comprobar.');
    return;
  }

  console.log(`Comprobando ${entries.length} foto(s)...\n`);

  let failures = 0;
  for (const entry of entries) {
    const status = await checkUrl(entry.url);
    const ok = /^2\d\d$/.test(status);
    if (!ok) failures += 1;
    console.log(
      `${ok ? 'OK ' : 'FAIL'}  ${status.padEnd(12)} ${entry.recordId} / ${entry.view}  ${entry.url}`,
    );
  }

  console.log(
    `\n${entries.length - failures}/${entries.length} respondieron 2xx.`,
  );
  if (failures > 0) {
    process.exitCode = 1;
  }
}

await main();
