import type { NumberOrLength } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- the input ---------- */

/**
 * One entry of a stroke-dasharray list: a non-negative `<number>` in SVG user
 * units (hardened through `f({ min: 0 })`), or a length supplied as an
 * `IMeasurement` from calipers (the `NumberOrLength` shape). The percentage form
 * is out of scope.
 */
export type StrokeDasharrayEntry = NumberOrLength;
export type { NumberOrLength };

/**
 * A stroke-dasharray input: the keyword `'none'`, or a non-empty list of
 * entries. The list is modelled as a tuple with a required head and a variadic
 * tail (`readonly [E, ...readonly E[]]`), so it is guaranteed non-empty and
 * spreads cleanly into the variadic engine helper. It is a union of `'none'`
 * with that tuple, not a union of tuples.
 */
export type StrokeDasharrayInput =
  | 'none'
  | readonly [
      StrokeDasharrayEntry,
      ...(readonly StrokeDasharrayEntry[]),
    ];

/* ---------- factory config ---------- */

/**
 * The book has no tunable config: a stroke-dasharray has no meaningful bare
 * default, so the book is always called with an explicit input.
 */
export type StrokeDasharrayConfig = Record<string, never>;

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a stroke-dasharray book. "Typed token in, plain CSS
 * out": render with `.css()`, typed against csstype's `Property.StrokeDasharray`,
 * or read the raw rendered string via `.value()`.
 */
export interface ResolvedStrokeDasharray {
  /** the stroke dasharray as a CSS value, typed against `Property.StrokeDasharray`. */
  css(): Property.StrokeDasharray;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A stroke-dasharray book: called with `'none'` or a non-empty list. */
export type StrokeDasharray = (
  input: StrokeDasharrayInput,
) => ResolvedStrokeDasharray;
