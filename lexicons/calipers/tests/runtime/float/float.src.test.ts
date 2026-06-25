import { describe, expect, it } from 'vitest';

import { f, hardenFloat, isFloat } from '../../../src/float';

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

  it('hardenFloat binds reusable constraints (opacity)', () => {
    const opacity = hardenFloat({ min: 0, max: 1 });
    expect(opacity(0.25).css()).toBe('0.25');
    expect(() => opacity(1.5)).toThrow(/above the maximum/);
    expect(() => opacity(-0.5)).toThrow(/below the minimum/);
  });

  it('detects floats', () => {
    expect(isFloat(f(1.2))).toBe(true);
    expect(isFloat(1.2)).toBe(false);
    expect(isFloat({})).toBe(false);
    expect(isFloat(null)).toBe(false);
  });
});
