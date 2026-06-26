import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range math-depth is handled: defer to the primitive (`'throw'`) or clamp. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * A math-depth input: a raw integer (negatives allowed), the `'auto-add'`
 * keyword, or `'unset'` / `undefined` to fall back to the book's configured
 * default value.
 */
export type MathDepthInput = number | 'auto-add' | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback value and the out-of-range policy. */
export interface MathDepthConfig {
  /** the value a bare call (or `'unset'`) renders (an integer or the `'auto-add'` keyword). */
  value: number | 'auto-add';
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a math-depth book. "Typed token in, plain CSS out":
 * render with `.css()`, typed against csstype's `Property.MathDepth`, or read
 * the backing value via `.value()` (a number for a numeric input, a string for
 * a keyword).
 */
export interface ResolvedMathDepth {
  /** the math-depth as a CSS value, typed against `Property.MathDepth`. */
  css(): Property.MathDepth;
  /** the raw value backing this result (a number, or a keyword string). */
  value(): number | string;
}

/** A math-depth book: callable bare (the configured default) or with a value. */
export type MathDepth = (input?: MathDepthInput) => ResolvedMathDepth;
