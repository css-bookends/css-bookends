// seal + clone (System B). Bounds are SEALED by default (safety by default); cloning a sealed
// edge throws, an unsealed edge clones + re-validates, sealMin/sealMax lock additively, and
// mint-fresh from the raw value is always the escape. Integer here; float mirrors.
import { describe, expect, it } from 'vitest';

import { createInteger, f, i } from '../../../src';

describe('seal + clone (integer)', () => {
  it('bounds are SEALED by default; cloning a sealed edge throws', () => {
    const gap = i(5, { min: 0, max: 10 });
    expect(() => gap.clone({ max: 8 })).toThrow(/sealed/);
    expect(() => gap.clone({ min: 2 })).toThrow(/sealed/);
  });

  it('a faithful clone (no patch) copies the value + bound', () => {
    const gap = i(5, { min: 0, max: 10 });
    const copy = gap.clone();
    expect(copy.value()).toBe(5);
    expect(copy.constraints()).toEqual({ min: 0, max: 10 });
  });

  it('an unsealed edge clones + re-validates', () => {
    const gap = i(5, { min: 0, max: 10, sealedMax: false });
    expect(gap.clone({ max: 8 }).constraints()).toEqual({
      min: 0,
      max: 8,
    });
    // re-validation: a tighter max the current value violates throws
    expect(() => gap.clone({ max: 3 })).toThrow();
  });

  it('sealMax() locks an unsealed edge additively', () => {
    const gap = i(5, { min: 0, max: 10, sealedMax: false });
    expect(() => gap.sealMax().clone({ max: 8 })).toThrow(/sealed/);
  });

  it('mint-fresh always escapes a sealed value', () => {
    const gap = i(5, { min: 0, max: 10 });
    const rebased = i(gap.value(), { min: 0, max: 50 });
    expect(rebased.constraints()).toEqual({ min: 0, max: 50 });
  });

  it('float mirrors: default-sealed clone throws, unsealed clones', () => {
    expect(() =>
      f(0.5, { min: 0, max: 1 }).clone({ max: 0.8 }),
    ).toThrow(/sealed/);
    expect(
      f(0.5, { min: 0, max: 1, sealedMax: false })
        .clone({ max: 0.8 })
        .constraints(),
    ).toEqual({ min: 0, max: 0.8 });
  });
});

describe('seal cascade: factory config -> per-value -> default', () => {
  it('createInteger({ sealedMax: false }) makes max editable on its values', () => {
    const { i: loose } = createInteger({ sealedMax: false });
    expect(
      loose(5, { min: 0, max: 10 }).clone({ max: 8 }).constraints(),
    ).toEqual({ min: 0, max: 8 });
    // min was not loosened by the factory, so it stays sealed
    expect(() =>
      loose(5, { min: 0, max: 10 }).clone({ min: 2 }),
    ).toThrow(/sealed/);
  });

  it('a per-value option overrides the factory seal default', () => {
    const { i: loose } = createInteger({ sealedMax: false });
    expect(() =>
      loose(5, { min: 0, max: 10, sealedMax: true }).clone({
        max: 8,
      }),
    ).toThrow(/sealed/);
  });
});
