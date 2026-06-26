import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range line-height is handled: defer to the primitive (`'throw'`) or clamp. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * A line-height input: a raw non-negative number, the `'normal'` keyword, or
 * `'unset'` / `undefined` to fall back to the book's configured default value.
 */
export type LineHeightInput = number | 'normal' | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback value and the out-of-range policy. */
export interface LineHeightConfig {
  /** the value a bare call (or `'unset'`) renders (a number or the `'normal'` keyword). */
  value: number | 'normal';
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a line-height book. "Typed token in, plain CSS out":
 * render with `.css()`, typed against csstype's `Property.LineHeight`, or read
 * the backing value via `.value()` (a number for a numeric input, a string for
 * a keyword).
 */
export interface ResolvedLineHeight {
  /** the line-height as a CSS value, typed against `Property.LineHeight`. */
  css(): Property.LineHeight;
  /** the raw value backing this result (a number, or a keyword string). */
  value(): number | string;
}

/** A line-height book: callable bare (the configured default) or with a value. */
export type LineHeight = (
  input?: LineHeightInput,
) => ResolvedLineHeight;
