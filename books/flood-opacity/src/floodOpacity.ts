import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  FloodOpacityConfig,
  FloodOpacityInput,
  ResolvedFloodOpacity,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookFloodOpacity({ config }). */
export const defaultConfig: FloodOpacityConfig = {
  value: 1,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.FloodOpacity`. */
type Store = CssValue<'FloodOpacity'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw alpha into the canonical store. The validation (range [0, 1]
 * and the throw-or-clamp policy) is reused verbatim from the calipers css-values
 * factory: we bind one factory at the config's `outOfRange` and call its
 * `floodOpacity` helper. `'unset'` / `undefined` fall back to the configured default.
 */
function parse(
  raw: FloodOpacityInput | undefined,
  cfg: FloodOpacityConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const alpha =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.floodOpacity(alpha);
}

/* ---------- output: store -> navigable ResolvedFloodOpacity ---------- */

function build(store: Store): ResolvedFloodOpacity {
  return {
    css: () => store.css(),
    value: () => store.value() as number,
  };
}

/* ---------- the manuscript + the factory ---------- */

const floodOpacityManuscript: Manuscript<
  FloodOpacityInput,
  Store,
  ResolvedFloodOpacity,
  FloodOpacityConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookFloodOpacity: the flood-opacity factory. `publishBookFloodOpacity({ config })`
 * binds a flood-opacity book (default value + out-of-range policy); calling the book
 * renders a `ResolvedFloodOpacity`. A bare book call renders the configured default alpha.
 */
export const publishBookFloodOpacity = publishBook(
  floodOpacityManuscript,
);
