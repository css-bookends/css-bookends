/* eslint-disable no-restricted-syntax -- this whole file tests the scalar factories;
   every create{Integer,Float,Ratio}() call is the subject under test. */
// Direct behavioral tests for the scalar factories `createInteger` / `createFloat`.
// They were only reached indirectly through the bundle cascade; the split turns each
// into its own package, so drive the factory directly here: the configured bound,
// `errorConfig`, and modifier must reach the bound `i` / `f` helper it returns.
import { describe, expect, it } from 'vitest';

import { createFloat } from '../../../src/float';
import { createInteger } from '../../../src/integer';
import { createRatio } from '../../../src/ratio';

describe('createInteger (direct factory behavior)', () => {
  it('binds an i that throws on a breached bound', () => {
    const c = createInteger();
    expect(() => c.i(8, { min: 0, max: 10 }).multiply(2)).toThrow(
      /maximum/,
    ); // 16 > 10
  });
});

describe('createFloat (direct factory behavior)', () => {
  it('binds an f that throws on a breached bound', () => {
    const c = createFloat();
    expect(() => c.f(0.6, { min: 0, max: 1 }).multiply(2)).toThrow(
      /maximum/,
    ); // 1.2 > 1
  });
});

describe('createRatio (direct factory behavior)', () => {
  it('binds an r that builds ratios', () => {
    const { r } = createRatio();
    expect(r(16, 9).css()).toBe('16/9');
  });

  it('tolerates an empty config and exposes isRatio', () => {
    const c = createRatio({});
    expect(c.isRatio(c.r(16, 9))).toBe(true);
    expect(c.isRatio(42)).toBe(false);
  });
});

describe('scalar errorConfig (stackHints) rendering', () => {
  const captureMessage = (fn: () => void): string => {
    try {
      fn();
    } catch (error) {
      return (error as Error).message;
    }
    return '';
  };

  it('createInteger renders a stack hint when stackHints is "on"', () => {
    const c = createInteger({ errorConfig: { stackHints: 'on' } });
    expect(
      captureMessage(() => c.i(8, { min: 0, max: 10 }).multiply(2)),
    ).toContain('stack=');
  });

  it('createInteger omits the stack hint when stackHints is "off"', () => {
    const c = createInteger({ errorConfig: { stackHints: 'off' } });
    expect(
      captureMessage(() => c.i(8, { min: 0, max: 10 }).multiply(2)),
    ).not.toContain('stack=');
  });

  it('createFloat renders a stack hint when stackHints is "on"', () => {
    const c = createFloat({ errorConfig: { stackHints: 'on' } });
    expect(
      captureMessage(() => c.f(0.6, { min: 0, max: 1 }).multiply(2)),
    ).toContain('stack=');
  });

  it('createRatio renders a stack hint on a structural error when stackHints is "on"', () => {
    const c = createRatio({ errorConfig: { stackHints: 'on' } });
    // a zero denominator is a structural ratio error (always throws).
    expect(captureMessage(() => c.r(1, 0))).toContain('stack=');
  });
});

describe('scalar factory bounds (min / max)', () => {
  it('createInteger bakes a factory bound every value inherits (fontWeight 100..900)', () => {
    const { i: fontWeight } = createInteger({ min: 100, max: 900 });
    expect(fontWeight(400).constraints()).toEqual({
      min: 100,
      max: 900,
    });
    expect(() => fontWeight(50)).toThrow(/minimum/);
    expect(() => fontWeight(1000)).toThrow(/maximum/);
  });

  it('createInteger rejects a per-call bound when the factory already sets one', () => {
    const { i: fontWeight } = createInteger({ min: 100, max: 900 });
    expect(() => fontWeight(400, { min: 0, max: 1000 })).toThrow(
      /already set/,
    );
  });

  it('createInteger with no factory bound still takes a per-call bound', () => {
    const { i } = createInteger();
    expect(i(5, { min: 0, max: 10 }).constraints()).toEqual({
      min: 0,
      max: 10,
    });
  });

  it('createFloat bakes a factory bound (opacity 0..1)', () => {
    const { f: opacity } = createFloat({ min: 0, max: 1 });
    expect(opacity(0.5).constraints()).toEqual({ min: 0, max: 1 });
    expect(() => opacity(2)).toThrow(/maximum/);
    expect(() => opacity(0.5, { min: 0, max: 1 })).toThrow(
      /already set/,
    );
  });

  it('createInteger bakes a modifier the whole domain inherits', () => {
    const { i: weight } = createInteger({
      min: 100,
      max: 900,
      modifier: (n) => Math.round(n / 100) * 100,
    });
    // 100 * 2.2 = 220 -> snapped to the nearest 100 -> 200
    expect(weight(100).multiply(2.2).value()).toBe(200);
  });

  it('createFloat bakes a modifier (e.g. a floor shortcut)', () => {
    const { f: down } = createFloat({ modifier: 'floor' });
    expect(down(2.9).value()).toBe(2);
  });
});
