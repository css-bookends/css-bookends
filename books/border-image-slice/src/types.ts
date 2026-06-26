import type { Property } from 'csstype';

/* ---------- the input ---------- */

/**
 * A border-image-slice input: one to four non-negative `<number>` entries
 * (hardened through `f({ min: 0 })`; the percentage form is out of scope), with
 * an optional trailing `'fill'` keyword. The slice property accepts numbers (and
 * percentages), not lengths, so an `IMeasurement` is rejected.
 *
 * Modelled as a fixed-arity tuple with optional trailing elements (NOT a union
 * of tuples, so it spreads cleanly into the variadic engine helper): the first
 * element is a `<number>`, the next three are each a `<number>` or `'fill'`, and
 * a final optional `'fill'` covers four numbers plus a trailing keyword. `'fill'`
 * is only valid as the trailing entry; the engine enforces that at runtime.
 */
export type BorderImageSliceInput = readonly [
  number,
  (number | 'fill')?,
  (number | 'fill')?,
  (number | 'fill')?,
  'fill'?,
];

/* ---------- factory config ---------- */

/**
 * The book has no tunable config: a border-image-slice has no meaningful bare
 * default, so the book is always called with an explicit input.
 */
export type BorderImageSliceConfig = Record<string, never>;

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a border-image-slice book. "Typed token in, plain CSS
 * out": render with `.css()`, typed against csstype's
 * `Property.BorderImageSlice`, or read the raw rendered string via `.value()`.
 */
export interface ResolvedBorderImageSlice {
  /** the border-image-slice as a CSS value, typed against `Property.BorderImageSlice`. */
  css(): Property.BorderImageSlice;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A border-image-slice book: called with one to four numbers plus an optional trailing `'fill'`. */
export type BorderImageSlice = (
  input: BorderImageSliceInput,
) => ResolvedBorderImageSlice;
