/**
 * Example-only file. Not part of the public API surface and not published.
 *
 * The `InRange` brand is a COMPILE-TIME proof. A runtime check proves a value is within a range,
 * then stamps a phantom tag onto its type; a function can DEMAND that proof, and the compiler rejects
 * an unproven value. The brand is additive over `IInteger`, it SURVIVES `clone()` (same value and
 * bound, so the proof still holds), and it is DROPPED by arithmetic (a derived value must be
 * re-proven). This is the "JS validates what TS can't, then TS enforces it" promise in one type.
 */

import { createInteger } from '@css-bookends/css-calipers';

import { i, type InRangeInteger } from './calipers_examples.ts';

// A slot that ONLY accepts an integer proven to be within [0, 10].
declare function needsUnitInterval(
  value: InRangeInteger<0, 10>,
): void;

// A factory bound mints the brand: every `level(v)` is InRangeInteger<0, 10>.
const { i: level } = createInteger({ min: 0, max: 10 });
export const provenFromFactory = (): void =>
  needsUnitInterval(level(5));

// clamp() mints it too: it forces the value in range, so the proof is always honest.
export const provenFromClamp = (): void =>
  needsUnitInterval(i(50).clamp(0, 10)); // clamped to 10

// clone() preserves the brand, so a clone is still accepted.
export const provenSurvivesClone = (): void =>
  needsUnitInterval(level(5).clone());

// A plain integer carries no proof: the compiler rejects it.
export const plainRejected = (): void => {
  // @ts-expect-error a plain IInteger carries no InRange proof
  needsUnitInterval(i(5));
};

// Arithmetic drops the brand, so a derived value must be re-proven before it fits the slot.
export const arithmeticDropsBrand = (): void => {
  // @ts-expect-error add() returns a plain IInteger; the range proof is gone
  needsUnitInterval(level(5).add(1));
};
