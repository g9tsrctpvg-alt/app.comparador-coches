import { describe, expect, it } from 'vitest';
import { validateDocs, type ValidationInput } from './validateDocs';

const DIRECTORIES = ['specs/product', 'specs/technical', 'docs/decisions'];

/** Una spec mínima que pasa todas las comprobaciones. */
function validSpec(overrides: Partial<Record<string, string>> = {}): string {
  const fields: Record<string, string> = {
    Id: 'technical/0001',
    Estado: 'draft',
    Tipo: 'technical',
    Fecha: '2026-08-03',
    'Specs relacionadas': 'ninguna',
    'ADRs relacionados': 'ninguno',
    'Doc de estado': '`docs/estado/arquitectura.md`',
    ...overrides,
  };
  const header = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `- **${key}:** ${value}`)
    .join('\n');

  return [
    '# 0001 — Un título',
    '',
    header,
    '',
    '## Contexto',
    '',
    'Algo que motiva la spec.',
    '',
    '## Criterios de aceptación',
    '',
    '- [ ] Un criterio.',
    '',
    '## Decisiones abiertas',
    '',
    'Ninguna.',
    '',
  ].join('\n');
}

/** Un ADR mínimo que pasa todas las comprobaciones. */
function validAdr(overrides: Partial<Record<string, string>> = {}): string {
  const fields: Record<string, string> = {
    Estado: 'approved',
    Fecha: '2026-08-03',
    Nivel: '🟡',
    ...overrides,
  };
  const header = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `- **${key}:** ${value}`)
    .join('\n');

  return [
    '# 0001 — Una decisión',
    '',
    header,
    '',
    '## Contexto',
    '',
    'El porqué.',
    '',
    '## Decisión',
    '',
    'Lo decidido.',
    '',
    '## Alternativas consideradas',
    '',
    'Las otras opciones.',
    '',
    '## Consecuencias',
    '',
    'Lo que implica.',
    '',
    '## Historial',
    '',
    '- **2026-08-06** — ADR creado.',
    '',
  ].join('\n');
}

const TEMPLATES = {
  'specs/TEMPLATE.md': '# Plantilla',
  'docs/decisions/TEMPLATE.md': '# Plantilla',
};

function run(
  documents: Record<string, string>,
  directories: readonly string[] = DIRECTORIES,
): ReturnType<typeof validateDocs> {
  const input: ValidationInput = {
    documents: { ...TEMPLATES, ...documents },
    directories,
  };
  return validateDocs(input);
}

/** Un repositorio sano: una spec, un ADR y las dos plantillas. */
function healthyRepo(): Record<string, string> {
  return {
    'specs/technical/0001-andamiaje.md': validSpec(),
    'docs/decisions/0001-formato.md': validAdr(),
  };
}

describe('a healthy repository', () => {
  it('reports no errors and counts the documents it checked', () => {
    const result = run(healthyRepo());
    expect(result.errors).toEqual([]);
    expect(result.checked).toBe(2);
  });
});

describe('1 — missing header field', () => {
  it('fires when a required spec field is absent', () => {
    const result = run({
      'specs/technical/0001-andamiaje.md': validSpec({
        'Doc de estado': undefined,
      }),
    });
    expect(result.errors).toContain(
      "specs/technical/0001-andamiaje.md: missing header field 'Doc de estado'",
    );
  });

  it('fires for an ADR field too', () => {
    const result = run({
      'docs/decisions/0001-formato.md': validAdr({ Nivel: undefined }),
    });
    expect(result.errors).toContain(
      "docs/decisions/0001-formato.md: missing header field 'Nivel'",
    );
  });

  it('stays quiet when every field is present', () => {
    expect(run(healthyRepo()).errors).toEqual([]);
  });
});

