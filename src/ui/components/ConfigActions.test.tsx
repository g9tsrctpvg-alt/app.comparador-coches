import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConfigActions } from './ConfigActions';

describe('ConfigActions', () => {
  it('renders a button to copy the link and one to reset to defaults', () => {
    const markup = renderToStaticMarkup(
      <ConfigActions
        shareUrl={() => 'https://example.test/'}
        onReset={() => {}}
      />,
    );
    expect(markup).toContain('Copiar enlace');
    expect(markup).toContain('Restablecer valores por defecto');
  });
});
