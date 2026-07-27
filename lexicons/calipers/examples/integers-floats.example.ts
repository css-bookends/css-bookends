/**
 * Example-only file.
 *
 * Not part of the public API surface and not published. It demonstrates the `i()`
 * (integer) and `f()` (float) number primitives: native typed CSS scalars alongside
 * `m()`. Each carries optional range constraints that re-validate through arithmetic,
 * so a hardened value stays hardened (or throws). `clamp(min, max)` snaps instead of
 * throwing; a per-value bound (`i(v, { min, max })`) or a factory bound
 * (`createIntegerFactory({ min, max })`) sets range constraints.
 */

import { createFloatFactory } from '@css-bookends/css-calipers';

import { f, i } from './calipers_examples.ts';

// --- construction and render ----------------------------------------------------

export const intValue = i(42).css(); // '42'
export const floatValue = f(0.5).css(); // '0.5'

// --- arithmetic re-validates against the same constraints -----------------------

// Integer arithmetic stays integer; the result is re-checked, so integer-ness
// survives.
export const added = i(4).add(2).css(); // '6'
export const multiplied = i(4).multiply(3).value(); // 12

// Float arithmetic re-validates too.
export const floatAdded = f(0.5).add(0.25).css(); // '0.75'

// --- range constraints that THROW -----------------------------------------------

// A non-integer is rejected at construction.
export const nonIntegerThrows = (): string => {
  try {
    i(2.5);
    return 'no throw';
  } catch (error) {
    // 'i: expected an integer (got 2.5)'
    return error instanceof Error ? error.message : 'unknown';
  }
};

// Below the minimum throws.
export const belowMinThrows = (): string => {
  try {
    i(0, { min: 1 });
    return 'no throw';
  } catch (error) {
    // 'i: 0 is below the minimum 1'
    return error instanceof Error ? error.message : 'unknown';
  }
};

// Above the maximum throws (float here).
export const aboveMaxThrows = (): string => {
  try {
    f(1.1, { max: 1 });
    return 'no throw';
  } catch (error) {
    // 'f: 1.1 is above the maximum 1'
    return error instanceof Error ? error.message : 'unknown';
  }
};

// Arithmetic that crosses a bound throws on re-validation.
export const arithmeticThrows = (): string => {
  try {
    i(5, { max: 10 }).add(20);
    return 'no throw';
  } catch (error) {
    // 'i: 25 is above the maximum 10'
    return error instanceof Error ? error.message : 'unknown';
  }
};

// --- clamp(min, max): snap to range instead of throwing -------------------------

export const clampedHigh = i(15).clamp(0, 10).value(); // 10
export const clampedLow = i(-3).clamp(0, 10).value(); // 0
export const floatClamped = f(1.5).clamp(0, 1).value(); // 1

// --- reusable bound builders (a per-value i(v, { min, max }) / f) ----------------

// A font-weight value is an integer in [1, 1000]; bind it once, reuse it.
const fontWeight = (v: number) => i(v, { min: 100, max: 900 });
export const validWeight = fontWeight(700).css(); // '700'
export const weightThrows = (): string => {
  try {
    fontWeight(1200);
    return 'no throw';
  } catch (error) {
    // 'i: 1200 is above the maximum 1000'
    return error instanceof Error ? error.message : 'unknown';
  }
};

// An opacity value is a float in [0, 1]; same pattern.
const opacity = (v: number) => f(v, { min: 0, max: 1 });
export const validOpacity = opacity(0.25).css(); // '0.25'
export const opacityThrows = (): string => {
  try {
    opacity(1.5);
    return 'no throw';
  } catch (error) {
    // 'f: 1.5 is above the maximum 1'
    return error instanceof Error ? error.message : 'unknown';
  }
};

// --- exact arithmetic on clean decimal literals (see docs/pure-values.md) --------

// A short decimal literal is auto-detected as its exact rational, so plain-decimal
// arithmetic has no floating-point drift: 1/10 + 2/10 = 3/10, exactly 0.3.
export const exactSum = f(0.1).add(f(0.2)).value(); // 0.3 (not 0.30000000000000004)
export const exactQuotient = f(0.3).divide(f(0.1)).value(); // 3 (not 2.9999999999999996)

// Float-noise is NOT promoted (no fabricated fraction): the drifted double stays impure.
export const noiseStaysImpure = f(0.1 + 0.2).value(); // 0.30000000000000004, unchanged

// --- cleanDecimalDigits: the auto-detect cutoff (config-driven, default 3) --------

// cleanDecimalDigits = the max fractional digits a decimal may have to auto-promote.
// Default 3 = the most a pure float could ever type-squiggle (the tuple ceiling), so
// runtime detection stays aligned with author-time feedback (see docs/pure-values.md).
// It cascades own float key -> bundle global -> default, like `snap`. Here a factory
// sets it to 0 (integers only), so 0.1 stays impure.
const integersOnly = createFloatFactory({ cleanDecimalDigits: 0 });
export const cutoffZeroDrifts = integersOnly
  .f(0.1)
  .multiply(3)
  .value(); // 0.30000000000000004
// at the default cutoff of 3, 0.1 (1 digit) promotes to 1/10, so * 3 is exactly 0.3.
export const defaultExact = f(0.1).multiply(3).value(); // 0.3

// The cutoff is validated to [0, 15] (10^16 would make the denominator inexact); out
// of range fails fast.
export const badCutoffThrows = (): string => {
  try {
    f(0.5, { cleanDecimalDigits: 16 });
    return 'no throw';
  } catch (error) {
    // 'f: cleanDecimalDigits must be an integer in [0, 15] (got 16)'
    return error instanceof Error ? error.message : 'unknown';
  }
};
