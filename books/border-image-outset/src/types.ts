import type { NumberOrLength } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- the input ---------- */

/**
 * One edge entry of a border-image-outset: a non-negative `<number>` (hardened
 * through `f({ min: 0 })`) or a length supplied as an `IMeasurement` from
 * calipers (the `NumberOrLength` shape). The percentage form is out of scope,
 * and outset has no `'auto'` keyword.
 */
export type BorderImageOutsetEntry = NumberOrLength;
export type { NumberOrLength };

/**
 * A border-image-outset input: one to four edge entries, modelled as a
 * fixed-arity tuple with optional trailing elements (NOT a union of tuples, so
 * the tuple spreads cleanly into the variadic engine helper). One to four
 * entries are rendered space-separated in edge order.
 */
export type BorderImageOutsetInput = readonly [
  BorderImageOutsetEntry,
  BorderImageOutsetEntry?,
  BorderImageOutsetEntry?,
  BorderImageOutsetEntry?,
];

/* ---------- factory config ---------- */

/**
 * The book has no tunable config: a border-image-outset has no meaningful bare
 * default, so the book is always called with an explicit input.
 */
export type BorderImageOutsetConfig = Record<string, never>;

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a border-image-outset book. "Typed token in, plain CSS
 * out": render with `.css()`, typed against csstype's
 * `Property.BorderImageOutset`, or read the raw rendered string via `.value()`.
 */
export interface ResolvedBorderImageOutset {
  /** the border-image-outset as a CSS value, typed against `Property.BorderImageOutset`. */
  css(): Property.BorderImageOutset;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A border-image-outset book: called with one to four edge entries. */
export type BorderImageOutset = (
  input: BorderImageOutsetInput,
) => ResolvedBorderImageOutset;
