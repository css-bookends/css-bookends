import type { NumberOrLength } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- the input ---------- */

/**
 * A stroke-width input: a single non-negative `<number>` in SVG user units
 * (NOT restricted to an integer; `2.5` is valid), or a length supplied as an
 * `IMeasurement` from calipers. The percentage form is out of scope. This is
 * the css-value-core `NumberOrLength` shape, re-exported so the book input
 * matches the engine helper exactly. The engine helper takes a single value, so
 * there is no spread here.
 */
export type StrokeWidthInput = NumberOrLength;
export type { NumberOrLength };

/* ---------- factory config ---------- */

/**
 * The stroke-width book has no tunable config. A bare call is not supported (the
 * helper always needs an explicit value), so there is nothing to theme.
 */
export type StrokeWidthConfig = Record<string, never>;

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a stroke-width book. "Typed token in, plain CSS out":
 * render with `.css()`, typed against csstype's `Property.StrokeWidth`, or read
 * the raw rendered string via `.value()`.
 */
export interface ResolvedStrokeWidth {
  /** the stroke width as a CSS value, typed against `Property.StrokeWidth`. */
  css(): Property.StrokeWidth;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A stroke-width book: callable with a single number-or-length input. */
export type StrokeWidth = (
  input: StrokeWidthInput,
) => ResolvedStrokeWidth;
