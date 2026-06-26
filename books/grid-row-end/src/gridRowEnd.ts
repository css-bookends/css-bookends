import {
  gridRowEnd,
  type MultiCssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  GridRowEndConfig,
  GridRowEndInput,
  ResolvedGridRowEnd,
} from './types';

/* The book's built-in defaults. The grid-line engine has no tunable policy. */
export const defaultConfig: GridRowEndConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated engine value, typed against `Property.GridRowEnd`. */
type Store = MultiCssValue<'GridRowEnd'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw grid-line position into the canonical store. The validation (a
 * nonzero integer line, a `<custom-ident>` named line, `'auto'`, or a `span N`
 * count `>= 1`) is reused verbatim from the css-value-core `gridRowEnd` helper.
 */
function parse(raw: GridRowEndInput | undefined): Store {
  // a grid-line position is required (there is no sensible defaulted line). Guard
  // a missing input with a clear message rather than letting the engine helper
  // mistake `undefined` for a malformed span input.
  if (raw === undefined) {
    throw new Error(
      'gridRowEnd: a grid-line position is required ' +
        "(a line number, a named line, 'auto', or span(n))",
    );
  }
  return gridRowEnd(raw);
}

/* ---------- output: store -> navigable ResolvedGridRowEnd ---------- */

function build(store: Store): ResolvedGridRowEnd {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const gridRowEndManuscript: Manuscript<
  GridRowEndInput,
  Store,
  ResolvedGridRowEnd,
  GridRowEndConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookGridRowEnd: the grid-row-end factory. `publishBookGridRowEnd()` binds
 * a book; calling the book with a grid-line position renders a
 * `ResolvedGridRowEnd`.
 */
export const publishBookGridRowEnd = publishBook(
  gridRowEndManuscript,
);
