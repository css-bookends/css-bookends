import { describe, expect, it } from 'vitest';

import { hardenInteger, i, isInteger } from '../../../src/integer';

describe('Integer primitive (src)', () => {
  it('creates an integer and renders it', () => {
    const n = i(42);
    expect(n.value()).toBe(42);
    expect(n.valueOf()).toBe(42);
    expect(n.css()).toBe('42');
    expect(n.toString()).toBe('42');
    expect(+n).toBe(42);
  });

  it('rejects non-integers and non-finite values', () => {
    expect(() => i(2.5)).toThrow(/expected an integer/);
    expect(() => i(Number.NaN)).toThrow(/finite/);
    expect(() => i(Number.POSITIVE_INFINITY)).toThrow(/finite/);
  });

  it('enforces range constraints', () => {
    expect(() => i(0, { min: 1 })).toThrow(/below the minimum/);
    expect(() => i(11, { max: 10 })).toThrow(/above the maximum/);
    expect(i(5, { min: 1, max: 10 }).value()).toBe(5);
    expect(() => i(5, { min: 10, max: 1 })).toThrow(
      /min .* must be <= max/,
    );
  });

  it('re-validates through arithmetic (hardening survives)', () => {
    expect(i(4).add(2).css()).toBe('6');
    expect(i(4).subtract(1).value()).toBe(3);
    expect(i(4).multiply(3).value()).toBe(12);
    expect(i(4).add(i(2)).value()).toBe(6);
    expect(() => i(5).multiply(0.5)).toThrow(/expected an integer/);
    expect(() => i(5, { max: 10 }).add(20)).toThrow(
      /above the maximum/,
    );
  });

  it('clamps within bounds', () => {
    expect(i(15).clamp(0, 10).value()).toBe(10);
    expect(i(-3).clamp(0, 10).value()).toBe(0);
    expect(() => i(5).clamp(10, 0)).toThrow(/min .* must be <= max/);
  });

  it('hardenInteger binds reusable constraints (font-weight)', () => {
    const fontWeight = hardenInteger({ min: 1, max: 1000 });
    expect(fontWeight(700).css()).toBe('700');
    expect(() => fontWeight(1200)).toThrow(/above the maximum/);
    expect(() => fontWeight(0)).toThrow(/below the minimum/);
  });

  it('detects integers', () => {
    expect(isInteger(i(3))).toBe(true);
    expect(isInteger(3)).toBe(false);
    expect(isInteger({})).toBe(false);
    expect(isInteger(null)).toBe(false);
  });
});
