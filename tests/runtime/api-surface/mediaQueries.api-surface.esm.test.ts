import { describe, expect, it } from 'vitest';

const esmMediaQueries = await import(
  '../../../dist/esm/mediaQueries/index.js'
);

describe('mediaQueries API surface (ESM)', () => {
  it('exposes expected media queries helpers', () => {
    expect(esmMediaQueries).toHaveProperty('buildMediaQueryString');
    expect(typeof esmMediaQueries.buildMediaQueryString).toBe('function');

    expect(esmMediaQueries).toHaveProperty('makeMediaQueryStyle');
    expect(typeof esmMediaQueries.makeMediaQueryStyle).toBe('function');

    expect(esmMediaQueries).toHaveProperty('createMediaQueryBuilder');
    expect(typeof esmMediaQueries.createMediaQueryBuilder).toBe('function');

    expect(esmMediaQueries).toHaveProperty('buildMediaQueryFromFeatures');
    expect(typeof esmMediaQueries.buildMediaQueryFromFeatures).toBe('function');
  });

  it('exposes media query module emitters', () => {
    expect(esmMediaQueries).toHaveProperty('emitDimensionsFeatures');
    expect(typeof esmMediaQueries.emitDimensionsFeatures).toBe('function');

    expect(esmMediaQueries).toHaveProperty('emitResolutionFeatures');
    expect(typeof esmMediaQueries.emitResolutionFeatures).toBe('function');

    expect(esmMediaQueries).toHaveProperty('emitInteractionFeatures');
    expect(typeof esmMediaQueries.emitInteractionFeatures).toBe('function');

    expect(esmMediaQueries).toHaveProperty('emitPreferencesFeatures');
    expect(typeof esmMediaQueries.emitPreferencesFeatures).toBe('function');

    expect(esmMediaQueries).toHaveProperty('emitDisplayFeatures');
    expect(typeof esmMediaQueries.emitDisplayFeatures).toBe('function');

    expect(esmMediaQueries).toHaveProperty('emitEnvironmentFeatures');
    expect(typeof esmMediaQueries.emitEnvironmentFeatures).toBe('function');

    expect(esmMediaQueries).toHaveProperty('emitCustomFeatures');
    expect(typeof esmMediaQueries.emitCustomFeatures).toBe('function');
  });
});
