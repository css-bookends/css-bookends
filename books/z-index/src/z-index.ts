import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  ResolvedZIndex,
  ZIndexConfig,
  ZIndexInput,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookZIndex({ config }). */
export const defaultConfig: ZIndexConfig = {
  value: 'auto',
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.ZIndex`. */
type Store = CssValue<'ZIndex'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw z-index into the canonical store. The validation (the integer
 * constraint, the `'auto'` keyword, and the throw-or-clamp policy) is reused
 * verbatim from the calipers css-values factory: we bind one factory at the
 * config's `outOfRange` and call its `zIndex` helper. `'unset'` / `undefined`
 * fall back to the configured default.
 */
function parse(
  raw: ZIndexInput | undefined,
  cfg: ZIndexConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const next = raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.zIndex(next);
}

/* ---------- output: store -> navigable ResolvedZIndex ---------- */

function build(store: Store): ResolvedZIndex {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const zIndexManuscript: Manuscript<
  ZIndexInput,
  Store,
  ResolvedZIndex,
  ZIndexConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookZIndex: the z-index factory. `publishBookZIndex({ config })` binds
 * a z-index book (default value + out-of-range policy); calling the book renders
 * a `ResolvedZIndex`. A bare book call renders the configured default value.
 */
export const publishBookZIndex = publishBook(zIndexManuscript);
