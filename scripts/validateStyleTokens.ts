/**
 * Comprueba que ningún `.module.css` de `src/ui/` cuele un literal de
 * diseño fuera de la hoja global de tokens (technical/0004, requisito 13).
 *
 * Dos reglas, porque una media query no puede leer una custom property:
 *
 * 1. Fuera de la condición de un `@media`, ningún módulo contiene un color
 *    hexadecimal, `rgb(`, `hsl(`, una longitud en `px`/`rem`, ni el nombre
 *    de una pila tipográfica (`monospace`, `system-ui`, `sans-serif`): todo
 *    eso sale de `var(--…)`.
 * 2. Dentro de la condición de un `@media`, un ancho en `px`/`rem` está
 *    permitido, pero solo si equivale al valor de un token `--bp-*`
 *    declarado en la hoja global — es la única forma de comparar un número
 *    que CSS no deja escribir como variable ahí.
 *
 * Sin E/S, igual que `validateDocs.ts`: recibe los ficheros ya leídos.
 */

export interface StyleValidationInput {
  /** Ruta relativa al repositorio → contenido crudo del `.module.css`. */
  modules: Record<string, string>;
  /** Contenido crudo de la hoja global de tokens. */
  globalStylesheet: string;
}

export interface StyleValidationResult {
  errors: string[];
  checked: number;
}

const HEX_COLOR_RE = /#[0-9a-fA-F]{3,8}\b/g;
const FUNCTIONAL_COLOR_RE = /\b(rgb|hsl)a?\(/g;
const LENGTH_RE = /(?<![\w.-])(\d+(?:\.\d+)?)(px|rem)\b/g;
const FONT_KEYWORD_RE = /\b(monospace|system-ui|sans-serif)\b/g;
const MEDIA_PRELUDE_RE = /@media\s+([^{]+)\{/g;
const BP_TOKEN_RE = /--bp-[a-z0-9-]+:\s*(\d+(?:\.\d+)?)(px|rem)/gi;
const COMMENT_RE = /\/\*[\s\S]*?\*\//g;

/** Un comentario CSS puede citar un valor —«3px bajo cada fila»— sin ser una
 * declaración; se vacía antes de buscar literales, conservando la longitud
 * del fichero para que las posiciones del resto de reglas no se muevan. */
function blankComments(css: string): string {
  return css.replace(COMMENT_RE, (match) => ' '.repeat(match.length));
}

const REM_TO_PX = 16;

function toPx(value: number, unit: string): number {
  return unit === 'rem' ? value * REM_TO_PX : value;
}

/** Las dos capturas de un `RegExpMatchArray` de longitud siempre están
 * presentes cuando hay match: la propia expresión regular las exige. Esta
 * función solo hace explícito ante TypeScript lo que la regex ya garantiza. */
function lengthOf(match: RegExpMatchArray): number {
  const [, digits, unit] = match;
  if (!digits || !unit) {
    throw new Error(`Match de longitud sin capturas: «${match[0]}»`);
  }
  return toPx(Number(digits), unit);
}

function declaredBreakpointsPx(globalStylesheet: string): number[] {
  const values: number[] = [];
  for (const match of globalStylesheet.matchAll(BP_TOKEN_RE)) {
    values.push(lengthOf(match));
  }
  return values;
}

function checkMediaPreludes(
  path: string,
  css: string,
  breakpointsPx: number[],
  errors: string[],
): string {
  return css.replace(MEDIA_PRELUDE_RE, (whole, prelude: string) => {
    for (const lengthMatch of prelude.matchAll(LENGTH_RE)) {
      const px = lengthOf(lengthMatch);
      const matches = breakpointsPx.some((bp) => Math.abs(bp - px) < 0.01);
      if (!matches) {
        errors.push(
          `${path}: la media query «${prelude.trim()}» usa ${lengthMatch[0]}, ` +
            `que no corresponde a ningún token --bp-* declarado`,
        );
      }
    }
    // Se vacía el preludio para que el resto de comprobaciones no lo
    // vuelva a mirar como si fuera una declaración normal, conservando la
    // llave de apertura para no romper el resto del fichero.
    return whole.replace(prelude, '');
  });
}

function checkNoLiteralsOutsideMedia(
  path: string,
  css: string,
  errors: string[],
): void {
  for (const [pattern, what] of [
    [HEX_COLOR_RE, 'un color hexadecimal'],
    [FUNCTIONAL_COLOR_RE, 'un color funcional (rgb()/hsl())'],
    [LENGTH_RE, 'una longitud literal en px o rem'],
    [FONT_KEYWORD_RE, 'el nombre de una pila tipográfica'],
  ] as const) {
    for (const match of css.matchAll(pattern)) {
      errors.push(
        `${path}: contiene ${what} («${match[0]}») fuera de la hoja global`,
      );
    }
  }
}

export function validateStyleTokens(
  input: StyleValidationInput,
): StyleValidationResult {
  const errors: string[] = [];
  const breakpointsPx = declaredBreakpointsPx(input.globalStylesheet);

  for (const [path, rawCss] of Object.entries(input.modules)) {
    const css = blankComments(rawCss);
    const withoutMediaPreludes = checkMediaPreludes(
      path,
      css,
      breakpointsPx,
      errors,
    );
    checkNoLiteralsOutsideMedia(path, withoutMediaPreludes, errors);
  }

  return { errors, checked: Object.keys(input.modules).length };
}
