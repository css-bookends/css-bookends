import type {
  GridLineInput,
  SpanInput,
} from '@css-bookends/css-value-core';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/**
 * The book re-exports `span` (the `span N` builder) and its `SpanInput` shape
 * from the engine, so a consumer imports everything it needs from this book:
 * `import { publishBookGridColumnStart, span } from '@css-bookends/grid-column-start'`.
 */
export { span } from '@css-bookends/css-value-core';
export type { GridLineInput, SpanInput };

/* ---------- the input ---------- */

/**
 * A grid-column-start input: a grid-line position. A nonzero `<integer>` line
 * number (negatives count from the end edge), `'auto'`, a `<custom-ident>` named
 * line, or a `span N` count built with {@link span}.
 */
export type GridColumnStartInput = GridLineInput;

/* ---------- factory config ---------- */

/**
 * The book's defaults. The grid-line engine helper carries no tunable policy
 * (line `0` always throws, a `span` count is always hardened to `>= 1`), so the
 * config is empty; it exists only to satisfy the self-publish manuscript shape.
 */
export type GridColumnStartConfig = Record<string, never>;

/* ---------- the resolved, navigable result ---------- */

/**
 * The result of calling a grid-column-start book. "Typed token in, plain CSS out":
 * render with `.css()`, typed against csstype's `Property.GridColumnStart`, or
 * read the raw rendered string via `.value()`.
 */
export interface ResolvedGridColumnStart {
  /** the grid line as a CSS value, typed against `Property.GridColumnStart`. */
  css(): Property.GridColumnStart;
  /** the raw rendered string backing this value. */
  value(): string;
}

/** A grid-column-start book: called with a grid-line position. */
export type GridColumnStart = (
  input: GridColumnStartInput,
) => ResolvedGridColumnStart;
