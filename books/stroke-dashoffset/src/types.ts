import type { NumberOrLength } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- the input ---------- */

/**
 * A stroke-dashoffset input: a single signed `<number>` in SVG user units (any
 * value, positive or negative; NOT restricted to an integer), or a length
 * supplied as an `IMeasurement` from calipers. The percentage form is out of
 * scope. This is the css-value-core `NumberOrLength` shape, re-exported so the
 * book input matches the engine helper exactly. The engine helper takes a
 * single value, so there is no spread here.
 */
export type StrokeDashoffsetInput = NumberOrLength;
export type { NumberOrLength };

/* ---------- factory config ---------- */

/**
 * The stroke-dashoffset book has no tunable config. A bare call is not supported
 * (the helper always needs an explicit value), so there is nothing to theme.
 */
export type StrokeDashoffsetConfig = Record<string, never>;

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a stroke-dashoffset book. "Typed token in, plain CSS
 * out": render with `.css()`, typed against csstype's `Property.StrokeDashoffset`,
 * or read the raw rendered string via `.value()`.
 */
export interface ResolvedStrokeDashoffset {
  /** the stroke dashoffset as a CSS value, typed against `Property.StrokeDashoffset`. */
  css(): Property.StrokeDashoffset;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A stroke-dashoffset book: callable with a single number-or-length input. */
export type StrokeDashoffset = (
  input: StrokeDashoffsetInput,
) => ResolvedStrokeDashoffset;