describe('2 — unknown Estado', () => {
  it('fires on a spec state outside the lifecycle', () => {
    const result = run({
      'specs/technical/0001-andamiaje.md': validSpec({ Estado: 'casi-hecha' }),
    });
    expect(result.errors).toContain(
      "specs/technical/0001-andamiaje.md: unknown Estado 'casi-hecha'",
    );
  });

  it('fires on an ADR state outside its own shorter list', () => {
    // `implemented` es válido para una spec y no para un ADR.
    const result = run({
      'docs/decisions/0001-formato.md': validAdr({ Estado: 'implemented' }),
    });
    expect(result.errors).toContain(
      "docs/decisions/0001-formato.md: unknown Estado 'implemented'",
    );
  });

  it('stays quiet on every declared spec state', () => {
    for (const estado of ['draft', 'approved', 'superseded']) {
      const result = run({
        'specs/technical/0001-andamiaje.md': validSpec({ Estado: estado }),
      });
      expect(result.errors).toEqual([]);
    }
  });
});

describe('3 — Fecha is not AAAA-MM-DD', () => {
  it('fires on a date in another format', () => {
    const result = run({
      'specs/technical/0001-andamiaje.md': validSpec({ Fecha: '03/08/2026' }),
    });
    expect(result.errors).toContain(
      "specs/technical/0001-andamiaje.md: Fecha '03/08/2026' is not AAAA-MM-DD",
    );
  });

  it('stays quiet on a well-formed date', () => {
    expect(run(healthyRepo()).errors).toEqual([]);
  });
});

describe('4 — must start with a level-1 heading', () => {
  it('fires when the document opens with anything else', () => {
    const withoutHeading = validSpec().replace(
      '# 0001 — Un título',
      'Un texto',
    );
    const result = run({ 'specs/technical/0001-andamiaje.md': withoutHeading });
    expect(result.errors).toContain(
      'specs/technical/0001-andamiaje.md: must start with a level-1 heading',
    );
  });

  it('stays quiet when it opens with one', () => {
    expect(run(healthyRepo()).errors).toEqual([]);
  });
});

describe('5 — Tipo does not match the folder', () => {
  it('fires on a product spec sitting in the technical folder', () => {
    const result = run({
      'specs/technical/0001-andamiaje.md': validSpec({
        Tipo: 'product',
        Id: 'technical/0001',
      }),
    });
    expect(result.errors).toContain(
      "specs/technical/0001-andamiaje.md: Tipo 'product' does not match folder 'technical'",
    );
  });

  it('stays quiet when they agree', () => {
    expect(run(healthyRepo()).errors).toEqual([]);
  });
});

describe('6 — Id must be <kind>/<number>', () => {
  it('fires when the Id does not match the filename number', () => {
    const result = run({
      'specs/technical/0007-andamiaje.md': validSpec({ Id: 'technical/0001' }),
    });
    expect(result.errors).toContain(
      "specs/technical/0007-andamiaje.md: Id must be 'technical/0007'",
    );
  });

  it('stays quiet when it matches', () => {
    expect(run(healthyRepo()).errors).toEqual([]);
  });
});

describe('7 — Contexto is empty', () => {
  it('fires when the section holds nothing but a blockquote', () => {
    const emptied = validSpec().replace(
      'Algo que motiva la spec.',
      '> Solo una cita.',
    );
    const result = run({ 'specs/technical/0001-andamiaje.md': emptied });
    expect(result.errors).toContain(
      "specs/technical/0001-andamiaje.md: 'Contexto' is empty",
    );
  });

  it('stays quiet when it has prose', () => {
    expect(run(healthyRepo()).errors).toEqual([]);
  });
});

describe('8 — a state that demands acceptance criteria', () => {
  it('fires when an approved spec declares none', () => {
    const withoutCriteria = validSpec({ Estado: 'approved' }).replace(
      '- [ ] Un criterio.',
      'Todavía nada.',
    );
    const result = run({
      'specs/technical/0001-andamiaje.md': withoutCriteria,
    });
    expect(result.errors).toContain(
      "specs/technical/0001-andamiaje.md: Estado 'approved' requires at least one acceptance criterion",
    );
  });

  it('accepts a criterion already ticked', () => {
    const ticked = validSpec({ Estado: 'approved' }).replace(
      '- [ ] Un criterio.',
      '- [x] Un criterio.',
    );
    expect(run({ 'specs/technical/0001-andamiaje.md': ticked }).errors).toEqual(
      [],
    );
  });

  it('stays quiet for a draft, which is not asked for criteria yet', () => {
    const withoutCriteria = validSpec().replace(
      '- [ ] Un criterio.',
      'Todavía nada.',
    );
    expect(
      run({ 'specs/technical/0001-andamiaje.md': withoutCriteria }).errors,
    ).toEqual([]);
  });
});

