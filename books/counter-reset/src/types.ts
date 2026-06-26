import type { CounterEntry } from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/**
 * One `<custom-ident> <integer>?` entry of the counter list. A bare string is the
 * ident with the property's default integer (0 for counter-reset); a
 * `[ident, integer]` tuple supplies the integer explicitly. Re-exported from the
 * css-value-core engine, whose helper this book wraps.
 */
export type { CounterEntry };

/* ---------- the input ---------- */

/**
 * A counter-reset input: the keyword `'none'`, or a non-empty list of
 * `<custom-ident> <integer>?` entries. The list is spread into the engine's
 * `counterReset` helper, so a bare ident defaults its integer to 0.
 */
export type CounterResetInput =
  | 'none'
  | readonly [
      CounterEntry,
      ...(readonly CounterEntry[]),
    ];

/* ---------- factory config ---------- */

/** The book's config. Counter-reset carries no tunable defaults of its own. */
export type CounterResetConfig = Record<string, never>;

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a counter-reset book. "Typed token in, plain CSS out":
 * render with `.css()`, typed against csstype's `Property.CounterReset`, or read
 * the raw rendered string via `.value()`.
 */
export interface ResolvedCounterReset {
  /** the counter-reset as a CSS value, typed against `Property.CounterReset`. */
  css(): Property.CounterReset;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A counter-reset book: called with a list of entries or the keyword `'none'`. */
export type CounterReset = (
  input: CounterResetInput,
) => ResolvedCounterReset;
