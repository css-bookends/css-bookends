import { describe, expect, it } from 'vitest';

import { f, i, isFloat, r } from '../../support/calipers_tests.src';

describe('Float primitive (src)', () => {
  it('creates a float and renders it', () => {
    const n = f(0.5);
    expect(n.value()).toBe(0.5);
    expect(n.valueOf()).toBe(0.5);
    expect(n.css()).toBe('0.5');
    expect(n.toString()).toBe('0.5');
    expect(+n).toBe(0.5);
  });

  it('renders small magnitudes as plain decimals (no scientific notation)', () => {
    expect(f(0.0000001).css()).toBe('0.0000001');
    expect(f(-0.0000001).css()).toBe('-0.0000001');
  });

  it('rejects non-finite values', () => {
    expect(() => f(Number.NaN)).toThrow(/finite/);
    expect(() => f(Number.POSITIVE_INFINITY)).toThrow(/finite/);
  });

  it('enforces range constraints', () => {
    expect(() => f(-0.1, { min: 0 })).toThrow(/below the minimum/);
    expect(() => f(1.1, { max: 1 })).toThrow(/above the maximum/);
    expect(f(0.5, { min: 0, max: 1 }).value()).toBe(0.5);
  });

  it('re-validates through arithmetic (hardening survives)', () => {
    expect(f(0.5).add(0.25).css()).toBe('0.75');
    expect(f(0.5).add(f(0.25)).value()).toBe(0.75);
    expect(() => f(0.5, { min: 0, max: 1 }).add(0.6)).toThrow(
      /above the maximum/,
    );
  });

  it('clamps within bounds', () => {
    expect(f(1.5).clamp(0, 1).value()).toBe(1);
    expect(f(-0.5).clamp(0, 1).value()).toBe(0);
  });

  it('a per-value bound enforces reusable constraints (opacity)', () => {
    const opacity = (v: number) => f(v, { min: 0, max: 1 });
    expect(opacity(0.25).css()).toBe('0.25');
    expect(() => opacity(1.5)).toThrow(/above the maximum/);
    expect(() => opacity(-0.5)).toThrow(/below the minimum/);
  });

  it('a bounded value RE-VALIDATES its bound through arithmetic', () => {
    // a bounded value clones with the SAME constraints, so a result that leaves
    // [min, max] throws. This proves the bound survives arithmetic, not just .css().
    const opacity = (v: number) => f(v, { min: 0, max: 1 });
    // in-range arithmetic still yields a hardened float
    expect(opacity(0.5).add(0.25).value()).toBe(0.75);
    expect(opacity(0.4).multiply(2).value()).toBe(0.8);
    // crossing the upper bound throws on the re-validation
    expect(() => opacity(0.8).add(0.3)).toThrow(/above the maximum/);
    expect(() => opacity(0.6).multiply(2)).toThrow(
      /above the maximum/,
    );
    // crossing the lower bound throws too
    expect(() => opacity(0.2).subtract(0.5)).toThrow(
      /below the minimum/,
    );
  });

  it('interoperates with typed scalar operands (i / f)', () => {
    expect(f(1.5).multiply(i(2)).css()).toBe('3');
    expect(f(0.5).multiply(f(2)).css()).toBe('1');
    // cross-type add / subtract
    expect(f(1.5).add(i(2)).css()).toBe('3.5');
    expect(f(1.5).subtract(f(0.5)).css()).toBe('1');
  });

  it('divides (no integer-ness constraint, just finiteness)', () => {
    expect(f(3).divide(f(1.5)).css()).toBe('2');
    expect(f(6).divide(i(2)).css()).toBe('3');
    // divide by zero throws (plain number and typed zero)
    expect(() => f(1).divide(0)).toThrow(/divide .* by zero/);
    expect(() => f(1).divide(f(0))).toThrow(/divide .* by zero/);
  });

  it('throws on a non-finite divide RESULT (overflow), distinct from divide-by-zero', () => {
    // a finite value over a finite, non-zero divisor can still overflow to Infinity.
    // This is the dedicated guard AFTER the zero check, with its own message.
    expect(() => f(Number.MAX_VALUE).divide(1e-300)).toThrow(
      /non-finite result dividing/,
    );
    // the divisor is non-zero, so it is NOT the divide-by-zero message.
    expect(() => f(Number.MAX_VALUE).divide(1e-300)).not.toThrow(
      /by zero/,
    );
  });

  it('rejects a constructor range where min > max', () => {
    expect(() => f(0.5, { min: 1, max: 0 })).toThrow(
      /min .* must be <= max/,
    );
    // the context suffix is included in the message.
    expect(() =>
      f(0.5, { min: 1, max: 0, context: 'opacity.token' }),
    ).toThrow(/\[opacity\.token\]/);
  });

  it('clamp rejects a min > max range', () => {
    expect(() => f(0.5).clamp(1, 0)).toThrow(
      /f\.clamp: min .* must be <= max/,
    );
  });

  it('reports its constraints via constraints()', () => {
    expect(f(0.5, { min: 0, max: 1 }).constraints()).toEqual({
      min: 0,
      max: 1,
    });
    // an unbounded float reports undefined bounds.
    expect(f(0.5).constraints()).toEqual({
      min: undefined,
      max: undefined,
    });
  });

  it('detects floats', () => {
    expect(isFloat(f(1.2))).toBe(true);
    expect(isFloat(1.2)).toBe(false);
    expect(isFloat({})).toBe(false);
    expect(isFloat(null)).toBe(false);
  });

  it('reports its kind() as "f"', () => {
    expect(f(1.2).kind()).toBe('f');
  });

  it('clone() copies the value and the bound', () => {
    const orig = f(0.25, { min: 0, max: 1 });
    const copy = orig.clone();
    expect(copy.value()).toBe(0.25);
    expect(copy.constraints()).toEqual(orig.constraints());
    expect(copy.constraints()).toEqual({ min: 0, max: 1 });
  });

  it('clone is independent: deriving from the ORIGINAL leaves the clone untouched', () => {
    // Scalars are immutable, so "editing" means deriving a new value. That derivation must
    // not leak into the clone. (Regression lock: green today, guards a future shared-state slip.)
    const orig = f(0.25, { min: 0, max: 1 });
    const copy = orig.clone();
    const derived = orig.withValue(0.75);
    expect(derived.value()).toBe(0.75); // the derived value did change
    expect(copy.value()).toBe(0.25); // the clone did NOT
    expect(copy.constraints()).toEqual({ min: 0, max: 1 });
  });

  it('clone is independent: deriving from the CLONE leaves the original untouched', () => {
    const orig = f(0.25, { min: 0, max: 1 });
    const copy = orig.clone();
    const derived = copy.multiply(1).withValue(0.75);
    expect(derived.value()).toBe(0.75);
    expect(orig.value()).toBe(0.25);
    expect(orig.constraints()).toEqual({ min: 0, max: 1 });
  });
});

