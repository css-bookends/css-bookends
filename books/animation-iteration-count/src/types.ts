import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range count is handled: defer to the primitive (`'throw'`) or clamp. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * An animation-iteration-count input: a raw non-negative number, the
 * `'infinite'` keyword, or `'unset'` / `undefined` to fall back to the book's
 * configured default value.
 */
export type AnimationIterationCountInput =
  | number
  | 'infinite'
  | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback count and the out-of-range policy. */
export interface AnimationIterationCountConfig {
  /** the count a bare call (or `'unset'`) renders (a number or `'infinite'`). */
  value: number | 'infinite';
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling an animation-iteration-count book. "Typed token in,
 * plain CSS out": render with `.css()`, typed against csstype's
 * `Property.AnimationIterationCount` (its full valid surface, e.g. the bare
 * number string), or read the backing value via `.value()` (a `number` for a
 * numeric input, a `string` for a keyword).
 */
export interface ResolvedAnimationIterationCount {
  /** the count as a CSS value, typed against `Property.AnimationIterationCount`. */
  css(): Property.AnimationIterationCount;
  /** the raw value backing this result: a `number` count, or a keyword `string`. */
  value(): number | string;
}

/**
 * An animation-iteration-count book: callable bare (the configured default) or
 * with a count.
 */
export type AnimationIterationCount = (
  input?: AnimationIterationCountInput,
) => ResolvedAnimationIterationCount;
