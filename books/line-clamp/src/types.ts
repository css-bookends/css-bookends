import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range line count is handled: defer to the primitive (`'throw'`) or clamp into the bound. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * A line-clamp input: a raw positive integer line count, the `'none'` keyword,
 * or `'unset'` / `undefined` to fall back to the book's configured default value.
 */
export type LineClampInput = number | 'none' | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback line count and the out-of-range policy. */
export interface LineClampConfig {
  /** the value a bare call (or `'unset'`) renders. */
  value: number | 'none';
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a line-clamp book. "Typed token in, plain CSS out": render
 * with `.css()`, typed against csstype's `Property.WebkitLineClamp` (its full valid
 * surface), or read the raw value via `.value()`.
 */
export interface ResolvedLineClamp {
  /** the line-clamp as a CSS value, typed against `Property.WebkitLineClamp`. */
  css(): Property.WebkitLineClamp;
  /** the raw value backing this result: a number (line count) or a keyword string. */
  value(): number | string;
}

/** A line-clamp book: callable bare (the configured default) or with a value. */
export type LineClamp = (input?: LineClampInput) => ResolvedLineClamp;
