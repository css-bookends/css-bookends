import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range column-count is handled: defer to the primitive (`'throw'`) or clamp. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * A column-count input: a raw positive integer, the `'auto'` keyword, or
 * `'unset'` / `undefined` to fall back to the book's configured default value.
 */
export type ColumnCountInput = number | 'auto' | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback value and the out-of-range policy. */
export interface ColumnCountConfig {
  /** the value a bare call (or `'unset'`) renders (a positive integer, or `'auto'`). */
  value: number | 'auto';
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a column-count book. "Typed token in, plain CSS out":
 * render with `.css()`, typed against csstype's `Property.ColumnCount` (its full
 * valid surface, e.g. the bare integer string), or read the raw value via
 * `.value()` (a number for a numeric input, a string for the keyword).
 */
export interface ResolvedColumnCount {
  /** the column-count as a CSS value, typed against `Property.ColumnCount`. */
  css(): Property.ColumnCount;
  /** the raw value backing this result (a number, or the keyword string). */
  value(): number | string;
}

/** A column-count book: callable bare (the configured default) or with a value. */
export type ColumnCount = (
  input?: ColumnCountInput,
) => ResolvedColumnCount;
