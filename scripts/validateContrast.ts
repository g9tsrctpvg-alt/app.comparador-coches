/**
 * Comprueba el contraste WCAG de los pares de color declarados de la hoja
 * global de tokens (technical/0005, requisito 6.1).
 *
 * Hoy el contraste de la paleta está verificado a mano, una vez, en
 * `product/0009` (sección de contraste): `mute` y `signal` se oscurecieron
 * hasta llegar a 4,5:1 sobre `card` y `paper`. Nada impide que un token
 * nuevo —o un ajuste de uno existente— rompa esa garantía en silencio; este
 * validador la convierte en un gate mecánico, igual que
 * `validateStyleTokens.ts` hace con los literales fuera de la hoja de
 * tokens y `validateDocs.ts` con las specs.
 *
 * Solo se comprueban colores **opacos** (`#rrggbb`): un color con canal
 * alfa —`--color-accent-tint`, `--color-backdrop`— no tiene un contraste
 * fijo, depende de qué haya pintado debajo, así que no entra en la
 * comprobación de pares.
 *
 * Los pares no son todas las combinaciones posibles de tokens —la mayoría
 * no se dan nunca en pantalla, y comprobarlas todas convertiría el gate en
 * ruido—, sino los que la interfaz usa de verdad para texto. Cada uno
 * declara su propio umbral: 4,5:1 para texto normal (WCAG AA 1.4.3), o 3:1
 * para texto grande —`--font-size-lg` (18px) o más— (WCAG AA 1.4.3,
 * excepción de texto grande). `--color-ink-tertiary` solo se usa en texto
 * grande o en elementos no textuales (`global.css`, junto a su
 * declaración), así que sus pares entran con el umbral de 3:1.
 *
 * Sin E/S: recibe la hoja global ya leída, igual que el resto de
 * validadores del repositorio.
 */

export type ContrastLevel = 'normal' | 'large';

export interface ContrastPair {
  /** Nombre del token de color del texto, sin el prefijo `--color-`. */
  foreground: string;
  /** Nombre del token de color de fondo, sin el prefijo `--color-`. */
  background: string;
  level: ContrastLevel;
}

export interface ContrastValidationInput {
  globalStylesheet: string;
}

export interface ContrastValidationResult {
  errors: string[];
  checked: number;
}

const THRESHOLDS: Record<ContrastLevel, number> = {
  normal: 4.5,
  large: 3,
};

/**
 * Los pares que la interfaz pinta de verdad. `positive`/`negative`
 * comparten valor con `accent`/`signal` (technical/0005, requisito 1.6),
 * pero se declaran aparte: son un token distinto y una regresión podría
 * tocar uno sin tocar el otro.
 */
export const DECLARED_PAIRS: readonly ContrastPair[] = [
  { foreground: 'ink', background: 'paper', level: 'normal' },
  { foreground: 'ink', background: 'card', level: 'normal' },
  { foreground: 'ink', background: 'card-raised', level: 'normal' },
  { foreground: 'mute', background: 'paper', level: 'normal' },
  { foreground: 'mute', background: 'card', level: 'normal' },
  { foreground: 'accent', background: 'paper', level: 'normal' },
  { foreground: 'accent', background: 'card', level: 'normal' },
  { foreground: 'signal', background: 'paper', level: 'normal' },
  { foreground: 'signal', background: 'card', level: 'normal' },
  { foreground: 'positive', background: 'card', level: 'normal' },
  { foreground: 'negative', background: 'card', level: 'normal' },
  { foreground: 'mute-on-ink', background: 'ink', level: 'normal' },
  { foreground: 'ink-tertiary', background: 'paper', level: 'large' },
  { foreground: 'ink-tertiary', background: 'card', level: 'large' },

  /* Los seis colores de eje (technical/0011, requisito 6.1), cada uno sobre
   * las dos superficies donde se pinta. Entran al umbral estricto de 4,5:1
   * aunque hoy ninguno sirva texto pequeño: declararlos como texto normal
   * deja escrito el margen y hace que un retoque de tono que se lo coma
   * falle aquí en vez de en pantalla. El más justo es `axis-viaje` sobre
   * `paper`, a 4,77:1. */
  { foreground: 'axis-viaje', background: 'card', level: 'normal' },
  { foreground: 'axis-viaje', background: 'paper', level: 'normal' },
  { foreground: 'axis-diario', background: 'card', level: 'normal' },
  { foreground: 'axis-diario', background: 'paper', level: 'normal' },
  { foreground: 'axis-prestaciones', background: 'card', level: 'normal' },
  { foreground: 'axis-prestaciones', background: 'paper', level: 'normal' },
  { foreground: 'axis-fiabilidad', background: 'card', level: 'normal' },
  { foreground: 'axis-fiabilidad', background: 'paper', level: 'normal' },
  { foreground: 'axis-estetica', background: 'card', level: 'normal' },
  { foreground: 'axis-estetica', background: 'paper', level: 'normal' },
  { foreground: 'axis-coste', background: 'card', level: 'normal' },
  { foreground: 'axis-coste', background: 'paper', level: 'normal' },

  /* La cabecera tintada (technical/0012, requisito 1.2). Los tres colores que
   * de verdad se pintan sobre ella: la marca en `ink`, el destino activo del
   * conmutador en `accent` y los otros dos destinos en `mute`. */
  { foreground: 'ink', background: 'chrome', level: 'normal' },
  { foreground: 'accent', background: 'chrome', level: 'normal' },
  { foreground: 'mute', background: 'chrome', level: 'normal' },
];

const HEX_TOKEN_RE = /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g;

function parseHexColors(globalStylesheet: string): Map<string, string> {
  const colors = new Map<string, string>();
  for (const match of globalStylesheet.matchAll(HEX_TOKEN_RE)) {
    const [, name, hex] = match;
    if (name !== undefined && hex !== undefined) {
      colors.set(name, hex);
    }
  }
  return colors;
}

/** Componente sRGB (0-255) a su valor lineal, para la luminancia relativa
 * de la fórmula de contraste de WCAG 2.x. */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Relación de contraste de WCAG 2.x: (L1 + 0.05) / (L2 + 0.05), con L1 la
 * luminancia relativa más clara de las dos. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export function validateContrast(
  input: ContrastValidationInput,
): ContrastValidationResult {
  const errors: string[] = [];
  const colors = parseHexColors(input.globalStylesheet);

  for (const pair of DECLARED_PAIRS) {
    const foreground = colors.get(pair.foreground);
    const background = colors.get(pair.background);
    if (foreground === undefined) {
      errors.push(
        `no se encontró --color-${pair.foreground} en la hoja global`,
      );
      continue;
    }
    if (background === undefined) {
      errors.push(
        `no se encontró --color-${pair.background} en la hoja global`,
      );
      continue;
    }
    const ratio = contrastRatio(foreground, background);
    const threshold = THRESHOLDS[pair.level];
    if (ratio < threshold) {
      errors.push(
        `--color-${pair.foreground} sobre --color-${pair.background} da ` +
          `${ratio.toFixed(2)}:1, por debajo del umbral de ${threshold}:1 ` +
          `para texto ${pair.level === 'normal' ? 'normal' : 'grande'}`,
      );
    }
  }

  return { errors, checked: DECLARED_PAIRS.length };
}
