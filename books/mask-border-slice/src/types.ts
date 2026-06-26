import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/**
 * One slice number of a mask-border-slice value: a non-negative `<number>`. The
 * slice property accepts numbers (and percentages), not lengths, so an
 * `IMeasurement` is rejected; the percentage form is out of scope here.
 */
export type MaskBorderSliceNumber = number;

/** The optional trailing keyword of a mask-border-slice value. */
export type MaskBorderSliceFill = 'fill';

/* ---------- the input ---------- */

/**
 * A mask-border-slice input: one to four non-negative `<number>` entries with an
 * optional trailing `'fill'` keyword, rendered space-separated in order.
 *
 * Modelled as a TUPLE with optional trailing elements (not a union of fixed-length
 * tuples) so the value spreads cleanly into the variadic engine helper at the type
 * level. The first element is a number (the engine requires at least one); the
 * middle slots accept a number or the trailing `'fill'`; a fifth slot allows
 * `'fill'` after four numbers. `'fill'` is validated to be trailing at runtime.
 */
export type MaskBorderSliceInput = readonly [
  MaskBorderSliceNumber,
  (MaskBorderSliceNumber | MaskBorderSliceFill)?,
  (MaskBorderSliceNumber | MaskBorderSliceFill)?,
  (MaskBorderSliceNumber | MaskBorderSliceFill)?,
  MaskBorderSliceFill?,
];

/* ---------- factory config ---------- */

/** The book's config. Mask-border-slice carries no tunable defaults of its own. */
export type MaskBorderSliceConfig = Record<string, never>;

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a mask-border-slice book. "Typed token in, plain CSS
 * out": render with `.css()`, typed against csstype's `Property.MaskBorderSlice`,
 * or read the raw rendered string via `.value()`.
 */
export interface ResolvedMaskBorderSlice {
  /** the mask-border-slice as a CSS value, typed against `Property.MaskBorderSlice`. */
  css(): Property.MaskBorderSlice;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A mask-border-slice book: called with one to four numbers and an optional trailing `'fill'`. */
export type MaskBorderSlice = (
  input: MaskBorderSliceInput,
) => ResolvedMaskBorderSlice;
