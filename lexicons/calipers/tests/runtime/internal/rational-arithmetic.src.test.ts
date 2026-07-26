import { describe, expect, it } from 'vitest';

import {
  addParts,
  divideParts,
  multiplyParts,
  reduceParts,
  subtractParts,
} from '../../../src/internal/rational-arithmetic';

// The pure rational-arithmetic core behind the exact-value engine (see docs/pure-values.md): exact
// `+ - * /` on RatioParts, each result GCD-reduced and sign-normalized (denominator kept positive), and
// each op returning `null` when a numerator/denominator leaves safe-integer range. `null` is how the
// scalar layer learns to TAINT back to a plain double instead of claiming a false-exact value.

describe('reduceParts', () => {
  it('reduces by the greatest common divisor', () => {
    expect(reduceParts({ numerator: 6, denominator: 3 })).toEqual({
      numerator: 2,
      denominator: 1,
    });
    expect(reduceParts({ numerator: 2, denominator: 4 })).toEqual({
      numerator: 1,
      denominator: 2,
    });
    expect(reduceParts({ numerator: 30, denominator: 100 })).toEqual({
      numerator: 3,
      denominator: 10,
    });
  });

  it('normalizes the sign onto the numerator (denominator stays positive)', () => {
    expect(reduceParts({ numerator: 1, denominator: -2 })).toEqual({
      numerator: -1,
      denominator: 2,
    });
    expect(reduceParts({ numerator: -2, denominator: -4 })).toEqual({
      numerator: 1,
      denominator: 2,
    });
    expect(reduceParts({ numerator: -1, denominator: 2 })).toEqual({
      numerator: -1,
      denominator: 2,
    });
  });

  it('handles a zero numerator and unit ratios', () => {
    expect(reduceParts({ numerator: 0, denominator: 5 })).toEqual({
      numerator: 0,
      denominator: 1,
    });
    expect(reduceParts({ numerator: 5, denominator: 5 })).toEqual({
      numerator: 1,
      denominator: 1,
    });
    expect(reduceParts({ numerator: 7, denominator: 1 })).toEqual({
      numerator: 7,
      denominator: 1,
    });
  });
});

describe('addParts / subtractParts', () => {
  it('adds over a common denominator, reduced', () => {
    // 1/10 + 2/10 = 3/10 (the exact form of the classic 0.1 + 0.2 drift)
    expect(
      addParts(
        { numerator: 1, denominator: 10 },
        { numerator: 2, denominator: 10 },
      ),
    ).toEqual({ numerator: 3, denominator: 10 });
    expect(
      addParts(
        { numerator: 1, denominator: 2 },
        { numerator: 1, denominator: 3 },
      ),
    ).toEqual({ numerator: 5, denominator: 6 });
    // integer operands (n/1) add exactly
    expect(
      addParts(
        { numerator: 2, denominator: 1 },
        { numerator: 3, denominator: 1 },
      ),
    ).toEqual({ numerator: 5, denominator: 1 });
  });

  it('subtracts over a common denominator, reduced', () => {
    expect(
      subtractParts(
        { numerator: 3, denominator: 10 },
        { numerator: 1, denominator: 10 },
      ),
    ).toEqual({ numerator: 1, denominator: 5 });
    expect(
      subtractParts(
        { numerator: 1, denominator: 2 },
        { numerator: 1, denominator: 2 },
      ),
    ).toEqual({ numerator: 0, denominator: 1 });
  });
});

describe('multiplyParts / divideParts', () => {
  it('multiplies numerators and denominators, reduced', () => {
    expect(
      multiplyParts(
        { numerator: 1, denominator: 3 },
        { numerator: 3, denominator: 1 },
      ),
    ).toEqual({ numerator: 1, denominator: 1 });
    expect(
      multiplyParts(
        { numerator: 1, denominator: 2 },
        { numerator: 1, denominator: 2 },
      ),
    ).toEqual({ numerator: 1, denominator: 4 });
    expect(
      multiplyParts(
        { numerator: 1, denominator: 4 },
        { numerator: 4, denominator: 1 },
      ),
    ).toEqual({ numerator: 1, denominator: 1 });
  });

  it('divides by multiplying by the reciprocal, reduced', () => {
    // 3/10 / 1/10 = 3 (the exact form of the 0.3 / 0.1 = 2.9999999999999996 artifact)
    expect(
      divideParts(
        { numerator: 3, denominator: 10 },
        { numerator: 1, denominator: 10 },
      ),
    ).toEqual({ numerator: 3, denominator: 1 });
    expect(
      divideParts(
        { numerator: 10, denominator: 1 },
        { numerator: 3, denominator: 1 },
      ),
    ).toEqual({ numerator: 10, denominator: 3 });
  });

  it('returns null when dividing by a zero-valued rational', () => {
    expect(
      divideParts(
        { numerator: 1, denominator: 2 },
        { numerator: 0, denominator: 5 },
      ),
    ).toBeNull();
  });
});

describe('safe-integer overflow guard (honest impurity)', () => {
  it('returns null when a product leaves safe-integer range', () => {
    const big = {
      numerator: Number.MAX_SAFE_INTEGER,
      denominator: 1,
    };
    expect(
      multiplyParts(big, { numerator: 2, denominator: 1 }),
    ).toBeNull();
    // a denominator blow-up taints too
    expect(
      addParts(
        { numerator: 1, denominator: Number.MAX_SAFE_INTEGER },
        { numerator: 1, denominator: 7 },
      ),
    ).toBeNull();
  });

  it('stays exact for shallow, CSS-scale rationals', () => {
    // sanity: ordinary values never trip the guard (16/9 * 9/16 = 1)
    expect(
      multiplyParts(
        { numerator: 16, denominator: 9 },
        { numerator: 9, denominator: 16 },
      ),
    ).toEqual({ numerator: 1, denominator: 1 });
  });
});
