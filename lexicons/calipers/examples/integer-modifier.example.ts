/**
 * Example-only file. Not part of the public API surface and not published.
 *
 * The optional `modifier` on `i()` and `f()`: a value transform applied at INTAKE, before the kind
 * check and the bound, and carried through arithmetic and clone. It is mechanism, not policy: three
 * named shortcuts map to the JS rounding built-ins (`'floor'` / `'ceil'` / `'round'`), and a function
 * does anything. For `i` the integer check still runs AFTER the modifier, so the value is always a
 * real integer; with NO modifier a non-integer fails loudly (the default). `f` has no integer check,
 * so a float takes whatever the modifier returns, bounded only by min/max.
 */

import { createIntegerFactory } from '@css-bookends/css-calipers';

import { f, i } from './calipers_examples.ts';

// --- named rounding shortcuts (reuse Math.floor / ceil / round) ------------------
// 5 * 4.44455222333 = 22.2227... ; the modifier rounds the arithmetic result back to an integer.
export const floored = i(5, { modifier: 'floor' })
  .multiply(4.44455222333)
  .value(); // 22
export const ceiled = i(5, { modifier: 'ceil' })
  .multiply(4.44455222333)
  .value(); // 23
export const rounded = i(5, { modifier: 'round' })
  .multiply(4.44455222333)
  .value(); // 22

// --- a custom modifier: snap a font weight to multiples of 100 -------------------
// An integer input still gets snapped (the modifier always runs), so 220 becomes 200.
const snapTo100 = (n: number): number => Math.round(n / 100) * 100;
export const weightGrid = i(220, { modifier: snapTo100 }).value(); // 200
// It rides through arithmetic too: 100 * 2.6 = 260 -> nearest 100 -> 300.
export const weightFromArithmetic = i(100, { modifier: snapTo100 })
  .multiply(2.6)
  .value(); // 300

// --- the default (no modifier) fails loudly on a non-integer ---------------------
export const noModifierThrows = (): string => {
  try {
    i(5).multiply(0.5); // 2.5 is not an integer, and nothing rounds it
    return 'no throw';
  } catch {
    return 'threw: expected an integer';
  }
};

// --- a whole domain can bake the modifier on its factory -------------------------
const { i: fontWeight } = createIntegerFactory({
  min: 100,
  max: 900,
  modifier: snapTo100,
});
export const boldish = fontWeight(220).value(); // 200

// --- f() takes a modifier too; there is no integer check, only the bound ---------
export const flooredFloat = f(2.9, { modifier: 'floor' }).value(); // 2
export const halvedFloat = f(1, { modifier: (n) => n / 2 }).value(); // 0.5
