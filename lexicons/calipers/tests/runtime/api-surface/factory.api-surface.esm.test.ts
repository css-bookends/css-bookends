import { describe, expect, it } from 'vitest';

const esmFactory = await import('../../../dist/factory.mjs');

describe('API surface (factory ESM)', () => {
  it('exposes createCalipersFactory', () => {
    expect(esmFactory).toHaveProperty('createCalipersFactory');
    expect(typeof esmFactory.createCalipersFactory).toBe('function');
  });
});
