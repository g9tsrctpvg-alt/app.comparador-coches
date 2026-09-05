/**
 * Comprueba las invariantes mecánicas de specs y ADRs.
 *
 * Codifica las reglas comprobables de `docs/proceso/ciclo-de-spec.md` y
 * `docs/proceso/consolidacion.md`. Los juicios —¿el alcance es claro?, ¿los
 * criterios de aceptación son de verdad verificables?— siguen siendo humanos
 * y no se comprueban aquí.
 *
 * Sin E/S: recibe los documentos ya leídos. Así las reglas se prueban con
 * fixtures y no dependen de lo que haya hoy en el repositorio.
 *
 * ## Inventario de condiciones de error
 *
 * Comunes a specs y ADRs:
 *  1. Falta un campo de cabecera obligatorio.
 *  2. `Estado` desconocido.
 *  3. `Fecha` que no es AAAA-MM-DD.
 *  4. El documento no empieza por un encabezado de nivel 1.
 *
 * Solo specs:
 *  5. `Tipo` que no concuerda con la carpeta.
 *  6. `Id` que no es `<carpeta>/<NNNN>`.
 *  7. `Contexto` vacío.
 *  8. Estado que exige criterios de aceptación y no hay ninguno.
 *  9. Estado que exige `Decisiones abiertas` cerradas y no lo están.
 * 10. Estado que exige `Doc de estado` y no lo declara.
 * 11. `implemented` o `verified` sin el aviso A.
 * 12. `consolidated` sin el aviso B.
 * 13. `consolidated` que conserva el aviso A.
 * 14. `draft` o `approved` con un aviso histórico.
 * 15. `closed` sin el aviso C.
 * 16. `closed` que conserva el aviso A o el B.
 * 17. El aviso C en un estado que no es `closed`.
 *
 * Solo ADRs:
 * 18. `Nivel` que no es 🟢, 🟡 ni 🔴.
 * 19. Una de sus cinco secciones obligatorias, vacía.
 *
 * De conjunto:
 * 20. Nombre de fichero que no es `NNNN-titulo-en-kebab-case.md`.
 * 21. Número ya usado por otro documento de la misma carpeta.
 * 22. Falta un directorio de specs.
 * 23. Falta una plantilla.
 */

export type SpecKind = 'product' | 'technical';

export interface ValidationInput {
  /** Ruta relativa al repositorio → texto crudo del documento. */
  documents: Record<string, string>;
  /** Directorios que existen, en ruta relativa al repositorio. */
  directories: readonly string[];
}

export interface ValidationResult {
  errors: string[];
  checked: number;
}

const FILENAME_RE = /^(\d{4})-[a-z0-9]+(-[a-z0-9]+)*\.md$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FIELD_RE = /^-\s+\*\*([^:*]+):\*\*\s*(.*?)\s*$/;
const CRITERION_RE = /^\s*-\s*\[[ xX]\]\s*\S/m;
const NOTHING_RE = /^(ningun[ao]|none)\s*[.．]?$/i;
const HEADING_RE = /^##\s+(.*?)\s*$/;

const SPEC_STATES = [
  'draft',
  'approved',
  'implemented',
  'verified',
  'consolidated',
  'closed',
  'superseded',
] as const;
const ADR_STATES = ['draft', 'approved', 'superseded', 'rejected'] as const;
const ADR_LEVELS: readonly string[] = ['🟢', '🟡', '🔴'];

const SPEC_FIELDS = [
  'Id',
  'Estado',
  'Tipo',
  'Fecha',
  'Specs relacionadas',
  'ADRs relacionados',
  'Doc de estado',
] as const;
const ADR_FIELDS = ['Estado', 'Fecha', 'Nivel'] as const;

/** Estados en los que la spec ya no describe el sistema vigente. */
const STATES_NEEDING_CRITERIA = [
  'approved',
  'implemented',
  'verified',
  'consolidated',
  'closed',
];

const NOTICE_A = '**Spec histórica — implementada, sin consolidar.**';
const NOTICE_B = '**Spec consolidada (';
/**
 * El aviso del estado terminal del ADR 0013: la spec no llegó a `verified`
 * y no lo va a hacer, así que sus criterios sin marcar siguen sin marcar y
 * cada uno tiene su destino escrito fuera.
 *
 * Exige una **fecha real**, y no basta el prefijo como en los avisos A y B,
 * porque `technical/0014` —la spec que introduce este aviso— lo transcribe
 * literalmente con el marcador `(AAAA-MM-DD)` para poder implementarlo. Sin
 * la fecha, esa transcripción haría fallar a la spec que define la regla.
 */
