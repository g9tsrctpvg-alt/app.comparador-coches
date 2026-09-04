import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConfigActions } from './ConfigActions';

function render(overrides: Partial<Parameters<typeof ConfigActions>[0]> = {}) {
  return renderToStaticMarkup(
    <ConfigActions
      shareUrl={() => 'https://example.test/'}
      onReset={() => {}}
      decisionCount={0}
      onClearDecisions={() => {}}
      testDriveCount={0}
      onClearTestDrives={() => {}}
      {...overrides}
    />,
  );
}

describe('ConfigActions', () => {
  it('renders a button to copy the link and one to reset to defaults', () => {
    const markup = render();
    expect(markup).toContain('Copiar enlace');
    expect(markup).toContain('Restablecer valores por defecto');
  });

  it('hides "Borrar decisiones" when there is nothing registered', () => {
    const markup = render({ decisionCount: 0 });
    expect(markup).not.toContain('Borrar decisiones');
  });

  it('shows "Borrar decisiones" once at least one decision is registered (product/0030, requisito 3.6)', () => {
    const markup = render({ decisionCount: 2 });
    expect(markup).toContain('Borrar decisiones');
  });

  it('hides "Borrar pruebas" when there is nothing registered', () => {
    const markup = render({ testDriveCount: 0 });
    expect(markup).not.toContain('Borrar pruebas');
  });

  it('shows "Borrar pruebas" once at least one test drive is registered (product/0037, requisito 3.5)', () => {
    const markup = render({ testDriveCount: 3 });
    expect(markup).toContain('Borrar pruebas');
  });
});