// f accepts an r as its value (see docs/pure-values.md), coercing via r.valueOf() (= n/d).
// RED until f's input widens to `number | IRatio`: today f(r(...)) passes the ratio object straight through
// and throws "expected a finite number". No exact-rational storage yet (see docs/pure-values.md).
describe('f accepts an r value', () => {
  it('coerces an integer ratio to its decimal value', () => {
    expect(f(r(9, 10)).value()).toBe(0.9);
    expect(f(r(1, 4)).value()).toBe(0.25);
    expect(f(r(i(3), i(2))).value()).toBe(1.5);
    expect(f(r(3)).value()).toBe(3); // 3/1
  });

  it('coerces a non-integer ratio too (still just the double for now) and renders it', () => {
    expect(f(r(1.5, 2)).value()).toBe(0.75);
    expect(f(r(1, 4)).css()).toBe('0.25');
  });

  it('accepts an r with bounds, coercing THEN enforcing', () => {
    expect(f(r(1, 2), { min: 0, max: 1 }).value()).toBe(0.5);
    expect(() => f(r(3, 2), { min: 0, max: 1 })).toThrow(/maximum/i); // 1.5 > 1
  });
});

// Exact rational arithmetic (see docs/pure-values.md): when a float carries an exact rational (built from
// an integer r) and its operand is pure too (a rational-carrying scalar or an integer, trivially n/1),
// `+ - * /` stay symbolic, so the result is the exact value, not a drifted double. One impure operand
// taints the result back to the plain double. Only the ENGINE ships here; the decimal-literal spelling
// (f(0.1)) becomes pure at the auto-detect slice, so these drive purity from r-sourced floats + integers.
describe('exact rational arithmetic (see docs/pure-values.md)', () => {
  it('divides two r-sourced floats exactly (no 0.3 / 0.1 artifact)', () => {
    // 3/10 / 1/10 = 3, where the naive double is 2.9999999999999996
    expect(
      f(r(3, 10))
        .divide(f(r(1, 10)))
        .value(),
    ).toBe(3);
    expect(0.3 / 0.1).not.toBe(3); // the artifact this fixes
  });

  it('adds two r-sourced floats exactly (no 0.1 + 0.2 drift)', () => {
    // 1/10 + 2/10 = 3/10 = 0.3, where 0.1 + 0.2 = 0.30000000000000004
    expect(
      f(r(1, 10))
        .add(f(r(2, 10)))
        .value(),
    ).toBe(0.3);
    expect(0.1 + 0.2).not.toBe(0.3); // the drift this fixes
  });

  it('subtracts two r-sourced floats exactly (no 0.3 - 0.1 drift)', () => {
    // 3/10 - 1/10 = 2/10 = 0.2, where 0.3 - 0.1 = 0.19999999999999998
    expect(
      f(r(3, 10))
        .subtract(f(r(1, 10)))
        .value(),
    ).toBe(0.2);
    expect(0.3 - 0.1).not.toBe(0.2); // the drift this fixes
  });

  it('multiplies exactly, an integer operand trivially n/1 (no 0.1 * 3 drift)', () => {
    // 1/10 * 3 = 3/10 = 0.3, where 0.1 * 3 = 0.30000000000000004
    expect(f(r(1, 10)).multiply(i(3)).value()).toBe(0.3);
    expect(0.1 * 3).not.toBe(0.3); // the drift this fixes
    // 1/10 * 1/10 = 1/100 = 0.01, where 0.1 * 0.1 = 0.010000000000000002
    expect(
      f(r(1, 10))
        .multiply(f(r(1, 10)))
        .value(),
    ).toBe(0.01);
  });

  it('taints back to the plain double when an operand is genuinely impure', () => {
    // an irrational operand cannot be promoted, so it taints: a pure receiver + impure operand -> double.
    expect(f(r(1, 2)).add(f(Math.PI)).value()).toBe(0.5 + Math.PI);
    // 17-digit float-noise (0.1 + 0.2) is not promoted either, so it taints a pure receiver too.
    expect(
      f(r(1, 10))
        .add(f(0.1 + 0.2))
        .value(),
    ).toBe(0.1 + (0.1 + 0.2));
  });

  it('does not throw when a rational chain overflows safe-integer range', () => {
    // a denominator blow-up past 2^53 cannot be trusted, so it falls back to the double (no throw, no
    // false-exact claim).
    const huge = f(r(1, 9007199254740991)); // denominator at the safe-integer edge
    expect(() => huge.multiply(huge)).not.toThrow();
    expect(Number.isFinite(huge.multiply(huge).value())).toBe(true);
  });

  it('a clone of a pure value keeps arithmetic exact', () => {
    // clone preserves the rational (see docs/pure-values.md), so the copy is still exact.
    expect(
      f(r(1, 10))
        .clone()
        .add(f(r(2, 10)))
        .value(),
    ).toBe(0.3);
  });
});