const NOTICE_C_RE =
  /\*\*Spec cerrada sin verificar \(\d{4}-\d{2}-\d{2}\)\.\*\*/;

const ADR_SECTIONS = [
  'Contexto',
  'Decisión',
  'Alternativas consideradas',
  'Consecuencias',
  // ADR 0005: un ADR describe lo que rige hoy y se corrige en su sitio, así
  // que cada corrección deja aquí una entrada fechada.
  'Historial',
];

const SPEC_DIRS: Record<SpecKind, string> = {
  product: 'specs/product',
  technical: 'specs/technical',
};
const ADR_DIR = 'docs/decisions';
const TEMPLATES = ['specs/TEMPLATE.md', `${ADR_DIR}/TEMPLATE.md`];

/** Lee el bloque de cabecera `- **Clave:** valor` del principio del documento. */
export function parseFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) break;
    const match = FIELD_RE.exec(line);
    if (match) {
      const [, key, value] = match;
      if (key !== undefined && value !== undefined) {
        fields[key.trim()] = value.trim();
      }
    }
  }
  return fields;
}

/**
 * Devuelve el cuerpo de una sección `## título`, o `undefined` si no existe.
 * Un encabezado `###` no abre sección: pertenece al cuerpo de la suya.
 */
export function section(text: string, title: string): string | undefined {
  const lines = text.split('\n');
  const body: string[] = [];
  let inside = false;

  for (const line of lines) {
    const heading = HEADING_RE.exec(line);
    if (heading) {
      if (inside) break;
      if (heading[1] === title) {
        inside = true;
        continue;
      }
    }
    if (inside) body.push(line);
  }
  return inside ? body.join('\n') : undefined;
}

/** Líneas con contenido de una sección, ignorando blancos y citas. */
function meaningfulLines(body: string | undefined): string[] {
  if (body === undefined) return [];
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('>'));
}

/** Una sección está vacía cuando no tiene texto más allá de las citas. */
function isBlank(body: string | undefined): boolean {
  return meaningfulLines(body).length === 0;
}

/**
 * Cierto cuando la sección está vacía o dice explícitamente que no tiene
 * entradas. Escribir «Ninguna.» es más claro que dejarla en blanco, que se
 * lee igual que haberla olvidado. Las dos cuentan como nada pendiente.
 */
function declaresNothing(body: string | undefined): boolean {
  const lines = meaningfulLines(body);
  if (lines.length === 0) return true;
  if (lines.length > 1) return false;
  const only = lines[0];
  return only !== undefined && NOTHING_RE.test(only);
}

function checkCommon(
  rel: string,
  text: string,
  fields: Record<string, string>,
  required: readonly string[],
  states: readonly string[],
  errors: string[],
): void {
  for (const field of required) {
    if (!(field in fields)) {
      errors.push(`${rel}: missing header field '${field}'`);
    }
  }
  const estado = fields['Estado'] ?? '';
  if (estado !== '' && !states.includes(estado)) {
    errors.push(`${rel}: unknown Estado '${estado}'`);
  }
  const fecha = fields['Fecha'] ?? '';
  if (fecha !== '' && !DATE_RE.test(fecha)) {
    errors.push(`${rel}: Fecha '${fecha}' is not AAAA-MM-DD`);
  }
  if (!text.trimStart().startsWith('# ')) {
    errors.push(`${rel}: must start with a level-1 heading`);
  }
}

