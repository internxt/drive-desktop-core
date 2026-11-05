import { getClientCompatibilityTexts } from './get-client-compatibility-texts';

describe('get-client-compatibility-texts', () => {
  it('should not return texts for a supported version', () => {
    // When
    const texts = getClientCompatibilityTexts({ state: { status: 'up_to_date' }, language: 'en' });
    // Then
    expect(texts).toBeUndefined();
  });

  it('should say the update is mandatory and sync is stopped when the version is unsupported', () => {
    // When
    const texts = getClientCompatibilityTexts({ state: { status: 'unsupported' }, language: 'en' });
    // Then
    expect(texts).toStrictEqual({
      title: 'Update required',
      description: 'This version is no longer supported. Updating is mandatory: sync and other features are stopped until you update.',
      update: 'Update now',
    });
  });

  it('should recommend updating when the version is deprecated', () => {
    // When
    const texts = getClientCompatibilityTexts({ state: { status: 'deprecated', sunsetAt: '2026-12-01T00:00:00.000Z' }, language: 'en' });
    // Then
    expect(texts).toStrictEqual({
      title: 'Update recommended',
      description: "A new version is available. We recommend updating as soon as possible so you don't miss out on the latest changes.",
      update: 'Update now',
    });
  });

  it('should return the texts in the requested language', () => {
    // When
    const texts = getClientCompatibilityTexts({ state: { status: 'unsupported' }, language: 'es' });
    // Then
    expect(texts?.title).toBe('Actualización obligatoria');
  });
});
