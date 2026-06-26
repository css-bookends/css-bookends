import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range ratio is handled: defer to the primitive (`'throw'`) or clamp to `>= 1`. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * A stroke-miterlimit input: a raw ratio of at least 1, or `'unset'` / `undefined`
 * to fall back to the book's configured default value.
 */
export type StrokeMiterlimitInput = number | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback ratio and the out-of-range policy. */
export interface StrokeMiterlimitConfig {
  /** the ratio a bare call (or `'unset'`) renders. */
  value: number;
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a stroke-miterlimit book. "Typed token in, plain CSS out":
 * render with `.css()`, typed against csstype's `Property.StrokeMiterlimit` (its
 * full valid surface, e.g. the bare number string), or read the raw ratio via
 * `.value()`.
 */
export interface ResolvedStrokeMiterlimit {
  /** the stroke-miterlimit as a CSS value, typed against `Property.StrokeMiterlimit`. */
  css(): Property.StrokeMiterlimit;
  /** the raw ratio number backing this value. */
  value(): number;
}

/** A stroke-miterlimit book: callable bare (the configured default) or with a ratio. */
export type StrokeMiterlimit = (
  input?: StrokeMiterlimitInput,
) => ResolvedStrokeMiterlimit;
