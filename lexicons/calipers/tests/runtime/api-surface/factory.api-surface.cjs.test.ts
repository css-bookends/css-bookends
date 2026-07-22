import { describe, expect, it } from 'vitest';

const cjsFactory = await import('../../../dist/factory.js');

describe('API surface (factory CJS)', () => {
  it('exposes createCalipersFactory', () => {
    expect(cjsFactory).toHaveProperty('createCalipersFactory');
    expect(typeof cjsFactory.createCalipersFactory).toBe('function');
  });
});
