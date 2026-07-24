// Hardening-through-math, RUNTIME layer for `i` (matrix columns B/C). The System-B throw/snap on
// breach is already shipped (hardening.src.test.ts + snap tests); this file adds the behaviours the
// HARD RULE introduces: refinements stored as bounds, forbid re-bounding (set-once), and asScalar
// carrying the bound. Plus green locks that the bound survives arithmetic (`.constraints()` intact).
import { describe, expect, it } from 'vitest';

import { createIntegerFactory, i } from '../../../src';
import {
  inRangeInteger,
  nonNegativeInteger,
  nonPositiveInteger,
} from '../../support/calipers_tests.src';

describe('refinements are stored as runtime bounds', () => {
  it('nonNegative sets min 0; a below-zero result throws, an in-range one does not', () => {
    const nn = nonNegativeInteger.ensure(i(5));
    expect(nn.constraints()).toEqual({ min: 0 });
    expect(nn.add(1).value()).toBe(6);
    expect(() => nn.subtract(10)).toThrow(/below the minimum/); // -5 < 0
  });

  it('nonPositive sets max 0; an above-zero result throws', () => {
    const np = nonPositiveInteger.ensure(i(-5));
    expect(np.constraints()).toEqual({ max: 0 });
    expect(() => np.add(10)).toThrow(/above the maximum/); // 5 > 0
  });

  it('inRange sets [a, b]; an out-of-range result throws', () => {
    const ranged = inRangeInteger(0, 10).ensure(i(5));
    expect(ranged.constraints()).toEqual({ min: 0, max: 10 });
    expect(() => ranged.multiply(3)).toThrow(/above the maximum/); // 15 > 10
  });
});

describe('a bound is set once: re-bounding an already-bounded value throws', () => {
  it('refining an already-bounded value is rejected (mint a fresh value instead)', () => {
    expect(() =>
      nonNegativeInteger.ensure(i(5, { min: 0, max: 100 })),
    ).toThrow(/bound is already set|set once|already.*bound/i);
    expect(() =>
      inRangeInteger(0, 10).ensure(i(5, { min: 0, max: 100 })),
    ).toThrow();
  });
});

describe('asScalar preserves the bound at runtime', () => {
  it('carries the bound onto the recovered scalar', () => {
    expect(
      i(5, { min: 0, max: 10 }).asScalar().constraints(),
    ).toEqual({
      min: 0,
      max: 10,
    });
  });
});

describe('the bound survives arithmetic (constraints intact) — green locks', () => {
  it('keeps .constraints() through every value-producing op', () => {
    const b = i(4, { min: 0, max: 10 });
    expect(b.add(1).constraints()).toEqual({ min: 0, max: 10 });
    expect(b.subtract(1).constraints()).toEqual({ min: 0, max: 10 });
    expect(b.multiply(2).constraints()).toEqual({ min: 0, max: 10 });
    expect(b.clone().constraints()).toEqual({ min: 0, max: 10 });
  });
});

describe('red-hat: the runtime bound keeps the preserved brand honest', () => {
  it('a refinement bound holds through a CHAIN, throwing at the breaching step', () => {
    const nn = nonNegativeInteger.ensure(i(5));
    expect(nn.add(10).value()).toBe(15); // still >= 0, brand honest
    expect(() => nn.add(1).subtract(20)).toThrow(/below the minimum/); // 6 - 20 < 0
  });

  it('withValue re-enforces the bound (an out-of-range value throws)', () => {
    expect(() => i(5, { min: 0, max: 10 }).withValue(50)).toThrow(
      /above the maximum/,
    );
  });

  it('a FACTORY-bound value preserves and enforces through math', () => {
    const { i: level } = createIntegerFactory({ min: 0, max: 10 });
    expect(level(5).multiply(1).value()).toBe(5);
    expect(() => level(5).multiply(3)).toThrow(/above the maximum/); // 15 > 10
  });

  it('the KNOWN is/check gap: `is` narrows without re-minting a bound, so arithmetic on an', () => {
    // is-narrowed UNBOUNDED value is not runtime-backed (documented limitation; use `ensure`). The
    // value stays unbounded, so a below-zero result does NOT throw here.
    const x = i(5);
    if (nonNegativeInteger.is(x)) {
      expect(x.constraints()).toEqual({}); // no bound was minted by `is`
      expect(x.subtract(10).value()).toBe(-5); // unbacked: no throw (the gap)
    }
  });
});
