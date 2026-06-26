import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range font-size-adjust is handled: defer to the primitive (`'throw'`) or clamp into the bound. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * A font-size-adjust input: a raw non-negative number, one of the `'none'` /
 * `'from-font'` keywords, or `'unset'` / `undefined` to fall back to the book's
 * configured default value.
 */
export type FontSizeAdjustInput =
  | number
  | 'none'
  | 'from-font'
  | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback value and the out-of-range policy. */
export interface FontSizeAdjustConfig {
  /** the value a bare call (or `'unset'`) renders. */
  value: number | 'none' | 'from-font';
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a font-size-adjust book. "Typed token in, plain CSS
 * out": render with `.css()`, typed against csstype's `Property.FontSizeAdjust`
 * (its full valid surface, e.g. the bare number string or a keyword), or read
 * the raw value via `.value()`.
 */
export interface ResolvedFontSizeAdjust {
  /** the font-size-adjust as a CSS value, typed against `Property.FontSizeAdjust`. */
  css(): Property.FontSizeAdjust;
  /** the raw value backing this result: a number, or a keyword string. */
  value(): number | string;
}

/** A font-size-adjust book: callable bare (the configured default) or with a value. */
export type FontSizeAdjust = (
  input?: FontSizeAdjustInput,
) => ResolvedFontSizeAdjust;
