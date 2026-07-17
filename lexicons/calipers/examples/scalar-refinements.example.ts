/**
 * Example-only file. Not part of the public API surface and not published.
 *
 * The SCALAR refinement quartet: the integer / float analogue of the measurement
 * refinements in `refinements.example.ts`. `inRangeInteger` / `nonNegativeInteger` /
 * `nonPositiveInteger` (and the `*Float` mirrors) each expose the same quartet as the
 * measurement refinements: `is` (guard) / `ensure` (throws) / `check` (result) /
 * `hardenWith` (validate-or-fallback), returning the SAME value branded to prove the
 * check happened. `makeIntegerRefinement` is the builder behind the built-ins.
 */

import {
  i,
  inRangeInteger,
  makeIntegerRefinement,
  nonNegativeInteger,
} from './calipers_examples.ts';

// --- inRangeInteger: the quartet -------------------------------------------------

// `ensure` returns the branded value, or throws on an out-of-range one (message includes
// the bound `[0, 10]`).
export const ensuredInRange = inRangeInteger(0, 10)
  .ensure(i(5))
  .value(); // 5
export const ensureOutOfRangeThrows = (): string => {
  try {
    inRangeInteger(0, 10).ensure(i(15));
    return 'no throw';
  } catch (error) {
    return error instanceof Error ? error.message : 'unknown';
  }
};

// `is` is the guard; `check` is the non-throwing `{ ok, value, error }` result;
// `hardenWith` validates or falls back (to the range's min) in one call.
export const fiveIsInRange = inRangeInteger(0, 10).is(i(5)); // true
export const outOfRangeCheckFails = inRangeInteger(0, 10).check(
  i(15),
).ok; // false
export const hardenedOutOfRange = inRangeInteger(0, 10)
  .hardenWith(i(15))
  .value(); // 0 (falls back to the min)

// `nonNegativeInteger` mirrors `nonNegative` on measurements.
export const ensuredNonNegative = nonNegativeInteger
  .ensure(i(4))
  .value(); // 4

// --- makeIntegerRefinement: a custom scalar constraint ---------------------------

// Declare a brand, then a numeric predicate + message; the result exposes the same
// quartet over the brand (here: an even integer).
const evenInt = makeIntegerRefinement<{ readonly evenInt: true }>({
  predicate: (value) => value % 2 === 0,
  message: (value) => `expected an even integer (got ${value.css()})`,
  defaultFallback: 0,
});

export const fourIsEven = evenInt.is(i(4)); // true
export const threeIsEven = evenInt.is(i(3)); // false
export const oddFallsBack = evenInt.hardenWith(i(3)).value(); // 0
