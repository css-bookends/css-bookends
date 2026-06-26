import {
  gridColumnEnd,
  type MultiCssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  GridColumnEndConfig,
  GridColumnEndInput,
  ResolvedGridColumnEnd,
} from './types';

/* The book's built-in defaults. The grid-line engine has no tunable policy. */
export const defaultConfig: GridColumnEndConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated engine value, typed against `Property.GridColumnEnd`. */
type Store = MultiCssValue<'GridColumnEnd'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw grid-line position into the canonical store. The validation (a
 * nonzero integer line, a `<custom-ident>` named line, `'auto'`, or a `span N`
 * count `>= 1`) is reused verbatim from the css-value-core `gridColumnEnd` helper.
 */
function parse(raw: GridColumnEndInput | undefined): Store {
  // a grid-line position is required (there is no sensible defaulted line). Guard
  // a missing input with a clear message rather than letting the engine helper
  // mistake `undefined` for a malformed span input.
  if (raw === undefined) {
    throw new Error(
      'gridColumnEnd: a grid-line position is required ' +
        "(a line number, a named line, 'auto', or span(n))",
    );
  }
  return gridColumnEnd(raw);
}

/* ---------- output: store -> navigable ResolvedGridColumnEnd ---------- */

function build(store: Store): ResolvedGridColumnEnd {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const gridColumnEndManuscript: Manuscript<
  GridColumnEndInput,
  Store,
  ResolvedGridColumnEnd,
  GridColumnEndConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookGridColumnEnd: the grid-column-end factory.
 * `publishBookGridColumnEnd()` binds a book; calling the book with a grid-line
 * position renders a `ResolvedGridColumnEnd`.
 */
export const publishBookGridColumnEnd = publishBook(
  gridColumnEndManuscript,
);
