import { describe, expect, it } from 'vitest';
import { contrastRatio, validateContrast } from './validateContrast';

describe('contrastRatio', () => {
  it('gives the maximum ratio for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('gives a ratio of 1 for identical colors', () => {
    expect(contrastRatio('#5c6b62', '#5c6b62')).toBeCloseTo(1, 5);
  });

  it('does not care which of the two colors comes first', () => {
    const a = contrastRatio('#1a2420', '#f3f5f1');
    const b = contrastRatio('#f3f5f1', '#1a2420');
    expect(a).toBeCloseTo(b, 10);
  });
});

describe('validateContrast', () => {
  it('passes a palette where every declared pair clears its threshold', () => {
    const globalStylesheet = `
      :root {
        --color-paper: #e9ebe6;
        --color-card: #f3f5f1;
        --color-card-raised: #fbfdfa;
        --color-ink: #1a2420;
        --color-mute: #5c6b62;
        --color-ink-tertiary: #727f76;
        --color-accent: #14655c;
        --color-signal: #a34d18;
        --color-positive: #14655c;
        --color-negative: #a34d18;
        --color-mute-on-ink: #8fa69b;
        --color-axis-carga: #2a6f8f;
        --color-axis-habitabilidad: #2d4b03;
        --color-axis-diario: #14655c;
        --color-axis-prestaciones: #8e2f45;
        --color-axis-fiabilidad: #31417a;
        --color-axis-estetica: #8d4784;
        --color-axis-prueba: #994c00;
        --color-axis-coste: #7d6417;
        --color-chrome: #e8f0ef;
      }
    `;
    const result = validateContrast({ globalStylesheet });
    expect(result.errors).toEqual([]);
    expect(result.checked).toBeGreaterThan(0);
  });

  it('flags a normal-text pair below 4.5:1', () => {
    // El `mute` original del artefacto, antes de que product/0009 lo
    // oscureciera: no llega a 4,5:1 sobre `card`.
    const globalStylesheet = `
      :root {
        --color-paper: #e9ebe6;
        --color-card: #f3f5f1;
        --color-card-raised: #fbfdfa;
        --color-ink: #1a2420;
        --color-mute: #6b7a72;
        --color-ink-tertiary: #727f76;
        --color-accent: #14655c;
        --color-signal: #a34d18;
        --color-positive: #14655c;
        --color-negative: #a34d18;
        --color-mute-on-ink: #8fa69b;
        --color-axis-carga: #2a6f8f;
        --color-axis-habitabilidad: #2d4b03;
        --color-axis-diario: #14655c;
        --color-axis-prestaciones: #8e2f45;
        --color-axis-fiabilidad: #31417a;
        --color-axis-estetica: #8d4784;
        --color-axis-prueba: #994c00;
        --color-axis-coste: #7d6417;
        --color-chrome: #e8f0ef;
      }
    `;
    const result = validateContrast({ globalStylesheet });
    expect(result.errors.some((e) => e.includes('--color-mute'))).toBe(true);
    expect(result.errors.some((e) => e.includes('texto normal'))).toBe(true);
  });

  it('holds ink-tertiary to the large-text threshold, not the normal one', () => {
    // 3,49:1 sobre `paper`: por debajo de 4,5 pero por encima de 3.
    const globalStylesheet = `
      :root {
        --color-paper: #e9ebe6;
        --color-card: #f3f5f1;
        --color-card-raised: #fbfdfa;
        --color-ink: #1a2420;
        --color-mute: #5c6b62;
        --color-ink-tertiary: #727f76;
        --color-accent: #14655c;
        --color-signal: #a34d18;
        --color-positive: #14655c;
        --color-negative: #a34d18;
        --color-mute-on-ink: #8fa69b;
        --color-axis-carga: #2a6f8f;
        --color-axis-habitabilidad: #2d4b03;
        --color-axis-diario: #14655c;
        --color-axis-prestaciones: #8e2f45;
        --color-axis-fiabilidad: #31417a;
        --color-axis-estetica: #8d4784;
        --color-axis-prueba: #994c00;
        --color-axis-coste: #7d6417;
        --color-chrome: #e8f0ef;
      }
    `;
    const result = validateContrast({ globalStylesheet });
    expect(result.errors).toEqual([]);
  });

  it('reports a missing token by name instead of throwing', () => {
    const result = validateContrast({ globalStylesheet: ':root {}' });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('no se encontró --color-');
  });

  it('ignores a color with an alpha channel: no fixed value to measure', () => {
    const globalStylesheet = `
      :root {
        --color-accent-tint: rgb(20 101 92 / 7%);
      }
    `;
    // No lanza al encontrar un color funcional; simplemente no lo usa
    // como valor de ningún par (--color-accent-tint no es un `foreground`
    // ni un `background` declarado).
    expect(() => validateContrast({ globalStylesheet })).not.toThrow();
  });
});