describe('9 — a state that demands Decisiones abiertas closed', () => {
  it('fires when an approved spec still lists one', () => {
    const withOpen = validSpec({ Estado: 'approved' }).replace(
      'Ninguna.',
      '- Falta decidir el formato.',
    );
    const result = run({ 'specs/technical/0001-andamiaje.md': withOpen });
    expect(result.errors).toContain(
      "specs/technical/0001-andamiaje.md: Estado 'approved' requires 'Decisiones abiertas' to be empty or to say so explicitly",
    );
  });

  it('accepts both an explicit "Ninguna." and a blank section', () => {
    const explicit = validSpec({ Estado: 'approved' });
    const blank = explicit.replace('Ninguna.', '');
    expect(run({ 'specs/technical/0001-a.md': explicit }).errors).toEqual([]);
    expect(run({ 'specs/technical/0001-a.md': blank }).errors).toEqual([]);
  });
});

describe('10 — a state that demands Doc de estado', () => {
  it('fires when an approved spec leaves it blank', () => {
    const result = run({
      'specs/technical/0001-andamiaje.md': validSpec({
        Estado: 'approved',
        'Doc de estado': '',
      }),
    });
    expect(result.errors).toContain(
      "specs/technical/0001-andamiaje.md: Estado 'approved' requires 'Doc de estado'",
    );
  });

  it('stays quiet when it is declared', () => {
    expect(
      run({
        'specs/technical/0001-andamiaje.md': validSpec({ Estado: 'approved' }),
      }).errors,
    ).toEqual([]);
  });
});

const NOTICE_A = [
  '> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio',
  '> ya implementado.',
].join('\n');

const NOTICE_B = [
  '> ⚠️ **Spec consolidada (2026-08-03).** Describe un cambio en el momento en',
  '> que se redactó.',
].join('\n');

const NOTICE_C = [
  '> ⚠️ **Spec cerrada sin verificar (2026-09-04).** Describe un cambio ya',
  '> implementado que no llegó a `verified`.',
].join('\n');

function specWithNotice(estado: string, notice: string): string {
  return validSpec({ Estado: estado }).replace(
    '## Contexto',
    `${notice}\n\n## Contexto`,
  );
}

describe('11 — implemented or verified without notice A', () => {
  it('fires for both states', () => {
    for (const estado of ['implemented', 'verified']) {
      const result = run({
        'specs/technical/0001-andamiaje.md': validSpec({ Estado: estado }),
      });
      expect(result.errors).toContain(
        `specs/technical/0001-andamiaje.md: Estado '${estado}' requires notice A`,
      );
    }
  });

  it('stays quiet once notice A is stamped', () => {
    const result = run({
      'specs/technical/0001-andamiaje.md': specWithNotice(
        'implemented',
        NOTICE_A,
      ),
    });
    expect(result.errors).toEqual([]);
  });
});

describe('12 — consolidated without notice B', () => {
  it('fires when the notice is missing altogether', () => {
    const result = run({
      'specs/technical/0001-andamiaje.md': validSpec({
        Estado: 'consolidated',
      }),
    });
    expect(result.errors).toContain(
      "specs/technical/0001-andamiaje.md: Estado 'consolidated' requires notice B",
    );
  });

  it('stays quiet once notice B is stamped', () => {
    const result = run({
      'specs/technical/0001-andamiaje.md': specWithNotice(
        'consolidated',
        NOTICE_B,
      ),
    });
    expect(result.errors).toEqual([]);
  });
});

