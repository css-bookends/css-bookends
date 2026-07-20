/**
 * Example-only file. Not part of the public API surface and not published.
 *
 * The generic input `modifier` now lives on the SCALAR (`i` / `f`), not on `m` (a pure container).
 * The core ships NO built-in normalization; a domain-specific transform is built WHERE it is needed.
 * Here a wrapping-angle transform runs modulo 360 on a float, and that configured `f` is handed to
 * `m`, which only attaches the `deg` unit. A `modifier` runs at INTAKE, before the value is stored
 * (modify-then-validate); `m` sees only the finished scalar.
 */

import { f, m } from './calipers_examples.ts';

// A generic transform: normalize an angle into [0, 360).
const wrap360 = (n: number): number => ((n % 360) + 360) % 360;

// The modifier rides on the f; m just attaches the unit, so the value is
// wrapped before it is stored.
const wrappedFloat = f(450, { modifier: wrap360 });
export const wrappedInline = m(wrappedFloat, 'deg').css(); // '90deg'

// A reusable helper that hands m a freshly configured f per call.
const hue = (deg: number): string =>
  m(f(deg, { modifier: wrap360 }), 'deg').css();
export const wrappedHue = hue(450); // '90deg'
export const plainHue = hue(45); // '45deg'

// A bound also rides on the scalar (checked at construction, like i / f);
// m only attaches the unit.
const boundedFloat = f(45, { min: 0, max: 360 });
export const boundedAngle = m(boundedFloat, 'deg').constraints(); // { min: 0, max: 360 }
