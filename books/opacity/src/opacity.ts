import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  OpacityConfig,
  OpacityInput,
  ResolvedOpacity,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookOpacity({ config }). */
export const defaultConfig: OpacityConfig = {
  value: 1,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.Opacity`. */
type Store = CssValue<'Opacity'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw alpha into the canonical store. The validation (range [0, 1]
 * and the throw-or-clamp policy) is reused verbatim from the calipers css-values
 * factory: we bind one factory at the config's `outOfRange` and call its
 * `opacity` helper. `'unset'` / `undefined` fall back to the configured default.
 */
function parse(
  raw: OpacityInput | undefined,
  cfg: OpacityConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const alpha =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.opacity(alpha);
}

/* ---------- output: store -> navigable ResolvedOpacity ---------- */

function build(store: Store): ResolvedOpacity {
  return {
    css: () => store.css(),
    value: () => store.value() as number,
  };
}

/* ---------- the manuscript + the factory ---------- */

const opacityManuscript: Manuscript<
  OpacityInput,
  Store,
  ResolvedOpacity,
  OpacityConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookOpacity: the opacity factory. `publishBookOpacity({ config })` binds
 * an opacity book (default value + out-of-range policy); calling the book renders
 * a `ResolvedOpacity`. A bare book call renders the configured default alpha.
 */
export const publishBookOpacity = publishBook(opacityManuscript);
