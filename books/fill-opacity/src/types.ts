import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range alpha is handled: defer to the primitive (`'throw'`) or clamp into [0, 1]. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * A fill-opacity input: a raw alpha in `[0, 1]`, or `'unset'` / `undefined` to
 * fall back to the book's configured default value.
 */
export type FillOpacityInput = number | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback alpha and the out-of-range policy. */
export interface FillOpacityConfig {
  /** the alpha a bare call (or `'unset'`) renders. */
  value: number;
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a fill-opacity book. "Typed token in, plain CSS out":
 * render with `.css()`, typed against csstype's `Property.FillOpacity` (its full
 * valid surface, e.g. the bare number string), or read the raw alpha via
 * `.value()`.
 */
export interface ResolvedFillOpacity {
  /** the fill-opacity as a CSS value, typed against `Property.FillOpacity`. */
  css(): Property.FillOpacity;
  /** the raw alpha number backing this value. */
  value(): number;
}

/** A fill-opacity book: callable bare (the configured default) or with an alpha. */
export type FillOpacity = (
  input?: FillOpacityInput,
) => ResolvedFillOpacity;
