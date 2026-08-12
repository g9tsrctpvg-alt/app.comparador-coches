import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ViewSwitcher } from './ViewSwitcher';
import { EXPLICACION_HASH, FICHA_HASH } from '../useHashRoute';

describe('ViewSwitcher (technical/0005, requisito 4.3)', () => {
  it('renders the three destinations, in order', () => {
    const markup = renderToStaticMarkup(<ViewSwitcher route="comparativa" />);
    const labels = [...markup.matchAll(/<a[^>]*>([^<]+)<\/a>/g)].map(
      (m) => m[1],
    );
    expect(labels).toEqual(['Clasificación', 'Ficha', 'Cómo se calcula']);
    expect(markup).toContain(`href="${FICHA_HASH}"`);
    expect(markup).toContain(`href="${EXPLICACION_HASH}"`);
  });

  it.each([
    ['comparativa', 'Clasificación'],
    ['ficha', 'Ficha'],
    ['explicacion', 'Cómo se calcula'],
  ] as const)(
    'marks only %s as aria-current="page", never the other two',
    (route, activeLabel) => {
      const markup = renderToStaticMarkup(<ViewSwitcher route={route} />);
      const currentMatches = [
        ...markup.matchAll(/<a[^>]*aria-current="page"[^>]*>([^<]+)<\/a>/g),
      ];
      expect(currentMatches).toHaveLength(1);
      expect(currentMatches[0]![1]).toBe(activeLabel);
    },
  );
});
