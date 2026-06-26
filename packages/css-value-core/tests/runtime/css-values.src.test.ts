import { describe, expect, it } from 'vitest';

import {
  createCssValues,
  fontWeight,
  opacity,
  zIndex,
} from '../../src';

describe('CSS-value helper layer (src)', () => {
  it('renders a constrained float', () => {
    expect(opacity(0.5).css()).toBe('0.5');
    expect(opacity(0.5).toString()).toBe('0.5');
    expect(opacity(0.5).value()).toBe(0.5);
    expect(opacity(0).css()).toBe('0');
    expect(opacity(1).css()).toBe('1');
  });

  it('throws on an out-of-range number by default', () => {
    expect(() => opacity(1.5)).toThrow(/above the maximum/);
    expect(() => opacity(-0.5)).toThrow(/below the minimum/);
  });

  it('clamps a number when asked per-call', () => {
    expect(opacity(1.5, { outOfRange: 'clamp' }).css()).toBe('1');
    expect(opacity(-0.5, { outOfRange: 'clamp' }).css()).toBe('0');
    // in-range values are untouched by clamp.
    expect(opacity(0.25, { outOfRange: 'clamp' }).css()).toBe('0.25');
  });

  it('passes keywords through untouched', () => {
    expect(zIndex('auto').css()).toBe('auto');
    expect(zIndex('auto').value()).toBe('auto');
    expect(zIndex('auto').toString()).toBe('auto');
  });

  it('rejects an unknown keyword at runtime', () => {
    // @ts-expect-error - 'nope' is not a zIndex keyword
    expect(() => zIndex('nope')).toThrow(/not a valid keyword/);
  });

  it('enforces integer-ness on int rows', () => {
    expect(zIndex(2).css()).toBe('2');
    expect(zIndex(-3).css()).toBe('-3');
    expect(() => zIndex(2.5)).toThrow(/expected an integer/);
  });

  it('enforces a specific range (font-weight)', () => {
    expect(fontWeight(700).css()).toBe('700');
    expect(fontWeight(1).css()).toBe('1');
    expect(fontWeight(1000).css()).toBe('1000');
    expect(() => fontWeight(1200)).toThrow(/above the maximum/);
    expect(() => fontWeight(0)).toThrow(/below the minimum/);
  });

  it('accepts font-weight keywords', () => {
    expect(fontWeight('bold').css()).toBe('bold');
    expect(fontWeight('normal').css()).toBe('normal');
  });

  it('takes its out-of-range policy from the instance default', () => {
    const clamped = createCssValues({ outOfRange: 'clamp' });
    // instance default clamps.
    expect(clamped.opacity(1.5).css()).toBe('1');
    expect(clamped.opacity(-0.5).css()).toBe('0');
    // a per-call override beats the instance default.
    expect(() =>
      clamped.opacity(1.5, { outOfRange: 'throw' }),
    ).toThrow(/above the maximum/);
  });

  it('defaults to throw when no config is given', () => {
    const strict = createCssValues();
    expect(() => strict.opacity(1.5)).toThrow(/above the maximum/);
    expect(strict.opacity(0.5).css()).toBe('0.5');
  });

  it('clamps to whichever single bound exists (one-directional)', () => {
    const instance = createCssValues({ outOfRange: 'clamp' });
    // flexGrow has min 0 and no max: a high value has no max to clamp to, so
    // it stays as-is (nothing to clamp the high side against).
    expect(instance.flexGrow(5).css()).toBe('5');
    // below the min clamps UP to the min: the bound on that side exists, so
    // clamp pulls the value to it (one-directional, the sensible direction).
    expect(instance.flexGrow(-1).css()).toBe('0');
    // clamp fixes RANGE, not integer-ness: an in-range non-integer on an int
    // row still throws, because clamping it makes no sense (throw by default).
    expect(() => instance.columnCount(2.5)).toThrow(
      /expected an integer/,
    );
  });
});
