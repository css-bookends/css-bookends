/**
 * Example-only file. Not part of the public API surface and not published.
 *
 * `clone()` on integers / floats: a zero-arg, config-preserving copy (same value, same bound, same
 * config, a fresh instance). A bound is set once at construction and is then immutable; to change a
 * bound you MINT A FRESH value from the number.
 */

import { i } from './calipers_examples.ts';

// clone() copies the value and its bound into an independent instance.
export const clonedConstraints = i(5, { min: 0, max: 10 })
  .clone()
  .constraints(); // { min: 0, max: 10 }

// The value is unchanged by cloning.
export const clonedValue = i(5, { min: 0, max: 10 }).clone().value(); // 5

// To change a bound, mint a fresh value from the number (the always-available escape).
export const reminted = i(i(5, { min: 0, max: 10 }).value(), {
  min: 0,
  max: 50,
}).constraints(); // { min: 0, max: 50 }
