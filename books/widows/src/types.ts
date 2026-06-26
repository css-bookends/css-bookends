import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range count is handled: defer to the primitive (`'throw'`) or clamp to `>= 1`. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * A widows input: a raw integer count of at least 1, or `'unset'` / `undefined`
 * to fall back to the book's configured default value.
 */
export type WidowsInput = number | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback count and the out-of-range policy. */
export interface WidowsConfig {
  /** the count a bare call (or `'unset'`) renders. */
  value: number;
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a widows book. "Typed token in, plain CSS out": render
 * with `.css()`, typed against csstype's `Property.Widows` (its full valid
 * surface, e.g. the bare integer string), or read the raw count via `.value()`.
 */
export interface ResolvedWidows {
  /** the widows as a CSS value, typed against `Property.Widows`. */
  css(): Property.Widows;
  /** the raw count number backing this value. */
  value(): number;
}

/** A widows book: callable bare (the configured default) or with a count. */
export type Widows = (input?: WidowsInput) => ResolvedWidows;
