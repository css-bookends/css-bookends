/**
 * Example-only file. Not part of the public API surface and not published.
 *
 * The generic input `modifier` on `m()` and on unit helpers. The core ships NO built-in
 * normalization; a domain-specific transform is built WHERE it is needed. Here a wrapping-angle
 * helper (`hue`) runs modulo 360 on its input, built from `mDeg` via a per-helper config. `mDeg`
 * itself is untouched (angles legitimately exceed 360°, e.g. `rotate(720deg)`). A `modifier` runs at
 * INTAKE, before the bound is checked and before the value is stored (modify-then-validate).
 */

import {
  m,
  makeUnitHelperFromDefinition,
} from './calipers_examples.ts';

// A generic transform: normalize an angle into [0, 360).
const wrap360 = (n: number): number => ((n % 360) + 360) % 360;

// Per-call on m(): the value is wrapped before it is stored.
export const wrappedInline = m(450, {
  unit: 'deg',
  modifier: wrap360,
}).css(); // '90deg'

// A reusable NAMED helper carrying the modifier (the deg-specific wrapper).
const hue = makeUnitHelperFromDefinition('mDeg', {
  modifier: wrap360,
});
export const wrappedHue = hue(450).css(); // '90deg'
export const plainHue = hue(45).css(); // '45deg'

// A direct bound on m(), checked at construction (like i / f).
export const boundedAngle = m(45, {
  unit: 'deg',
  min: 0,
  max: 360,
}).constraints(); // { min: 0, max: 360 }
