import {
  type MultiCssValue,
  tabSize as tabSizeValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  ResolvedTabSize,
  TabSizeConfig,
  TabSizeInput,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookTabSize({ config }). */
export const defaultConfig: TabSizeConfig = {
  value: 8,
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated multi-part value, typed against `Property.TabSize`. */
type Store = MultiCssValue<'TabSize'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw tab size into the canonical store. The validation (a
 * non-negative `<number>` hardened through `f({ min: 0 })`, or a length rendered
 * from an `IMeasurement`) is reused verbatim from the css-value-core `tabSize`
 * helper. The helper already takes a single `number | IMeasurement`, so the book
 * forwards the input straight through. `undefined` falls back to the configured
 * default.
 */
function parse(
  raw: TabSizeInput | undefined,
  cfg: TabSizeConfig,
): Store {
  const input = raw === undefined ? cfg.value : raw;
  return tabSizeValue(input);
}

/* ---------- output: store -> navigable ResolvedTabSize ---------- */

function build(store: Store): ResolvedTabSize {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const tabSizeManuscript: Manuscript<
  TabSizeInput,
  Store,
  ResolvedTabSize,
  TabSizeConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookTabSize: the tab-size factory. `publishBookTabSize({ config })`
 * binds a tab-size book (its default value); calling the book renders a
 * `ResolvedTabSize`. A bare book call renders the configured default tab size.
 */
export const publishBookTabSize = publishBook(tabSizeManuscript);