describe('13 — consolidated still carrying notice A', () => {
  it('fires when A was not replaced by B', () => {
    const both = specWithNotice('consolidated', `${NOTICE_A}\n\n${NOTICE_B}`);
    const result = run({ 'specs/technical/0001-andamiaje.md': both });
    expect(result.errors).toContain(
      'specs/technical/0001-andamiaje.md: notice A must be replaced by notice B on consolidation',
    );
  });

  it('stays quiet when only B is present', () => {
    const result = run({
      'specs/technical/0001-andamiaje.md': specWithNotice(
        'consolidated',
        NOTICE_B,
      ),
    });
    expect(result.errors).toEqual([]);
  });
});

describe('14 — draft or approved carrying a historic notice', () => {
  it('fires for either notice on either state', () => {
    for (const estado of ['draft', 'approved']) {
      for (const notice of [NOTICE_A, NOTICE_B]) {
        const result = run({
          'specs/technical/0001-andamiaje.md': specWithNotice(estado, notice),
        });
        expect(result.errors).toContain(
          `specs/technical/0001-andamiaje.md: Estado '${estado}' must carry no historic notice`,
        );
      }
    }
  });

  it('stays quiet on a clean draft', () => {
    expect(run(healthyRepo()).errors).toEqual([]);
  });
});

describe('15 — closed without notice C', () => {
  it('fires when the notice is missing altogether', () => {
    const result = run({
      'specs/technical/0001-andamiaje.md': validSpec({ Estado: 'closed' }),
    });
    expect(result.errors).toContain(
      "specs/technical/0001-andamiaje.md: Estado 'closed' requires notice C",
    );
  });

  it('stays quiet once notice C is stamped', () => {
    const result = run({
      'specs/technical/0001-andamiaje.md': specWithNotice('closed', NOTICE_C),
    });
    expect(result.errors).toEqual([]);
  });

  it('demands the same three things every advanced state demands', () => {
    const bare = validSpec({ Estado: 'closed', 'Doc de estado': undefined })
      .replace('- [ ] Un criterio.', 'Sin criterios todavía.')
      .replace('Ninguna.', 'Falta decidir el nombre.');
    const result = run({ 'specs/technical/0001-andamiaje.md': bare });
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "specs/technical/0001-andamiaje.md: Estado 'closed' requires at least one acceptance criterion",
        "specs/technical/0001-andamiaje.md: Estado 'closed' requires 'Decisiones abiertas' to be empty or to say so explicitly",
        "specs/technical/0001-andamiaje.md: Estado 'closed' requires 'Doc de estado'",
      ]),
    );
  });
});

describe('15b — the spec that documents notice C is not tripped by it', () => {
  it('ignores the placeholder form, which carries no real date', () => {
    const documenting = validSpec({ Estado: 'approved' }).replace(
      'Algo que motiva la spec.',
      [
        'Al cerrar se estampa:',
        '',
        '> ⚠️ **Spec cerrada sin verificar (AAAA-MM-DD).** Describe un cambio',
        '> ya implementado.',
      ].join('\n'),
    );
    expect(
      run({ 'specs/technical/0001-andamiaje.md': documenting }).errors,
    ).toEqual([]);
  });
});

describe('16 — closed still carrying notice A or B', () => {
  it('fires for either of the two it replaces', () => {
    for (const notice of [NOTICE_A, NOTICE_B]) {
      const result = run({
        'specs/technical/0001-andamiaje.md': specWithNotice(
          'closed',
          `${notice}\n\n${NOTICE_C}`,
        ),
      });
      expect(result.errors).toContain(
        'specs/technical/0001-andamiaje.md: notice A or B must be replaced by notice C on closing',
      );
    }
  });
});

describe('17 — notice C outside the closed state', () => {
  it('fires on every other state', () => {
    for (const estado of [
      'draft',
      'approved',
      'implemented',
      'verified',
      'consolidated',
      'superseded',
    ]) {
      const result = run({
        'specs/technical/0001-andamiaje.md': specWithNotice(estado, NOTICE_C),
      });
      expect(result.errors).toContain(
        "specs/technical/0001-andamiaje.md: notice C belongs to Estado 'closed' only",
      );
    }
  });
});

