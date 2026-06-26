import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  FillOpacityConfig,
  FillOpacityInput,
  ResolvedFillOpacity,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookFillOpacity({ config }). */
export const defaultConfig: FillOpacityConfig = {
  value: 1,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.FillOpacity`. */
type Store = CssValue<'FillOpacity'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw alpha into the canonical store. The validation (range [0, 1]
 * and the throw-or-clamp policy) is reused verbatim from the calipers css-values
 * factory: we bind one factory at the config's `outOfRange` and call its
 * `fillOpacity` helper. `'unset'` / `undefined` fall back to the configured default.
 */
function parse(
  raw: FillOpacityInput | undefined,
  cfg: FillOpacityConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const alpha =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.fillOpacity(alpha);
}

/* ---------- output: store -> navigable ResolvedFillOpacity ---------- */

function build(store: Store): ResolvedFillOpacity {
  return {
    css: () => store.css(),
    value: () => store.value() as number,
  };
}

/* ---------- the manuscript + the factory ---------- */

const fillOpacityManuscript: Manuscript<
  FillOpacityInput,
  Store,
  ResolvedFillOpacity,
  FillOpacityConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookFillOpacity: the fill-opacity factory. `publishBookFillOpacity({ config })`
 * binds a fill-opacity book (default value + out-of-range policy); calling the book
 * renders a `ResolvedFillOpacity`. A bare book call renders the configured default alpha.
 */
export const publishBookFillOpacity = publishBook(
  fillOpacityManuscript,
);
