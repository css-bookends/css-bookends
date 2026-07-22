/**
 * Example-only file.
 *
 * Not part of the public API surface and not published. It demonstrates the
 * unified value surface across `m()` / `i()` / `f()`, measurement introspection,
 * bound enforcement, and the bundle config cascade.
 */

import {
  createCalipersBundle,
  createInteger,
} from '@css-bookends/css-calipers';

import { f, i, m } from './calipers_examples.ts';

// The default value-surface helpers above come from the shared binder. The
// configured `createInteger` / `createCalipersBundle` calls below are the point of
// the cascade demo, so those stay explicit.

// --- m() accepts a plain number OR a typed scalar (i / f) -----------------------

export const fromInteger = m(i(8)).css(); // '8px'
export const fromFloat = m(f(2.5), 'rem').css(); // '2.5rem'

// --- one raw / unit accessor across every value type ---------------------------

export const rawValue = m(2.5, 'rem').value(); // 2.5
export const unitString = m(2.5, 'rem').unit(); // 'rem'
export const scalarUnit = i(4).unit(); // ''  (unitless)

// --- introspection + interconversion -------------------------------------------

export const category = m(8).category(); // 'length-absolute'
export const isAbsolute = m(8).isAbsolute(); // true
export const isRelative = m(2, 'rem').isRelative(); // true
export const isPercent = m(50, '%').isPercent(); // true
export const recovered = m(2.5).asScalar().css(); // '2.5'  (fractional -> f)
export const integral = m(8).isInt(); // true

// --- m carries an ingested bound; a breach THROWS (no reaction knob) -------------

const bounded = (v: number) => i(v, { min: 0, max: 10 });

export const carriedBound = m(bounded(8)).constraints(); // { min: 0, max: 10 }

// A bounded value is enforced: breaking the carried bound throws. (Don't want
// enforcement? Use a plain number / `u`; the planned `clamp` will absorb to the limit.)
export const breakThrows = (): string => {
  try {
    m(bounded(8)).multiply(2); // 16 breaks [0, 10]
    return 'no throw';
  } catch {
    return 'threw';
  }
};

// --- the config cascade: own key -> global -> factory default (errorConfig) ------

// `errorConfig` is the shared, CASCADING scalar option: a thrown error renders a
// `stack=` block iff the resolved `stackHints` is 'on'. Set it on the bundle `global`
// and it reaches every unit; a per-unit key overrides it.
const messageOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (error) {
    return (error as Error).message;
  }
  return '';
};

const verbose = createCalipersBundle({
  global: { errorConfig: { stackHints: 'on' } },
});
export const globalReachesScalar = messageOf(() =>
  verbose.i(8, { min: 0, max: 10 }).multiply(2),
).includes('stack='); // true — the global errorConfig reached i

// a per-unit key overrides the global
const mixed = createCalipersBundle({
  global: { errorConfig: { stackHints: 'on' } }, // applies everywhere...
  integer: { errorConfig: { stackHints: 'off' } }, // ...except integers
});
export const integerKeyWins = messageOf(() =>
  mixed.i(8, { min: 0, max: 10 }).multiply(2),
).includes('stack='); // false — the integer key overrode the global

// a standalone factory bakes the same errorConfig
const ints = createInteger({ errorConfig: { stackHints: 'off' } });
export const factoryOmitsStack = messageOf(() =>
  ints.i(8, { min: 0, max: 10 }).multiply(2),
).includes('stack='); // false
