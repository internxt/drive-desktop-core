import { getClientCompatibilityTexts } from './get-client-compatibility-texts';

describe('get-client-compatibility-texts', () => {
  const recommendation =
    "A new version is available. We recommend updating as soon as possible so you don't miss out on the latest changes.";

  it('should not return texts for a supported version', () => {
    // When
    const texts = getClientCompatibilityTexts({ state: { status: 'up_to_date' }, language: 'en' });
    // Then
    expect(texts).toBeUndefined();
  });

  it('should say the update is mandatory and sync is stopped when the version is unsupported', () => {
    // When
    const texts = getClientCompatibilityTexts({ state: { status: 'unsupported', sunsetAt: '2026-12-01T00:00:00.000Z' }, language: 'en' });
    // Then
    expect(texts).toStrictEqual({
      title: 'Update required',
      description: 'This version is no longer supported. Updating is mandatory: sync and other features are stopped until you update.',
      update: 'Update now',
    });
  });

  it('should include the sunset date when the backend sends it', () => {
    // When
    const texts = getClientCompatibilityTexts({ state: { status: 'deprecated', sunsetAt: '2026-12-01T00:00:00.000Z' }, language: 'en' });
    // Then
    expect(texts).toStrictEqual({
      title: 'Update recommended',
      description:
        'A new version is available. This version will stop working on December 1, 2026, so we recommend updating as soon as possible.',
      update: 'Update now',
    });
  });

  it('should include the sunset date when an update is recommended', () => {
    // When
    const texts = getClientCompatibilityTexts({
      state: { status: 'update_recommended', sunsetAt: '2026-12-01T00:00:00.000Z' },
      language: 'en',
    });
    // Then
    expect(texts?.description).toContain('December 1, 2026');
  });

  it.each([undefined, null, 'not a date'])('should keep the recommendation without date when sunsetAt is %j', (sunsetAt) => {
    // When
    const texts = getClientCompatibilityTexts({ state: { status: 'deprecated', sunsetAt }, language: 'en' });
    // Then
    expect(texts).toStrictEqual({ title: 'Update recommended', description: recommendation, update: 'Update now' });
  });

  it('should format the sunset date in the requested language', () => {
    // When
    const texts = getClientCompatibilityTexts({ state: { status: 'deprecated', sunsetAt: '2026-12-01T00:00:00.000Z' }, language: 'es' });
    // Then
    expect(texts?.description).toBe(
      'Hay una nueva versión disponible. Esta versión dejará de funcionar el 1 de diciembre de 2026, por lo que le recomendamos actualizar lo antes posible.',
    );
  });

  it('should return the texts in the requested language', () => {
    // When
    const texts = getClientCompatibilityTexts({ state: { status: 'unsupported' }, language: 'es' });
    // Then
    expect(texts?.title).toBe('Actualización obligatoria');
  });
});
