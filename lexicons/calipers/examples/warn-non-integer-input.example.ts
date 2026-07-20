/**
 * Example-only file. Not part of the public API surface and not published.
 *
 * `warnOnNonIntegerInput` is an OPT-IN diagnostic on `i()` (default off). When a `modifier` is
 * quietly cleaning up non-integer inputs, this surfaces the messy ones: it `console.warn`s when the
 * RAW value (before the modifier) is not an integer. It never changes the result, and it never
 * softens the default: with no modifier a non-integer still throws. Use it to hunt inputs that
 * shouldn't have been fractional in the first place. Its counterpart is silence, fix without a peep.
 */

import { i } from './calipers_examples.ts';

// A modifier keeps the value valid; the flag adds a heads-up when it had to clean a non-integer.
// 5 * 4.44455222333 = 22.2227... (not an integer) -> warns, then floors to 22.
export const warnedThenFixed = i(5, {
  modifier: 'floor',
  warnOnNonIntegerInput: true,
})
  .multiply(4.44455222333)
  .value(); // 22, and a console.warn fired for the 22.2227 input

// A clean integer input does not warn, even when the modifier still transforms it.
// 220 is already an integer, so no warning; the grid-snap modifier just maps it to 200.
export const cleanInputNoWarn = i(220, {
  modifier: (n) => Math.round(n / 100) * 100,
  warnOnNonIntegerInput: true,
}).value(); // 200, no warning

// Off by default: the same fix happens silently.
export const fixedSilently = i(5, { modifier: 'floor' })
  .multiply(4.44455222333)
  .value(); // 22, no warning
