import type { NumberOrLength } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/**
 * One edge of a mask-border-outset value: a non-negative `<number>` or a length
 * supplied as an `IMeasurement` from calipers (the `NumberOrLength` shape). The
 * outset property has no `'auto'` keyword and the percentage form is out of scope.
 */
export type MaskBorderOutsetEntry = NumberOrLength;
export type { NumberOrLength };

/* ---------- the input ---------- */

/**
 * A mask-border-outset input: one to four edge entries, rendered space-separated
 * in order. Modelled as a TUPLE with optional trailing elements (not a union of
 * fixed-length tuples) so the value spreads cleanly into the variadic engine
 * helper at the type level.
 */
export type MaskBorderOutsetInput = readonly [
  MaskBorderOutsetEntry,
  MaskBorderOutsetEntry?,
  MaskBorderOutsetEntry?,
  MaskBorderOutsetEntry?,
];

/* ---------- factory config ---------- */

/** The book's config. Mask-border-outset carries no tunable defaults of its own. */
export type MaskBorderOutsetConfig = Record<string, never>;

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a mask-border-outset book. "Typed token in, plain CSS
 * out": render with `.css()`, typed against csstype's `Property.MaskBorderOutset`,
 * or read the raw rendered string via `.value()`.
 */
export interface ResolvedMaskBorderOutset {
  /** the mask-border-outset as a CSS value, typed against `Property.MaskBorderOutset`. */
  css(): Property.MaskBorderOutset;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A mask-border-outset book: called with one to four edge entries. */
export type MaskBorderOutset = (
  input: MaskBorderOutsetInput,
) => ResolvedMaskBorderOutset;
