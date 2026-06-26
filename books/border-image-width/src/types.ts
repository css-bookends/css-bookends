import type { NumberOrLength } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- the input ---------- */

/**
 * One edge entry of a border-image-width: a non-negative `<number>` multiplier
 * (hardened through `f({ min: 0 })`), a length supplied as an `IMeasurement`
 * from calipers (the `NumberOrLength` shape), or the keyword `'auto'`. The
 * percentage form is out of scope.
 */
export type BorderImageWidthEntry = NumberOrLength | 'auto';
export type { NumberOrLength };

/**
 * A border-image-width input: one to four edge entries, modelled as a
 * fixed-arity tuple with optional trailing elements (NOT a union of tuples, so
 * the tuple spreads cleanly into the variadic engine helper). One to four
 * entries are rendered space-separated in edge order.
 */
export type BorderImageWidthInput = readonly [
  BorderImageWidthEntry,
  BorderImageWidthEntry?,
  BorderImageWidthEntry?,
  BorderImageWidthEntry?,
];

/* ---------- factory config ---------- */

/**
 * The book has no tunable config: a border-image-width has no meaningful bare
 * default, so the book is always called with an explicit input.
 */
export type BorderImageWidthConfig = Record<string, never>;

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a border-image-width book. "Typed token in, plain CSS
 * out": render with `.css()`, typed against csstype's `Property.BorderImageWidth`,
 * or read the raw rendered string via `.value()`.
 */
export interface ResolvedBorderImageWidth {
  /** the border-image-width as a CSS value, typed against `Property.BorderImageWidth`. */
  css(): Property.BorderImageWidth;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A border-image-width book: called with one to four edge entries. */
export type BorderImageWidth = (
  input: BorderImageWidthInput,
) => ResolvedBorderImageWidth;
