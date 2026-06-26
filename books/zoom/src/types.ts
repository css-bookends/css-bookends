import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range factor is handled: defer to the primitive (`'throw'`) or clamp to `>= 0`. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * A zoom input: a raw non-negative zoom factor, or `'unset'` / `undefined`
 * to fall back to the book's configured default value.
 */
export type ZoomInput = number | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback factor and the out-of-range policy. */
export interface ZoomConfig {
  /** the factor a bare call (or `'unset'`) renders. */
  value: number;
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a zoom book. "Typed token in, plain CSS out": render
 * with `.css()`, typed against csstype's `Property.Zoom` (its full valid
 * surface, e.g. the bare number string), or read the raw factor via `.value()`.
 */
export interface ResolvedZoom {
  /** the zoom as a CSS value, typed against `Property.Zoom`. */
  css(): Property.Zoom;
  /** the raw factor number backing this value. */
  value(): number;
}

/** A zoom book: callable bare (the configured default) or with a factor. */
export type Zoom = (input?: ZoomInput) => ResolvedZoom;
