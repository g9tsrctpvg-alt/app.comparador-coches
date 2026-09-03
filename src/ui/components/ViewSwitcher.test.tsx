import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ViewSwitcher } from './ViewSwitcher';
import { EXPLICACION_HASH, FICHA_HASH, VISITA_HASH } from '../useHashRoute';

describe('ViewSwitcher (technical/0005, requisito 4.3; product/0037, requisito 6.1)', () => {
  it('renders the four destinations, in order', () => {
    const markup = renderToStaticMarkup(<ViewSwitcher route="comparativa" />);
    const labels = [...markup.matchAll(/<a[^>]*>([^<]+)<\/a>/g)].map(
      (m) => m[1],
    );
    expect(labels).toEqual([
      'Clasificación',
      'Ficha',
      'Visita',
      'Cómo se calcula',
    ]);
    expect(markup).toContain(`href="${FICHA_HASH}"`);
    expect(markup).toContain(`href="${VISITA_HASH}"`);
    expect(markup).toContain(`href="${EXPLICACION_HASH}"`);
  });

  it.each([
    ['comparativa', 'Clasificación'],
    ['ficha', 'Ficha'],
    ['visita', 'Visita'],
    ['explicacion', 'Cómo se calcula'],
  ] as const)(
    'marks only %s as aria-current="page", never the other three',
    (route, activeLabel) => {
      const markup = renderToStaticMarkup(<ViewSwitcher route={route} />);
      const currentMatches = [
        ...markup.matchAll(/<a[^>]*aria-current="page"[^>]*>([^<]+)<\/a>/g),
      ];
      expect(currentMatches).toHaveLength(1);
      expect(currentMatches[0]![1]).toBe(activeLabel);
    },
  );

  describe('mobile select (technical/0006, requisito 2)', () => {
    it('offers the four destinations as options, with an accessible name', () => {
      const markup = renderToStaticMarkup(<ViewSwitcher route="comparativa" />);
      expect(markup).toMatch(/<select[^>]*aria-label="Vista"/);
      const options = [
        ...markup.matchAll(/<option[^>]*>([^<]+)<\/option>/g),
      ].map((m) => m[1]);
      expect(options).toEqual([
        'Clasificación',
        'Ficha',
        'Visita',
        'Cómo se calcula',
      ]);
    });

    it.each([
      ['comparativa', 'Clasificación'],
      ['ficha', 'Ficha'],
      ['visita', 'Visita'],
      ['explicacion', 'Cómo se calcula'],
    ] as const)(
      'marks only %s as the selected option',
      (route, activeLabel) => {
        const markup = renderToStaticMarkup(<ViewSwitcher route={route} />);
        const selectedMatches = [
          ...markup.matchAll(/<option[^>]*selected=""[^>]*>([^<]+)<\/option>/g),
        ];
        expect(selectedMatches).toHaveLength(1);
        expect(selectedMatches[0]![1]).toBe(activeLabel);
      },
    );
  });
});
