/* eslint-disable no-restricted-syntax -- this whole file tests the scalar factories;
   every create{Integer,Float,Ratio}() call is the subject under test. */
// Direct behavioral tests for the scalar factories `createIntegerFactory` / `createFloatFactory`.
// They were only reached indirectly through the bundle cascade; the split turns each
// into its own package, so drive the factory directly here: the configured bound,
// `errorConfig`, and modifier must reach the bound `i` / `f` helper it returns.
import { describe, expect, it } from 'vitest';

import { createFloatFactory } from '../../../src/float';
import { createIntegerFactory } from '../../../src/integer';
import { createRatioFactory } from '../../../src/ratio';

describe('createIntegerFactory (direct factory behavior)', () => {
  it('binds an i that throws on a breached bound', () => {
    const c = createIntegerFactory();
    expect(() => c.i(8, { min: 0, max: 10 }).multiply(2)).toThrow(
      /maximum/,
    ); // 16 > 10
  });
});

describe('createFloatFactory (direct factory behavior)', () => {
  it('binds an f that throws on a breached bound', () => {
    const c = createFloatFactory();
    expect(() => c.f(0.6, { min: 0, max: 1 }).multiply(2)).toThrow(
      /maximum/,
    ); // 1.2 > 1
  });
});

describe('createRatioFactory (direct factory behavior)', () => {
  it('binds an r that builds ratios', () => {
    const { r } = createRatioFactory();
    expect(r(16, 9).css()).toBe('16/9');
  });

  it('tolerates an empty config and exposes isRatio', () => {
    const c = createRatioFactory({});
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

  it('createIntegerFactory renders a stack hint when stackHints is "on"', () => {
    const c = createIntegerFactory({
      errorConfig: { stackHints: 'on' },
    });
    expect(
      captureMessage(() => c.i(8, { min: 0, max: 10 }).multiply(2)),
    ).toContain('stack=');
  });

  it('createIntegerFactory omits the stack hint when stackHints is "off"', () => {
    const c = createIntegerFactory({
      errorConfig: { stackHints: 'off' },
    });
    expect(
      captureMessage(() => c.i(8, { min: 0, max: 10 }).multiply(2)),
    ).not.toContain('stack=');
  });

  it('createFloatFactory renders a stack hint when stackHints is "on"', () => {
    const c = createFloatFactory({
      errorConfig: { stackHints: 'on' },
    });
    expect(
      captureMessage(() => c.f(0.6, { min: 0, max: 1 }).multiply(2)),
    ).toContain('stack=');
  });

  it('createRatioFactory renders a stack hint on a structural error when stackHints is "on"', () => {
    const c = createRatioFactory({
      errorConfig: { stackHints: 'on' },
    });
    // a zero denominator is a structural ratio error (always throws).
    expect(captureMessage(() => c.r(1, 0))).toContain('stack=');
  });
});

describe('scalar factory bounds (min / max)', () => {
  it('createIntegerFactory bakes a factory bound every value inherits (fontWeight 100..900)', () => {
    const { i: fontWeight } = createIntegerFactory({
      min: 100,
      max: 900,
    });
    expect(fontWeight(400).constraints()).toEqual({
      min: 100,
      max: 900,
    });
    expect(() => fontWeight(50)).toThrow(/minimum/);
    expect(() => fontWeight(1000)).toThrow(/maximum/);
  });

  it('createIntegerFactory rejects a per-call bound when the factory already sets one', () => {
    const { i: fontWeight } = createIntegerFactory({
      min: 100,
      max: 900,
    });
    expect(() => fontWeight(400, { min: 0, max: 1000 })).toThrow(
      /already set/,
    );
  });

  it('createIntegerFactory with no factory bound still takes a per-call bound', () => {
    const { i } = createIntegerFactory();
    expect(i(5, { min: 0, max: 10 }).constraints()).toEqual({
      min: 0,
      max: 10,
    });
  });

  it('createFloatFactory bakes a factory bound (opacity 0..1)', () => {
    const { f: opacity } = createFloatFactory({ min: 0, max: 1 });
    expect(opacity(0.5).constraints()).toEqual({ min: 0, max: 1 });
    expect(() => opacity(2)).toThrow(/maximum/);
    expect(() => opacity(0.5, { min: 0, max: 1 })).toThrow(
      /already set/,
    );
  });

  it('createIntegerFactory bakes a modifier the whole domain inherits', () => {
    const { i: weight } = createIntegerFactory({
      min: 100,
      max: 900,
      modifier: (n) => Math.round(n / 100) * 100,
    });
    // 100 * 2.2 = 220 -> snapped to the nearest 100 -> 200
    expect(weight(100).multiply(2.2).value()).toBe(200);
  });

  it('createFloatFactory bakes a modifier (e.g. a floor shortcut)', () => {
    const { f: down } = createFloatFactory({ modifier: 'floor' });
    expect(down(2.9).value()).toBe(2);
  });
});