function checkSpec(
  rel: string,
  fileName: string,
  kind: SpecKind,
  text: string,
  errors: string[],
): void {
  const fields = parseFields(text);
  checkCommon(rel, text, fields, SPEC_FIELDS, SPEC_STATES, errors);

  const number = fileName.slice(0, 4);
  const tipo = fields['Tipo'] ?? '';
  if (tipo !== '' && tipo !== kind) {
    errors.push(`${rel}: Tipo '${tipo}' does not match folder '${kind}'`);
  }
  const expectedId = `${kind}/${number}`;
  if ((fields['Id'] ?? '') !== expectedId) {
    errors.push(`${rel}: Id must be '${expectedId}'`);
  }
  if (isBlank(section(text, 'Contexto'))) {
    errors.push(`${rel}: 'Contexto' is empty`);
  }

  const estado = fields['Estado'] ?? '';
  if (STATES_NEEDING_CRITERIA.includes(estado)) {
    const criteria = section(text, 'Criterios de aceptación') ?? '';
    if (!CRITERION_RE.test(criteria)) {
      errors.push(
        `${rel}: Estado '${estado}' requires at least one acceptance criterion`,
      );
    }
    if (!declaresNothing(section(text, 'Decisiones abiertas'))) {
      errors.push(
        `${rel}: Estado '${estado}' requires 'Decisiones abiertas' to be empty or to say so explicitly`,
      );
    }
    if ((fields['Doc de estado'] ?? '') === '') {
      errors.push(`${rel}: Estado '${estado}' requires 'Doc de estado'`);
    }
  }

  const hasA = text.includes(NOTICE_A);
  const hasB = text.includes(NOTICE_B);
  const hasC = NOTICE_C_RE.test(text);
  if ((estado === 'implemented' || estado === 'verified') && !hasA) {
    errors.push(`${rel}: Estado '${estado}' requires notice A`);
  }
  if (estado === 'consolidated') {
    if (!hasB) {
      errors.push(`${rel}: Estado 'consolidated' requires notice B`);
    }
    if (hasA) {
      errors.push(
        `${rel}: notice A must be replaced by notice B on consolidation`,
      );
    }
  }
  // El aviso C es excluyente con los otros dos (technical/0014, requisito
  // 2.2): una spec lleva exactamente uno, y el que corresponde a su estado.
  if (estado === 'closed') {
    if (!hasC) {
      errors.push(`${rel}: Estado 'closed' requires notice C`);
    }
    if (hasA || hasB) {
      errors.push(
        `${rel}: notice A or B must be replaced by notice C on closing`,
      );
    }
  } else if (hasC) {
    errors.push(`${rel}: notice C belongs to Estado 'closed' only`);
  }
  if ((estado === 'draft' || estado === 'approved') && (hasA || hasB)) {
    errors.push(`${rel}: Estado '${estado}' must carry no historic notice`);
  }
}

function checkAdr(rel: string, text: string, errors: string[]): void {
  const fields = parseFields(text);
  checkCommon(rel, text, fields, ADR_FIELDS, ADR_STATES, errors);

  const nivel = fields['Nivel'] ?? '';
  if (nivel !== '' && !ADR_LEVELS.includes(nivel)) {
    errors.push(`${rel}: Nivel must be one of ${ADR_LEVELS.join(' ')}`);
  }
  for (const title of ADR_SECTIONS) {
    if (isBlank(section(text, title))) {
      errors.push(`${rel}: '${title}' is empty`);
    }
  }
}

/** Documentos numerados de un directorio, comprobando las reglas de nombre. */
function collect(
  directory: string,
  documents: Record<string, string>,
  errors: string[],
): string[] {
  const collected: string[] = [];
  const seen = new Map<string, string>();

  const paths = Object.keys(documents)
    .filter((path) => path.startsWith(`${directory}/`))
    .filter((path) => !path.slice(directory.length + 1).includes('/'))
    .sort();

  for (const rel of paths) {
    const fileName = rel.slice(directory.length + 1);
    if (fileName === 'TEMPLATE.md') continue;

    const match = FILENAME_RE.exec(fileName);
    if (!match) {
      errors.push(`${rel}: name must be NNNN-titulo-en-kebab-case.md`);
      continue;
    }
    const number = match[1];
    if (number === undefined) continue;
    const previous = seen.get(number);
    if (previous !== undefined) {
      errors.push(`${rel}: number ${number} already used by ${previous}`);
      continue;
    }
    seen.set(number, rel);
    collected.push(rel);
  }
  return collected;
}

export function validateDocs(input: ValidationInput): ValidationResult {
  const { documents, directories } = input;
  const errors: string[] = [];
  let checked = 0;

  for (const [kind, directory] of Object.entries(SPEC_DIRS) as [
    SpecKind,
    string,
  ][]) {
    if (!directories.includes(directory)) {
      errors.push(`missing directory: ${directory}`);
      continue;
    }
    for (const rel of collect(directory, documents, errors)) {
      const text = documents[rel];
      if (text === undefined) continue;
      checkSpec(rel, rel.slice(directory.length + 1), kind, text, errors);
      checked += 1;
    }
  }

  for (const rel of collect(ADR_DIR, documents, errors)) {
    const text = documents[rel];
    if (text === undefined) continue;
    checkAdr(rel, text, errors);
    checked += 1;
  }

  for (const template of TEMPLATES) {
    if (!(template in documents)) {
      errors.push(`missing template: ${template}`);
    }
  }

  return { errors, checked };
}
