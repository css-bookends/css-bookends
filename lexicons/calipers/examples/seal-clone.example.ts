/**
 * Example-only file. Not part of the public API surface and not published.
 *
 * `clone` and `sealed` on integers / floats (the runtime bound). A value's bound edges
 * are SEALED by default (safety by default): a clone cannot change a sealed edge. Opt an
 * edge OUT of sealing with `sealedMin` / `sealedMax`, seal downstream with `sealMin()` /
 * `sealMax()` / `sealRange()`, and to change a sealed bound you MINT A FRESH value (the
 * documented escape). The value itself is always immutable; `sealed` is about the bound.
 */

import { i } from './calipers_examples.ts';

// A faithful clone (no patch) copies the value and its bound.
export const clonedConstraints = i(5, { min: 0, max: 10 })
  .clone()
  .constraints(); // { min: 0, max: 10 }

// Bounds are SEALED by default, so cloning a sealed edge throws (message names the edge).
export const cloneSealedThrows = (): string => {
  try {
    i(5, { min: 0, max: 10 }).clone({ max: 8 });
    return 'no throw';
  } catch (error) {
    return error instanceof Error ? error.message : 'unknown';
  }
};

// Opt an edge OUT of sealing, and a clone can change it (and re-validates the value).
export const editableClone = i(5, {
  min: 0,
  max: 10,
  sealedMax: false,
})
  .clone({ max: 8 })
  .constraints(); // { min: 0, max: 8 }

// `sealMax()` locks an unsealed edge downstream; sealing is additive (never unseal in place).
export const reSealedThrows = (): string => {
  try {
    i(5, { min: 0, max: 10, sealedMax: false })
      .sealMax()
      .clone({ max: 8 });
    return 'no throw';
  } catch (error) {
    return error instanceof Error ? error.message : 'unknown';
  }
};

// The escape: mint a fresh value from the number with a different bound (always allowed).
export const reminted = i(i(5, { min: 0, max: 10 }).value(), {
  min: 0,
  max: 50,
}).constraints(); // { min: 0, max: 50 }
