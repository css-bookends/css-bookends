import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range font-weight is handled: defer to the primitive (`'throw'`) or clamp. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * A font-weight input: a raw number in `[1, 1000]`, one of the
 * `'normal'` / `'bold'` / `'lighter'` / `'bolder'` keywords, or `'unset'` /
 * `undefined` to fall back to the book's configured default value.
 */
export type FontWeightInput =
  | number
  | 'normal'
  | 'bold'
  | 'lighter'
  | 'bolder'
  | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback value and the out-of-range policy. */
export interface FontWeightConfig {
  /** the value a bare call (or `'unset'`) renders (a number or a font-weight keyword). */
  value: number | 'normal' | 'bold' | 'lighter' | 'bolder';
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a font-weight book. "Typed token in, plain CSS out":
 * render with `.css()`, typed against csstype's `Property.FontWeight`, or read
 * the backing value via `.value()` (a number for a numeric input, a string for
 * a keyword).
 */
export interface ResolvedFontWeight {
  /** the font-weight as a CSS value, typed against `Property.FontWeight`. */
  css(): Property.FontWeight;
  /** the raw value backing this result (a number, or a keyword string). */
  value(): number | string;
}

/** A font-weight book: callable bare (the configured default) or with a value. */
export type FontWeight = (
  input?: FontWeightInput,
) => ResolvedFontWeight;
