import { describe, expect, it } from 'vitest';
import { validateStyleTokens } from './validateStyleTokens';

const globalStylesheet = `
  :root {
    --bp-columna: 37rem;
    --bp-ancho: 60rem;
  }
`;

describe('validateStyleTokens', () => {
  it('passes a module that only uses tokens', () => {
    const result = validateStyleTokens({
      globalStylesheet,
      modules: {
        'src/ui/Foo.module.css': `
          .card {
            background: var(--color-card);
            padding: var(--space-4);
          }
        `,
      },
    });
    expect(result.errors).toEqual([]);
    expect(result.checked).toBe(1);
  });

  it('flags a hexadecimal color literal', () => {
    const result = validateStyleTokens({
      globalStylesheet,
      modules: { 'src/ui/Foo.module.css': '.a { color: #1a2420; }' },
    });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('color hexadecimal');
  });

  it('flags a functional color literal', () => {
    const result = validateStyleTokens({
      globalStylesheet,
      modules: { 'src/ui/Foo.module.css': '.a { color: rgb(1 2 3); }' },
    });
    expect(result.errors[0]).toContain('rgb()/hsl()');
  });

  it('flags a px length literal outside a media query', () => {
    const result = validateStyleTokens({
      globalStylesheet,
      modules: { 'src/ui/Foo.module.css': '.a { padding: 16px; }' },
    });
    expect(result.errors[0]).toContain('longitud literal');
  });

  it('flags a rem length literal outside a media query', () => {
    const result = validateStyleTokens({
      globalStylesheet,
      modules: { 'src/ui/Foo.module.css': '.a { padding: 1rem; }' },
    });
    expect(result.errors[0]).toContain('longitud literal');
  });

  it('flags a hardcoded font stack keyword', () => {
    const result = validateStyleTokens({
      globalStylesheet,
      modules: { 'src/ui/Foo.module.css': '.a { font-family: monospace; }' },
    });
    expect(result.errors[0]).toContain('pila tipográfica');
  });

  it('allows a media query width that matches a declared breakpoint', () => {
    const result = validateStyleTokens({
      globalStylesheet,
      modules: {
        'src/ui/Foo.module.css': `
          @media (min-width: 60rem) {
            .a { display: grid; }
          }
        `,
      },
    });
    expect(result.errors).toEqual([]);
  });

  it('flags a media query width that does not match any breakpoint', () => {
    const result = validateStyleTokens({
      globalStylesheet,
      modules: {
        'src/ui/Foo.module.css': `
          @media (min-width: 900px) {
            .a { display: grid; }
          }
        `,
      },
    });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('900px');
  });

  it('does not confuse a matching breakpoint expressed in px with a mismatch', () => {
    const result = validateStyleTokens({
      globalStylesheet,
      modules: {
        // 60rem === 960px con la conversión de 16px por rem.
        'src/ui/Foo.module.css':
          '@media (min-width: 960px) { .a { display: grid; } }',
      },
    });
    expect(result.errors).toEqual([]);
  });

  it('still checks declarations inside a media query body for literals', () => {
    const result = validateStyleTokens({
      globalStylesheet,
      modules: {
        'src/ui/Foo.module.css': `
          @media (min-width: 60rem) {
            .a { padding: 12px; }
          }
        `,
      },
    });
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('longitud literal');
  });

  it('reports the checked count even with zero modules', () => {
    const result = validateStyleTokens({ globalStylesheet, modules: {} });
    expect(result).toEqual({ errors: [], checked: 0 });
  });
});
