// clone (System B). clone() is a zero-arg, config-preserving copy: same value, same bound, same
// config, a fresh instance. A bound is set once at construction and is then immutable; to change a
// bound you mint a fresh value. Integer here; float mirrors.
import { describe, expect, it } from 'vitest';

import { f, i } from '../../../src';

describe('clone (integer)', () => {
  it('clone() copies the value and the bound into a fresh instance', () => {
    const gap = i(5, { min: 0, max: 10 });
    const copy = gap.clone();
    expect(copy).not.toBe(gap);
    expect(copy.value()).toBe(5);
    expect(copy.constraints()).toEqual({ min: 0, max: 10 });
  });

  it('clone() preserves an unbounded value', () => {
    const copy = i(7).clone();
    expect(copy.value()).toBe(7);
    expect(copy.constraints().min).toBeUndefined();
    expect(copy.constraints().max).toBeUndefined();
  });

  it('mint-fresh is the way to a different bound', () => {
    const gap = i(5, { min: 0, max: 10 });
    const rebased = i(gap.value(), { min: 0, max: 50 });
    expect(rebased.constraints()).toEqual({ min: 0, max: 50 });
  });

  it('float mirrors: clone() copies value + bound', () => {
    const copy = f(0.5, { min: 0, max: 1 }).clone();
    expect(copy.value()).toBe(0.5);
    expect(copy.constraints()).toEqual({ min: 0, max: 1 });
  });
});
