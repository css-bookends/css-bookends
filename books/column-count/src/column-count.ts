import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  ColumnCountConfig,
  ColumnCountInput,
  ResolvedColumnCount,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookColumnCount({ config }). */
export const defaultConfig: ColumnCountConfig = {
  value: 'auto',
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.ColumnCount`. */
type Store = CssValue<'ColumnCount'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw column-count into the canonical store. The validation (the
 * positive-integer constraint, the `'auto'` keyword, and the throw-or-clamp
 * policy) is reused verbatim from the calipers css-values factory: we bind one
 * factory at the config's `outOfRange` and call its `columnCount` helper.
 * `'unset'` / `undefined` fall back to the configured default.
 */
function parse(
  raw: ColumnCountInput | undefined,
  cfg: ColumnCountConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const next = raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.columnCount(next);
}

/* ---------- output: store -> navigable ResolvedColumnCount ---------- */

function build(store: Store): ResolvedColumnCount {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const columnCountManuscript: Manuscript<
  ColumnCountInput,
  Store,
  ResolvedColumnCount,
  ColumnCountConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookColumnCount: the column-count factory. `publishBookColumnCount({ config })`
 * binds a column-count book (default value + out-of-range policy); calling the book
 * renders a `ResolvedColumnCount`. A bare book call renders the configured default.
 */
export const publishBookColumnCount = publishBook(
  columnCountManuscript,
);
