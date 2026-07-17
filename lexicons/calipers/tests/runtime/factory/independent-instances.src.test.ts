/* eslint-disable no-restricted-syntax -- this whole file tests factory-instance isolation;
   every createInteger / createCalipersBundle call here is the subject under test. */
// Independent factory instances: multiple createInteger / bundle instances with DIFFERENT configs
// coexist with NO shared global state (the factory-first property). A strict instance and a lenient
// one side by side never interfere. Exercises the config at EVERY tier — per-value option, factory
// config, and bundle key — for both `hardening` and `sealed`.
import { describe, expect, it } from 'vitest';

import { createCalipersBundle, createInteger } from '../../../src';

const bounded = { min: 0, max: 10 };

describe('independent factory instances (no global state)', () => {
  it('two createInteger instances with different hardening never interfere', () => {
    const strict = createInteger({ hardening: 'fail' });
    const lenient = createInteger({ hardening: 'ignore' });
    expect(() => strict.i(8, bounded).multiply(2)).toThrow(); // 16 > 10
    expect(lenient.i(8, bounded).multiply(2).value()).toBe(16); // ignored
    // strict is unaffected after the lenient instance was used
    expect(() => strict.i(8, bounded).multiply(2)).toThrow();
  });

  it('a per-value hardening overrides the instance config, both directions', () => {
    const strict = createInteger({ hardening: 'fail' });
    const lenient = createInteger({ hardening: 'ignore' });
    // strict instance, one value opts into ignore
    expect(
      strict
        .i(8, { ...bounded, hardening: 'ignore' })
        .multiply(2)
        .value(),
    ).toBe(16);
    // lenient instance, one value opts into fail
    expect(() =>
      lenient.i(8, { ...bounded, hardening: 'fail' }).multiply(2),
    ).toThrow();
  });

  it('two createInteger instances with different seal defaults never interfere', () => {
    const sealed = createInteger(); // default sealed
    const open = createInteger({ sealedMax: false });
    expect(() => sealed.i(5, bounded).clone({ max: 8 })).toThrow(
      /sealed/,
    );
    expect(
      open.i(5, bounded).clone({ max: 8 }).constraints(),
    ).toEqual({
      min: 0,
      max: 8,
    });
  });

  it('two bundles forward their integer config independently (hardening + sealed)', () => {
    const loose = createCalipersBundle({
      integer: { hardening: 'ignore', sealedMax: false },
    });
    const strict = createCalipersBundle();
    // loose bundle: arithmetic breach ignored, max editable
    expect(loose.i(8, bounded).multiply(2).value()).toBe(16);
    expect(
      loose.i(5, bounded).clone({ max: 8 }).constraints(),
    ).toEqual({
      min: 0,
      max: 8,
    });
    // strict bundle: fails on breach, max sealed — identical calls, different bundle
    expect(() => strict.i(8, bounded).multiply(2)).toThrow();
    expect(() => strict.i(5, bounded).clone({ max: 8 })).toThrow(
      /sealed/,
    );
  });
});
