import {
  counterReset,
  type MultiCssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  CounterResetConfig,
  CounterResetInput,
  ResolvedCounterReset,
} from './types';

/* The book's built-in defaults. Counter-reset has no tunable config of its own. */
export const defaultConfig: CounterResetConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated engine value, typed against `Property.CounterReset`. */
type Store = MultiCssValue<'CounterReset'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw counter-reset input into the canonical store. The grammar (the
 * `<custom-ident> <integer>?` entries, the `none` keyword, the per-entry integer
 * hardening, and the default integer of 0) is reused verbatim from the
 * css-value-core `counterReset` helper: a `'none'` keyword passes through, and a
 * non-empty entry list is spread into the helper.
 */
function parse(raw: CounterResetInput | undefined): Store {
  // an input is required (the engine helper takes at least one entry). Unlike a
  // single-arg helper we cannot defer a missing input to the engine, so guard it.
  if (raw === undefined) {
    throw new Error(
      "counterReset: an input is required (a list of entries or 'none')",
    );
  }
  if (raw === 'none') {
    return counterReset('none');
  }
  const [
    first,
    ...rest
  ] = raw;
  return counterReset(first, ...rest);
}

/* ---------- output: store -> navigable ResolvedCounterReset ---------- */

function build(store: Store): ResolvedCounterReset {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const counterResetManuscript: Manuscript<
  CounterResetInput,
  Store,
  ResolvedCounterReset,
  CounterResetConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookCounterReset: the counter-reset factory. `publishBookCounterReset()`
 * binds a counter-reset book; calling the book with a list of
 * `<custom-ident> <integer>?` entries (or the keyword `'none'`) renders a
 * `ResolvedCounterReset`.
 */
export const publishBookCounterReset = publishBook(
  counterResetManuscript,
);
