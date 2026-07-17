// Scalar (i / f) refinements: the measurement quartet (is / ensure / check / hardenWith)
// brought to the scalars, built off the shared makeRefinement machinery. ensure throws
// out of range, check returns a discriminated result, hardenWith falls back to the default.
import { describe, expect, it } from 'vitest';

import {
  f,
  i,
  inRangeFloat,
  inRangeInteger,
  nonNegativeInteger,
  nonPositiveInteger,
} from '../../../src';

describe('scalar refinements (i / f quartet)', () => {
  it('ensure passes in-bounds and throws out-of-bounds', () => {
    expect(nonNegativeInteger.ensure(i(4)).value()).toBe(4);
    expect(() => nonNegativeInteger.ensure(i(-1))).toThrow();
    expect(inRangeInteger(0, 10).ensure(i(5)).value()).toBe(5);
    expect(() => inRangeInteger(0, 10).ensure(i(15))).toThrow(
      /\[0, 10\]/,
    );
  });

  it('check is a discriminated ok / error result', () => {
    expect(inRangeInteger(0, 10).check(i(5)).ok).toBe(true);
    const bad = inRangeInteger(0, 10).check(i(15));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toMatch(/\[0, 10\]/);
  });

  it('hardenWith falls back to the default (min) when out of range', () => {
    expect(inRangeInteger(0, 10).hardenWith(i(15)).value()).toBe(0);
    expect(nonNegativeInteger.hardenWith(i(-4)).value()).toBe(0);
  });

  it('nonPositiveInteger and the float refinements mirror integer', () => {
    expect(nonPositiveInteger.ensure(i(-2)).value()).toBe(-2);
    expect(() => nonPositiveInteger.ensure(i(2))).toThrow();
    expect(inRangeFloat(0, 1).ensure(f(0.5)).value()).toBe(0.5);
    expect(() => inRangeFloat(0, 1).ensure(f(1.5))).toThrow();
  });

  it('inRange* rejects an inverted range at construction', () => {
    expect(() => inRangeInteger(10, 0)).toThrow(/must be <=/);
  });
});
