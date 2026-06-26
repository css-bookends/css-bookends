import type { OutOfRange } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** How an out-of-range ordinal is handled: defer to the primitive (`'throw'`) or clamp. */
export type { OutOfRange };

/* ---------- the input ---------- */

/**
 * An order input: a raw integer ordinal group (negatives allowed), or `'unset'` /
 * `undefined` to fall back to the book's configured default value.
 */
export type OrderInput = number | 'unset';

/* ---------- factory config ---------- */

/** The book's defaults: the fallback ordinal and the out-of-range policy. */
export interface OrderConfig {
  /** the ordinal a bare call (or `'unset'`) renders. */
  value: number;
  /** out-of-range policy for raw numbers (`'throw'`, the default, or `'clamp'`). */
  outOfRange: OutOfRange;
}

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling an order book. "Typed token in, plain CSS out": render
 * with `.css()`, typed against csstype's `Property.Order` (its full valid
 * surface, e.g. the bare integer string), or read the raw ordinal via `.value()`.
 */
export interface ResolvedOrder {
  /** the order as a CSS value, typed against `Property.Order`. */
  css(): Property.Order;
  /** the raw ordinal number backing this value. */
  value(): number;
}

/** An order book: callable bare (the configured default) or with an ordinal. */
export type Order = (input?: OrderInput) => ResolvedOrder;
