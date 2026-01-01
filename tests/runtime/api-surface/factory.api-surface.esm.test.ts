import { describe, expect, it } from 'vitest';

const esmFactory = await import('../../../dist/esm/factory.js');

describe('API surface (factory ESM)', () => {
  it('exposes createCalipers', () => {
    expect(esmFactory).toHaveProperty('createCalipers');
    expect(typeof esmFactory.createCalipers).toBe('function');
  });
});
