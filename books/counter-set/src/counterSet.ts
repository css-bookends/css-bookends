import {
  counterSet,
  type MultiCssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  CounterSetConfig,
  CounterSetInput,
  ResolvedCounterSet,
} from './types';

/* The book's built-in defaults. Counter-set has no tunable config of its own. */
export const defaultConfig: CounterSetConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated engine value, typed against `Property.CounterSet`. */
type Store = MultiCssValue<'CounterSet'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw counter-set input into the canonical store. The grammar (the
 * `<custom-ident> <integer>?` entries, the `none` keyword, the per-entry integer
 * hardening, and the default integer of 0) is reused verbatim from the
 * css-value-core `counterSet` helper: a `'none'` keyword passes through, and a
 * non-empty entry list is spread into the helper.
 */
function parse(raw: CounterSetInput | undefined): Store {
  // an input is required (the engine helper takes at least one entry). Unlike a
  // single-arg helper we cannot defer a missing input to the engine, so guard it.
  if (raw === undefined) {
    throw new Error(
      "counterSet: an input is required (a list of entries or 'none')",
    );
  }
  if (raw === 'none') {
    return counterSet('none');
  }
  const [
    first,
    ...rest
  ] = raw;
  return counterSet(first, ...rest);
}

/* ---------- output: store -> navigable ResolvedCounterSet ---------- */

function build(store: Store): ResolvedCounterSet {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const counterSetManuscript: Manuscript<
  CounterSetInput,
  Store,
  ResolvedCounterSet,
  CounterSetConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookCounterSet: the counter-set factory. `publishBookCounterSet()` binds
 * a counter-set book; calling the book with a list of `<custom-ident> <integer>?`
 * entries (or the keyword `'none'`) renders a `ResolvedCounterSet`.
 */
export const publishBookCounterSet = publishBook(
  counterSetManuscript,
);
