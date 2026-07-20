import { describe, expect, it } from 'vitest';

import { f, i, isFloat } from '../../support/calipers_tests.src';

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
