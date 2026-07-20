/**
 * Example-only file. Not part of the public API surface and not published.
 *
 * A TEACHING companion to `design-tokens.example.ts`. There the names are realistic (`fontWeight`,
 * `opacity`); here the names deliberately SPELL OUT the bound, so the named-domain mechanism is
 * obvious: `createInteger({ min, max })` binds a factory once, destructure-rename its `i` to a name
 * that IS the domain, and every value it mints is checked against that range at construction. The
 * bound is set once on the factory; a per-value bound on top would throw. To retarget, mint a new
 * factory.
 */

import {
  createFloat,
  createInteger,
} from '@css-bookends/css-calipers';

import { i } from './calipers_examples.ts';

// The name encodes the range: this builder only accepts integers in [0, 10].
const { i: intFrom0To10 } = createInteger({ min: 0, max: 10 });
export const seven = intFrom0To10(7).css(); // '7'
export const tooBig = (): string => {
  try {
    intFrom0To10(20); // above 10
    return 'no throw';
  } catch {
    return 'threw: above the maximum';
  }
};

// Same idea for a float unit interval.
const { f: floatFrom0To1 } = createFloat({ min: 0, max: 1 });
export const half = floatFrom0To1(0.5).css(); // '0.5'

// The escape hatch: to change a bound, mint a FRESH value from the number (never mutate).
export const retargeted = i(intFrom0To10(7).value(), {
  min: 0,
  max: 100,
}).constraints(); // { min: 0, max: 100 }
