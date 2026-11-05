import { renderToStaticMarkup } from 'react-dom/server';

import { ClientCompatibilityBanner } from './client-compatibility-banner';

describe('client-compatibility-banner', () => {
  const onUpdate = vi.fn();

  it('should render nothing for an up to date version', () => {
    // When
    const banner = ClientCompatibilityBanner({ state: { status: 'up_to_date' }, language: 'en', onUpdate });
    // Then
    expect(banner).toBeNull();
  });

  it('should ask to update when the version is unsupported', () => {
    // When
    const html = renderToStaticMarkup(<ClientCompatibilityBanner state={{ status: 'unsupported' }} language="en" onUpdate={onUpdate} />);
    // Then
    expect(html).toContain('This version is no longer supported.');
    expect(html).toContain('Update now');
  });

  it.each(['update_recommended', 'deprecated'] as const)('should recommend updating when %s', (status) => {
    // When
    const html = renderToStaticMarkup(<ClientCompatibilityBanner state={{ status }} language="en" onUpdate={onUpdate} />);
    // Then
    expect(html).toContain('We recommend updating as soon as possible');
    expect(html).toContain('Update now');
  });

  it.each([{ status: 'unsupported' }, { status: 'update_recommended' }, { status: 'deprecated' }] as const)(
    'should not be closable when $status',
    (state) => {
      // When
      const html = renderToStaticMarkup(<ClientCompatibilityBanner state={state} language="en" onUpdate={onUpdate} />);
      // Then
      expect(html.match(/<button/g)).toHaveLength(1);
    },
  );
});