// Auto-detect clean decimal literals (see docs/pure-values.md): a short terminating decimal like f(0.1) is
// promoted to its exact rational, so plain-decimal arithmetic is exact. Float-noise and irrationals stay
// impure doubles (no fabricated fraction). The digit cutoff is config-driven (cleanDecimalDigits, default 3).
describe('auto-detects clean decimal literals (see docs/pure-values.md)', () => {
  it('makes plain-decimal arithmetic exact (the 0.1 + 0.2 payoff)', () => {
    expect(f(0.1).add(f(0.2)).value()).toBe(0.3);
    expect(f(0.3).divide(f(0.1)).value()).toBe(3);
    expect(f(0.1).multiply(i(3)).value()).toBe(0.3);
    // a mixed r-sourced + auto-detected chain: 1/3 * 3/10 = 1/10
    expect(f(r(1, 3)).multiply(f(0.3)).value()).toBe(0.1);
  });

  it('leaves float-noise and irrationals impure (no fabricated fraction)', () => {
    // 0.1 + 0.2 is 17-digit noise, so it is NOT promoted: subtracting the pure 0.2 drifts instead of
    // landing on the 0.1 that a wrongly-promoted 3/10 would give.
    expect(
      f(0.1 + 0.2)
        .subtract(f(0.2))
        .value(),
    ).not.toBe(0.1);
    expect(f(Math.PI).multiply(i(2)).value()).toBe(Math.PI * 2);
  });

  it('rejects a cleanDecimalDigits outside [0, 15]', () => {
    // fail-fast on a nonsensical cutoff: negative, past the safe-integer power-of-ten limit (15), or fractional.
    expect(() => f(0.5, { cleanDecimalDigits: -1 })).toThrow(
      /cleanDecimalDigits/,
    );
    expect(() => f(0.5, { cleanDecimalDigits: 16 })).toThrow(
      /cleanDecimalDigits/,
    );
    expect(() => f(0.5, { cleanDecimalDigits: 1.5 })).toThrow(
      /cleanDecimalDigits/,
    );
    // the edges are allowed (0 = integers only, 15 = the safe-integer limit)
    expect(f(0.5, { cleanDecimalDigits: 0 }).value()).toBe(0.5);
    expect(f(0.5, { cleanDecimalDigits: 15 }).value()).toBe(0.5);
  });
});
