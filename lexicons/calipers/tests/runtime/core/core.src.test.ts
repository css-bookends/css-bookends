// Core tests against the src surface, driven through the codex bundle, which
// exposes the whole bound CoreApi surface (m + unit helpers + builders + guards).
// The bare root exports are removed in later steps; the bundle is the stable
// source for the harness.
import { describe, expect, it } from 'vitest';

import {
  bundle,
  f,
  hardenInteger,
  i,
  m,
  makeUnitHelperFromDefinition,
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

  it('throws CALIPERS_E_DIVIDE_BY_ZERO when the typed divisor is zero', () => {
    expect(() => m(8).divide(i(0))).toThrow(
      /CALIPERS_E_DIVIDE_BY_ZERO/,
    );
    expect(() => m(8).divide(f(0))).toThrow(
      /CALIPERS_E_DIVIDE_BY_ZERO/,
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

describe('m() options: direct bound + input modifier', () => {
  it('m(v, { min, max }) stores a direct bound, checked at construction', () => {
    expect(
      m(8, { unit: 'px', min: 0, max: 10 }).constraints(),
    ).toEqual({ min: 0, max: 10 });
    expect(() => m(50, { unit: 'px', min: 0, max: 10 })).toThrow(
      /outside the bound/,
    );
  });

  it('the input modifier transforms the value at intake, before validation', () => {
    const wrap = (n: number) => ((n % 360) + 360) % 360;
    expect(m(400, { unit: 'deg', modifier: wrap }).value()).toBe(40);
    // modify THEN bound: 450 -> 90, within [0, 360]
    expect(
      m(450, {
        unit: 'deg',
        min: 0,
        max: 360,
        modifier: wrap,
      }).value(),
    ).toBe(90);
  });

  it('a direct bound + an ingested-scalar bound together throw (set once)', () => {
    expect(() =>
      m(hardenInteger({ min: 0, max: 10 })(8), {
        unit: 'px',
        min: 0,
        max: 5,
      }),
    ).toThrow(/one source/);
  });
});

describe('unit helper config: modifier + bound on a purpose-built helper', () => {
  it('a helper built with a modifier normalizes its input (wrapping angle)', () => {
    const wrap = (n: number) => ((n % 360) + 360) % 360;
    const hue = makeUnitHelperFromDefinition('mDeg', {
      modifier: wrap,
    });
    expect(hue(450).css()).toBe('90deg');
    expect(hue(45).css()).toBe('45deg');
  });

  it('a helper built with a bound checks it at construction', () => {
    const level = makeUnitHelperFromDefinition('mPercent', {
      min: 0,
      max: 100,
    });
    expect(level(50).constraints()).toEqual({ min: 0, max: 100 });
    expect(() => level(150)).toThrow(/outside the bound/);
  });
});
