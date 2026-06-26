import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range z-index is handled: defer to the primitive (`'throw'`) or clamp into bounds. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * A z-index input: a raw integer (negatives allowed), the `'auto'` keyword, or
 * `'unset'` / `undefined` to fall back to the book's configured default value.
 */
export type ZIndexInput = number | 'auto' | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback z-index and the out-of-range policy. */
export interface ZIndexConfig {
  /** the value a bare call (or `'unset'`) renders. */
  value: number | 'auto';
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a z-index book. "Typed token in, plain CSS out": render
 * with `.css()`, typed against csstype's `Property.ZIndex` (its full valid
 * surface, e.g. the bare integer string or `'auto'`), or read the raw value via
 * `.value()`.
 */
export interface ResolvedZIndex {
  /** the z-index as a CSS value, typed against `Property.ZIndex`. */
  css(): Property.ZIndex;
  /** the raw value backing this z-index: a `number`, or a keyword `string`. */
  value(): number | string;
}

/** A z-index book: callable bare (the configured default) or with a value. */
export type ZIndex = (input?: ZIndexInput) => ResolvedZIndex;
