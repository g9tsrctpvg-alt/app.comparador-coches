import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConfigActions } from './ConfigActions';

describe('ConfigActions', () => {
  it('renders a button to copy the link and one to reset to defaults', () => {
    const markup = renderToStaticMarkup(
      <ConfigActions
        shareUrl={() => 'https://example.test/'}
        onReset={() => {}}
        decisionCount={0}
        onClearDecisions={() => {}}
      />,
    );
    expect(markup).toContain('Copiar enlace');
    expect(markup).toContain('Restablecer valores por defecto');
  });

  it('hides "Borrar decisiones" when there is nothing registered', () => {
    const markup = renderToStaticMarkup(
      <ConfigActions
        shareUrl={() => 'https://example.test/'}
        onReset={() => {}}
        decisionCount={0}
        onClearDecisions={() => {}}
      />,
    );
    expect(markup).not.toContain('Borrar decisiones');
  });

  it('shows "Borrar decisiones" once at least one decision is registered (product/0030, requisito 3.6)', () => {
    const markup = renderToStaticMarkup(
      <ConfigActions
        shareUrl={() => 'https://example.test/'}
        onReset={() => {}}
        decisionCount={2}
        onClearDecisions={() => {}}
      />,
    );
    expect(markup).toContain('Borrar decisiones');
  });
});
