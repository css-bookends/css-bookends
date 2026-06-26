import {
  gridRowStart,
  type MultiCssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  GridRowStartConfig,
  GridRowStartInput,
  ResolvedGridRowStart,
} from './types';

/* The book's built-in defaults. The grid-line engine has no tunable policy. */
export const defaultConfig: GridRowStartConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated engine value, typed against `Property.GridRowStart`. */
type Store = MultiCssValue<'GridRowStart'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw grid-line position into the canonical store. The validation (a
 * nonzero integer line, a `<custom-ident>` named line, `'auto'`, or a `span N`
 * count `>= 1`) is reused verbatim from the css-value-core `gridRowStart` helper.
 */
function parse(raw: GridRowStartInput | undefined): Store {
  // a grid-line position is required (there is no sensible defaulted line). Guard
  // a missing input with a clear message rather than letting the engine helper
  // mistake `undefined` for a malformed span input.
  if (raw === undefined) {
    throw new Error(
      'gridRowStart: a grid-line position is required ' +
        "(a line number, a named line, 'auto', or span(n))",
    );
  }
  return gridRowStart(raw);
}

/* ---------- output: store -> navigable ResolvedGridRowStart ---------- */

function build(store: Store): ResolvedGridRowStart {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const gridRowStartManuscript: Manuscript<
  GridRowStartInput,
  Store,
  ResolvedGridRowStart,
  GridRowStartConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookGridRowStart: the grid-row-start factory. `publishBookGridRowStart()`
 * binds a book; calling the book with a grid-line position renders a
 * `ResolvedGridRowStart`.
 */
export const publishBookGridRowStart = publishBook(
  gridRowStartManuscript,
);
