import {
  gridColumnStart,
  type MultiCssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  GridColumnStartConfig,
  GridColumnStartInput,
  ResolvedGridColumnStart,
} from './types';

/* The book's built-in defaults. The grid-line engine has no tunable policy. */
export const defaultConfig: GridColumnStartConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated engine value, typed against `Property.GridColumnStart`. */
type Store = MultiCssValue<'GridColumnStart'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw grid-line position into the canonical store. The validation (a
 * nonzero integer line, a `<custom-ident>` named line, `'auto'`, or a `span N`
 * count `>= 1`) is reused verbatim from the css-value-core `gridColumnStart`
 * helper.
 */
function parse(raw: GridColumnStartInput | undefined): Store {
  // a grid-line position is required (there is no sensible defaulted line). Guard
  // a missing input with a clear message rather than letting the engine helper
  // mistake `undefined` for a malformed span input.
  if (raw === undefined) {
    throw new Error(
      'gridColumnStart: a grid-line position is required ' +
        "(a line number, a named line, 'auto', or span(n))",
    );
  }
  return gridColumnStart(raw);
}

/* ---------- output: store -> navigable ResolvedGridColumnStart ---------- */

function build(store: Store): ResolvedGridColumnStart {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const gridColumnStartManuscript: Manuscript<
  GridColumnStartInput,
  Store,
  ResolvedGridColumnStart,
  GridColumnStartConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookGridColumnStart: the grid-column-start factory.
 * `publishBookGridColumnStart()` binds a book; calling the book with a grid-line
 * position renders a `ResolvedGridColumnStart`.
 */
export const publishBookGridColumnStart = publishBook(
  gridColumnStartManuscript,
);
