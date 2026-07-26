// Core tests against the src surface, driven through the codex bundle, which
// exposes the whole bound CoreApi surface (m + unit helpers + builders + guards).
// The bare root exports are removed in later steps; the bundle is the stable
// source for the harness.
import { describe, expect, it } from 'vitest';

import {
  bundle,
  f,
  i,
  m,
  makeUnitHelperFromDefinition,
  r,
} from '../../support/calipers_tests.src';
import type { CoreApi } from './core.shared';
import { runCoreTests } from './core.shared';

const api = bundle as unknown as CoreApi;

runCoreTests('src', api);

describe('Measurement arithmetic with typed scalar operands (i / f)', () => {
  it('multiplies by a typed integer or float factor', () => {
    expect(m(8).multiply(i(2)).css()).toBe('16px');
    expect(m(8).multiply(f(1.5)).css()).toBe('12px');
    // plain-number factors still work
    expect(m(8).multiply(2).css()).toBe('16px');
  });

  it('divides by a typed integer or float divisor', () => {
    expect(m(8).divide(i(2)).css()).toBe('4px');
    expect(m(9).divide(f(1.5)).css()).toBe('6px');
    // plain-number divisors still work
    expect(m(8).divide(2).css()).toBe('4px');
  });

  it('throws when the typed divisor is zero (delegated to the embedded scalar)', () => {
    expect(() => m(8).divide(i(0))).toThrow(
      /cannot divide .* by zero/,
    );
    expect(() => m(8).divide(f(0))).toThrow(
      /cannot divide .* by zero/,
    );
  });
});

describe('m() accepts typed scalar (i / f) inputs', () => {
  it('builds a measurement from an integer or float value', () => {
    expect(m(i(4)).css()).toBe('4px');
    expect(m(f(1.5)).css()).toBe('1.5px');
  });

  it('honours the unit + options forms with a typed scalar value', () => {
    expect(m(i(4), 'rem').css()).toBe('4rem');
    expect(m(f(2.5), { unit: 'em' }).css()).toBe('2.5em');
  });

  it('plain numbers still work unchanged', () => {
    expect(m(8).css()).toBe('8px');
    expect(m(8, 'rem').css()).toBe('8rem');
  });
});

// A bounded / modified measurement is now built by handing `m` a CONFIGURED scalar (`m` itself is a
// pure container). The bound + modifier ride on the ingested `i` / `f`; `m` only attaches the unit
// and delegates. (Passing the bound / modifier directly to `m` is a compile-time error, locked in
// tests/types/m.test-d.ts.)
describe('a bounded / modified measurement is built from a configured scalar', () => {
  it('a bound rides on the ingested scalar, surfaced through m.constraints()', () => {
    expect(m(i(8, { min: 0, max: 10 }), 'px').constraints()).toEqual({
      min: 0,
      max: 10,
    });
    // out-of-range LITERAL is a compile error; cast to a runtime `number` to test the runtime throw.
    expect(() =>
      m(i(50 as number, { min: 0, max: 10 }), 'px'),
    ).toThrow(/above the maximum/);
  });

  it('a modifier rides on the ingested scalar, applied at intake before m wraps it', () => {
    const wrap = (n: number) => ((n % 360) + 360) % 360;
    expect(m(f(400, { modifier: wrap }), 'deg').value()).toBe(40);
    // modify THEN bound: 450 -> 90, within [0, 360]
    expect(
      m(f(450, { min: 0, max: 360, modifier: wrap }), 'deg').value(),
    ).toBe(90);
  });
});

describe('unit helpers are config-free (like m)', () => {
  it('a helper attaches only its unit; it carries no bound or modifier', () => {
    const deg = makeUnitHelperFromDefinition('mDeg');
    expect(deg(45).css()).toBe('45deg');
    expect(deg(45).constraints()).toEqual({
      min: undefined,
      max: undefined,
    });

    const level = makeUnitHelperFromDefinition('mPercent');
    expect(level(50).css()).toBe('50%');
    expect(level(50).constraints()).toEqual({
      min: undefined,
      max: undefined,
    });
  });

  it('a bounded unit measurement is built by handing m a bounded scalar', () => {
    // The helper stays config-free, so a bounded angle rides on the scalar handed to m().
    expect(m(i(50, { min: 0, max: 100 }), '%').constraints()).toEqual(
      { min: 0, max: 100 },
    );
    expect(() =>
      m(i(150 as number, { min: 0, max: 100 }), '%'),
    ).toThrow(/above the maximum/);
  });
});

