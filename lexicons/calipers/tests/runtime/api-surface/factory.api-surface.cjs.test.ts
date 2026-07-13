import { describe, expect, it } from 'vitest';

const cjsFactory = await import('../../../dist/factory.js');

describe('API surface (factory CJS)', () => {
  it('exposes createCalipers', () => {
    expect(cjsFactory).toHaveProperty('createCalipers');
    expect(typeof cjsFactory.createCalipers).toBe('function');
  });
});