describe('18 — Nivel outside the three autonomy levels', () => {
  it('fires on anything else', () => {
    const result = run({
      'docs/decisions/0001-formato.md': validAdr({ Nivel: 'alto' }),
    });
    expect(result.errors).toContain(
      'docs/decisions/0001-formato.md: Nivel must be one of 🟢 🟡 🔴',
    );
  });

  it('stays quiet on each of the three', () => {
    for (const nivel of ['🟢', '🟡', '🔴']) {
      const result = run({
        'docs/decisions/0001-formato.md': validAdr({ Nivel: nivel }),
      });
      expect(result.errors).toEqual([]);
    }
  });
});

describe('19 — a mandatory ADR section left empty', () => {
  it('fires for each of the five', () => {
    const sections: Record<string, string> = {
      Contexto: 'El porqué.',
      Decisión: 'Lo decidido.',
      'Alternativas consideradas': 'Las otras opciones.',
      Consecuencias: 'Lo que implica.',
      Historial: '- **2026-08-06** — ADR creado.',
    };
    for (const [title, prose] of Object.entries(sections)) {
      const emptied = validAdr().replace(prose, '');
      const result = run({ 'docs/decisions/0001-formato.md': emptied });
      expect(result.errors).toContain(
        `docs/decisions/0001-formato.md: '${title}' is empty`,
      );
    }
  });

  it('stays quiet when all five have prose', () => {
    expect(run(healthyRepo()).errors).toEqual([]);
  });
});

describe('20 — filename outside NNNN-titulo-en-kebab-case.md', () => {
  it('fires on a name with no number', () => {
    const result = run({ 'specs/technical/andamiaje.md': validSpec() });
    expect(result.errors).toContain(
      'specs/technical/andamiaje.md: name must be NNNN-titulo-en-kebab-case.md',
    );
  });

  it('fires on a name that is not kebab-case', () => {
    const result = run({
      'specs/technical/0001-Andamiaje_Del.md': validSpec(),
    });
    expect(result.errors).toContain(
      'specs/technical/0001-Andamiaje_Del.md: name must be NNNN-titulo-en-kebab-case.md',
    );
  });

  it('does not count a badly named file as checked', () => {
    const result = run({ 'specs/technical/andamiaje.md': validSpec() });
    expect(result.checked).toBe(0);
  });

  it('stays quiet on a well-formed name', () => {
    expect(run(healthyRepo()).errors).toEqual([]);
  });
});

describe('21 — a number already used', () => {
  it('fires on the second document sharing a number', () => {
    const result = run({
      'specs/technical/0001-andamiaje.md': validSpec(),
      'specs/technical/0001-otra-cosa.md': validSpec(),
    });
    expect(result.errors).toContain(
      'specs/technical/0001-otra-cosa.md: number 0001 already used by specs/technical/0001-andamiaje.md',
    );
  });

  it('lets the same number live in different folders', () => {
    // Las secuencias de product y technical son independientes.
    const result = run({
      'specs/technical/0001-andamiaje.md': validSpec(),
      'specs/product/0001-explicabilidad.md': validSpec({
        Id: 'product/0001',
        Tipo: 'product',
      }),
    });
    expect(result.errors).toEqual([]);
  });
});

describe('22 — a missing spec directory', () => {
  it('fires when the folder is not there', () => {
    const result = run(healthyRepo(), ['specs/technical', 'docs/decisions']);
    expect(result.errors).toContain('missing directory: specs/product');
  });

  it('stays quiet when both folders exist', () => {
    expect(run(healthyRepo()).errors).toEqual([]);
  });
});

describe('23 — a missing template', () => {
  it('fires for each template that is absent', () => {
    const result = validateDocs({
      documents: healthyRepo(),
      directories: DIRECTORIES,
    });
    expect(result.errors).toContain('missing template: specs/TEMPLATE.md');
    expect(result.errors).toContain(
      'missing template: docs/decisions/TEMPLATE.md',
    );
  });

  it('does not check a template as if it were a document', () => {
    const result = run(healthyRepo());
    expect(result.checked).toBe(2);
    expect(result.errors).toEqual([]);
  });
});
