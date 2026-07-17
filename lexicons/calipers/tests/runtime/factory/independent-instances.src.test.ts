/* eslint-disable no-restricted-syntax -- this whole file tests factory-instance isolation;
   every createInteger / createCalipersBundle call here is the subject under test. */
// Independent factory instances: multiple createInteger / bundle instances with DIFFERENT configs
// coexist with NO shared global state (the factory-first property). A strict instance and a lenient
// one side by side never interfere. Exercises the config at EVERY tier — per-value option, factory
// config, and bundle key — for `hardening`.
import { describe, expect, it } from 'vitest';

import { createCalipersBundle, createInteger } from '../../../src';

const bounded = { min: 0, max: 10 };

describe('independent factory instances (no global state)', () => {
  it('two createInteger instances with different hardening never interfere', () => {
    const strict = createInteger({ hardening: 'fail' });
    const lenient = createInteger({ hardening: 'warn' });
    expect(() => strict.i(8, bounded).multiply(2)).toThrow(); // 16 > 10
    expect(lenient.i(8, bounded).multiply(2).value()).toBe(16); // ignored
    // strict is unaffected after the lenient instance was used
    expect(() => strict.i(8, bounded).multiply(2)).toThrow();
  });

  it('a per-value hardening overrides the instance config, both directions', () => {
    const strict = createInteger({ hardening: 'fail' });
    const lenient = createInteger({ hardening: 'warn' });
    // strict instance, one value opts into warn (loose)
    expect(
      strict
        .i(8, { ...bounded, hardening: 'warn' })
        .multiply(2)
        .value(),
    ).toBe(16);
    // lenient instance, one value opts into fail
    expect(() =>
      lenient.i(8, { ...bounded, hardening: 'fail' }).multiply(2),
    ).toThrow();
  });

  it('two bundles forward their integer hardening independently', () => {
    const loose = createCalipersBundle({
      integer: { hardening: 'warn' },
    });
    const strict = createCalipersBundle();
    // loose bundle: arithmetic breach ignored
    expect(loose.i(8, bounded).multiply(2).value()).toBe(16);
    // strict bundle: fails on breach — identical call, different bundle
    expect(() => strict.i(8, bounded).multiply(2)).toThrow();
  });
});
