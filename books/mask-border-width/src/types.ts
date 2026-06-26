import type { NumberOrLength } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/**
 * One edge of a mask-border-width value: a non-negative `<number>` multiplier, a
 * length supplied as an `IMeasurement` from calipers (the `NumberOrLength`
 * shape), or the keyword `'auto'`. The percentage form is out of scope.
 */
export type MaskBorderWidthEntry = NumberOrLength | 'auto';
export type { NumberOrLength };

/* ---------- the input ---------- */

/**
 * A mask-border-width input: one to four edge entries, rendered space-separated
 * in order. Modelled as a TUPLE with optional trailing elements (not a union of
 * fixed-length tuples) so the value spreads cleanly into the variadic engine
 * helper at the type level.
 */
export type MaskBorderWidthInput = readonly [
  MaskBorderWidthEntry,
  MaskBorderWidthEntry?,
  MaskBorderWidthEntry?,
  MaskBorderWidthEntry?,
];

/* ---------- factory config ---------- */

/** The book's config. Mask-border-width carries no tunable defaults of its own. */
export type MaskBorderWidthConfig = Record<string, never>;

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a mask-border-width book. "Typed token in, plain CSS
 * out": render with `.css()`, typed against csstype's `Property.MaskBorderWidth`,
 * or read the raw rendered string via `.value()`.
 */
export interface ResolvedMaskBorderWidth {
  /** the mask-border-width as a CSS value, typed against `Property.MaskBorderWidth`. */
  css(): Property.MaskBorderWidth;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A mask-border-width book: called with one to four edge entries. */
export type MaskBorderWidth = (
  input: MaskBorderWidthInput,
) => ResolvedMaskBorderWidth;
