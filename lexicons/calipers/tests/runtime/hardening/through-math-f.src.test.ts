// Hardening-through-math, RUNTIME layer for `f` (matrix columns B/C). Mirrors through-math-i: the
// same refinements-as-bounds, set-once, and asScalar-carries-bound behaviours. Floats have no
// integer invariant, so `divide` producing a fraction never throws on that account.
import { describe, expect, it } from 'vitest';

import { f } from '../../../src';
import {
  inRangeFloat,
  nonNegativeFloat,
} from '../../support/calipers_tests.src';

describe('float refinements are stored as runtime bounds', () => {
  it('nonNegative sets min 0; a below-zero result throws', () => {
    const nn = nonNegativeFloat.ensure(f(0.5));
    expect(nn.constraints()).toEqual({ min: 0 });
    expect(() => nn.subtract(1)).toThrow(/below the minimum/); // -0.5 < 0
  });

  it('inRange sets [a, b]; an out-of-range result throws', () => {
    const ranged = inRangeFloat(0, 1).ensure(f(0.5));
    expect(ranged.constraints()).toEqual({ min: 0, max: 1 });
    expect(() => ranged.multiply(3)).toThrow(/above the maximum/); // 1.5 > 1
  });
});

describe('a bound is set once (float)', () => {
  it('refining an already-bounded float throws', () => {
    expect(() =>
      nonNegativeFloat.ensure(f(0.5, { min: 0, max: 1 })),
    ).toThrow(/bound is already set|set once|already.*bound/i);
  });
});

describe('float asScalar preserves the bound at runtime', () => {
  it('carries the bound onto the recovered scalar', () => {
    // a whole-valued float narrows to an integer; the bound rides along either way
    expect(
      f(5, { min: 0, max: 10 }).asScalar().constraints(),
    ).toEqual({
      min: 0,
      max: 10,
    });
  });
});

describe('the bound survives float arithmetic — green locks', () => {
  it('keeps .constraints() through arithmetic', () => {
    const b = f(0.4, { min: 0, max: 1 });
    expect(b.multiply(2).constraints()).toEqual({ min: 0, max: 1 });
    expect(b.clone().constraints()).toEqual({ min: 0, max: 1 });
  });
});
