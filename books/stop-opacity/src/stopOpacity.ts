import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  ResolvedStopOpacity,
  StopOpacityConfig,
  StopOpacityInput,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookStopOpacity({ config }). */
export const defaultConfig: StopOpacityConfig = {
  value: 1,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.StopOpacity`. */
type Store = CssValue<'StopOpacity'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw alpha into the canonical store. The validation (range [0, 1]
 * and the throw-or-clamp policy) is reused verbatim from the calipers css-values
 * factory: we bind one factory at the config's `outOfRange` and call its
 * `stopOpacity` helper. `'unset'` / `undefined` fall back to the configured default.
 */
function parse(
  raw: StopOpacityInput | undefined,
  cfg: StopOpacityConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const alpha =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.stopOpacity(alpha);
}

/* ---------- output: store -> navigable ResolvedStopOpacity ---------- */

function build(store: Store): ResolvedStopOpacity {
  return {
    css: () => store.css(),
    value: () => store.value() as number,
  };
}

/* ---------- the manuscript + the factory ---------- */

const stopOpacityManuscript: Manuscript<
  StopOpacityInput,
  Store,
  ResolvedStopOpacity,
  StopOpacityConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookStopOpacity: the stop-opacity factory. `publishBookStopOpacity({ config })`
 * binds a stop-opacity book (default value + out-of-range policy); calling the book
 * renders a `ResolvedStopOpacity`. A bare book call renders the configured default alpha.
 */
export const publishBookStopOpacity = publishBook(
  stopOpacityManuscript,
);
