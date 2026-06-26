import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  ResolvedWidows,
  WidowsConfig,
  WidowsInput,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookWidows({ config }). */
export const defaultConfig: WidowsConfig = {
  value: 2,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.Widows`. */
type Store = CssValue<'Widows'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw count into the canonical store. The validation (an integer
 * `>= 1` and the throw-or-clamp policy) is reused verbatim from the calipers
 * css-values factory: we bind one factory at the config's `outOfRange` and call
 * its `widows` helper. `'unset'` / `undefined` fall back to the configured default.
 */
function parse(
  raw: WidowsInput | undefined,
  cfg: WidowsConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const count =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.widows(count);
}

/* ---------- output: store -> navigable ResolvedWidows ---------- */

function build(store: Store): ResolvedWidows {
  return {
    css: () => store.css(),
    value: () => store.value() as number,
  };
}

/* ---------- the manuscript + the factory ---------- */

const widowsManuscript: Manuscript<
  WidowsInput,
  Store,
  ResolvedWidows,
  WidowsConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookWidows: the widows factory. `publishBookWidows({ config })` binds
 * a widows book (default value + out-of-range policy); calling the book renders
 * a `ResolvedWidows`. A bare book call renders the configured default count.
 */
export const publishBookWidows = publishBook(widowsManuscript);
