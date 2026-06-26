import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range count is handled: defer to the primitive (`'throw'`) or clamp to `>= 1`. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * An orphans input: a raw integer count of at least 1, or `'unset'` / `undefined`
 * to fall back to the book's configured default value.
 */
export type OrphansInput = number | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback count and the out-of-range policy. */
export interface OrphansConfig {
  /** the count a bare call (or `'unset'`) renders. */
  value: number;
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling an orphans book. "Typed token in, plain CSS out": render
 * with `.css()`, typed against csstype's `Property.Orphans` (its full valid
 * surface, e.g. the bare integer string), or read the raw count via `.value()`.
 */
export interface ResolvedOrphans {
  /** the orphans as a CSS value, typed against `Property.Orphans`. */
  css(): Property.Orphans;
  /** the raw count number backing this value. */
  value(): number;
}

/** An orphans book: callable bare (the configured default) or with a count. */
export type Orphans = (input?: OrphansInput) => ResolvedOrphans;
