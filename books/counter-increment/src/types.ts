import type { CounterEntry } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/**
 * One `<custom-ident> <integer>?` entry of the counter list. A bare string is the
 * ident with the property's default integer (1 for counter-increment); a
 * `[ident, integer]` tuple supplies the integer explicitly. Re-exported from the
 * css-value-core engine, whose helper this book wraps.
 */
export type { CounterEntry };

/* ---------- the input ---------- */

/**
 * A counter-increment input: the keyword `'none'`, or a non-empty list of
 * `<custom-ident> <integer>?` entries. The list is spread into the engine's
 * `counterIncrement` helper, so a bare ident defaults its integer to 1.
 */
export type CounterIncrementInput =
  | 'none'
  | readonly [
      CounterEntry,
      ...(readonly CounterEntry[]),
    ];

/* ---------- factory config ---------- */

/** The book's config. Counter-increment carries no tunable defaults of its own. */
export type CounterIncrementConfig = Record<string, never>;

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a counter-increment book. "Typed token in, plain CSS
 * out": render with `.css()`, typed against csstype's `Property.CounterIncrement`,
 * or read the raw rendered string via `.value()`.
 */
export interface ResolvedCounterIncrement {
  /** the counter-increment as a CSS value, typed against `Property.CounterIncrement`. */
  css(): Property.CounterIncrement;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A counter-increment book: called with a list of entries or the keyword `'none'`. */
export type CounterIncrement = (
  input: CounterIncrementInput,
) => ResolvedCounterIncrement;
