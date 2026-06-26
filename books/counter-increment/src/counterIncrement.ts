import {
  counterIncrement,
  type MultiCssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  CounterIncrementConfig,
  CounterIncrementInput,
  ResolvedCounterIncrement,
} from './types';

/* The book's built-in defaults. Counter-increment has no tunable config of its own. */
export const defaultConfig: CounterIncrementConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated engine value, typed against `Property.CounterIncrement`. */
type Store = MultiCssValue<'CounterIncrement'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw counter-increment input into the canonical store. The grammar
 * (the `<custom-ident> <integer>?` entries, the `none` keyword, the per-entry
 * integer hardening, and the default integer of 1) is reused verbatim from the
 * css-value-core `counterIncrement` helper: a `'none'` keyword passes through,
 * and a non-empty entry list is spread into the helper.
 */
function parse(raw: CounterIncrementInput | undefined): Store {
  // an input is required (the engine helper takes at least one entry). Unlike a
  // single-arg helper we cannot defer a missing input to the engine, so guard it.
  if (raw === undefined) {
    throw new Error(
      "counterIncrement: an input is required (a list of entries or 'none')",
    );
  }
  if (raw === 'none') {
    return counterIncrement('none');
  }
  const [
    first,
    ...rest
  ] = raw;
  return counterIncrement(first, ...rest);
}

/* ---------- output: store -> navigable ResolvedCounterIncrement ---------- */

function build(store: Store): ResolvedCounterIncrement {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const counterIncrementManuscript: Manuscript<
  CounterIncrementInput,
  Store,
  ResolvedCounterIncrement,
  CounterIncrementConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookCounterIncrement: the counter-increment factory.
 * `publishBookCounterIncrement()` binds a counter-increment book; calling the
 * book with a list of `<custom-ident> <integer>?` entries (or the keyword
 * `'none'`) renders a `ResolvedCounterIncrement`.
 */
export const publishBookCounterIncrement = publishBook(
  counterIncrementManuscript,
);
