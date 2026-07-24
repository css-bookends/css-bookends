/**
 * Example-only file. Not part of the public API surface and not published.
 *
 * The `InRange` brand is a COMPILE-TIME proof. A runtime check proves a value is within a range,
 * then stamps a phantom tag onto its type; a function can DEMAND that proof, and the compiler rejects
 * an unproven value. The brand SURVIVES `clone()` (same value and bound), and under the HARD RULE it
 * is PRESERVED through arithmetic too: every result re-validates against the runtime bound (throwing
 * on a breach), so the brand stays honest. This is the "JS validates what TS can't, then TS enforces
 * it" promise in one type.
 */

import { createIntegerFactory } from '@css-bookends/css-calipers';

import { i, type InRangeInteger } from './calipers_examples.ts';

// A slot that ONLY accepts an integer proven to be within [0, 10].
declare function needsUnitInterval(
  value: InRangeInteger<0, 10>,
): void;

// A factory bound mints the brand: every `level(v)` is InRangeInteger<0, 10>.
const { i: level } = createIntegerFactory({ min: 0, max: 10 });
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

// The HARD RULE: arithmetic PRESERVES the brand, so a derived value still fits the slot without
// re-proving (the runtime bound throws on a breach, so the preserved brand is never a lie).
export const arithmeticPreservesBrand = (): void =>
  needsUnitInterval(level(5).add(1));
