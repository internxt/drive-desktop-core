import { renderToStaticMarkup } from 'react-dom/server';

import { Banner } from './banner';

describe('banner', () => {
  it('should render only the message when there is no action or dismiss', () => {
    // When
    const html = renderToStaticMarkup(<Banner message="Hello" />);
    // Then
    expect(html).toContain('Hello');
    expect(html).toContain('border-primary/30');
    expect(html).not.toContain('<button');
  });

  it('should render the action', () => {
    // When
    const html = renderToStaticMarkup(<Banner message="Hello" action={{ label: 'Do it', onClick: vi.fn() }} />);
    // Then
    expect(html).toContain('Do it');
    expect(html.match(/<button/g)).toHaveLength(1);
  });

  it('should be closable only when onDismiss is provided', () => {
    // When
    const html = renderToStaticMarkup(<Banner message="Hello" onDismiss={vi.fn()} dismissLabel="Close" />);
    // Then
    expect(html).toContain('aria-label="Close"');
  });

  it('should use the colors of the variant', () => {
    // When
    const html = renderToStaticMarkup(<Banner variant="error" message="Hello" />);
    // Then
    expect(html).toContain('border-red/30');
  });
});