describe('Measurement clone()', () => {
  // The bound rides on the ingested scalar (m is a pure container), so clone must preserve the
  // embedded scalar's bound through the copy.
  it('copies the value, unit, and the ingested scalar bound', () => {
    const orig = m(i(8, { min: 0, max: 10 }), 'px');
    const copy = orig.clone();
    expect(copy.value()).toBe(8);
    expect(copy.unit()).toBe('px');
    expect(copy.css()).toBe('8px');
    expect(copy.constraints()).toEqual(orig.constraints());
    expect(copy.constraints()).toEqual({ min: 0, max: 10 });
  });

  it('is independent: deriving from the ORIGINAL leaves the clone untouched', () => {
    // Measurements are immutable, so "editing" means deriving a new value. That derivation
    // must not leak into the clone. (Regression lock: guards a future shared-state slip.)
    const orig = m(i(8, { min: 0, max: 10 }), 'px');
    const copy = orig.clone();
    const derived = orig.add(1);
    expect(derived.value()).toBe(9);
    expect(copy.value()).toBe(8);
    expect(copy.constraints()).toEqual({ min: 0, max: 10 });
  });

  it('is independent: deriving from the CLONE leaves the original untouched', () => {
    const orig = m(i(8, { min: 0, max: 10 }), 'px');
    const copy = orig.clone();
    const derived = copy.multiply(1).add(1);
    expect(derived.value()).toBe(9);
    expect(orig.value()).toBe(8);
    expect(orig.constraints()).toEqual({ min: 0, max: 10 });
  });
});

// See docs/pure-values.md: m accepts an r by WRAPPING it in a float and ingesting that (m is a pure container;
// purity is f's / r's concern, not m's). RED until the ingest wraps a ratio: today m(r) embeds the ratio
// object as the scalar and m.value() calls r.value() (not a function) -> throws.
describe('m accepts an r value', () => {
  it('wraps a ratio in a float and ingests it', () => {
    expect(m(r(9, 10), 'px').value()).toBe(0.9);
    expect(m(r(9, 10), 'px').css()).toBe('0.9px');
    expect(m(r(1, 4), 'em').css()).toBe('0.25em');
    expect(m(r(i(10), i(3)), 'px').value()).toBeCloseTo(10 / 3);
  });
});

// Exact rational arithmetic through m (see docs/pure-values.md): m delegates to its embedded scalar, so a
// chain that passes through a non-terminating intermediate (10/3) still resolves exactly when it lands on
// a whole value. The embedded scalar must accept non-integers (a bare-number `u` or an `f`); an embedded
// `i` rejects the fractional step and throws, which is why these use m(f(10)) / m(10), not m(i(10)).
describe('exact rational arithmetic through m (see docs/pure-values.md)', () => {
  it('keeps a divide-then-multiply chain exact (1/10 * 3 = 0.3, no drift)', () => {
    // m delegates to the embedded scalar; 1/10 stays symbolic, so * 3 is exactly 0.3, not the drifted
    // 0.30000000000000004.
    expect(m(f(1)).divide(i(10)).multiply(i(3)).value()).toBe(0.3);
    // a bare number embeds a `u` (integer-valued, trivially n/1), so it is exact too
    expect(m(1).divide(i(10)).multiply(i(3)).value()).toBe(0.3);
    expect(0.1 * 3).not.toBe(0.3); // the drift this avoids
  });

  it('carries an r-sourced rational through m (embedUnder preserves it) and stays exact', () => {
    // m(r(1, 10)) wraps the ratio in a pure f; embedding under the m wrapper must keep the rational, so
    // * 3 is exactly 0.3px, not the drifted 0.30000000000000004.
    expect(m(r(1, 10), 'px').multiply(i(3)).value()).toBe(0.3);
    expect(m(r(1, 10), 'px').multiply(i(3)).css()).toBe('0.3px');
  });

  it('an embedded i still rejects a fractional intermediate (purity does not bypass the kind)', () => {
    // m(i(10)) embeds an integer scalar, so a divide that goes fractional throws BEFORE any later op:
    // the exact-rational engine does not relax the integer invariant.
    expect(() => m(i(10)).divide(i(3))).toThrow(/integer/i);
  });
});
