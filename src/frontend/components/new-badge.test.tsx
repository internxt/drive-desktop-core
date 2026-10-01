import { NewBadge } from './new-badge';

describe('new-badge', () => {
  it('renders the label in the default badge variant', () => {
    // Given
    const label = 'New';

    // When
    const badge = NewBadge({ label });

    // Then
    expect(badge.props.children).toBe(label);
    expect(badge.props.className).toContain('border-primary');
    expect(badge.props.className).not.toContain('h-2.5');
  });

  it('renders a compact circle with an accessible label', () => {
    // Given
    const label = 'New';

    // When
    const badge = NewBadge({ label, variant: 'circle' });

    // Then
    expect(badge.props.className).toContain('bg-primary');
    expect(badge.props.className).not.toContain('bg-primary/5');
    expect(badge.props.className).toContain('h-2.5');
    expect(badge.props.className).toContain('w-2.5');
    expect(badge.props.title).toBe(label);
    expect(badge.props.children.props.className).toBe('sr-only');
    expect(badge.props.children.props.children).toBe(label);
  });
});
