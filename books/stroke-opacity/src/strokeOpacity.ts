import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  ResolvedStrokeOpacity,
  StrokeOpacityConfig,
  StrokeOpacityInput,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookStrokeOpacity({ config }). */
export const defaultConfig: StrokeOpacityConfig = {
  value: 1,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.StrokeOpacity`. */
type Store = CssValue<'StrokeOpacity'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw alpha into the canonical store. The validation (range [0, 1]
 * and the throw-or-clamp policy) is reused verbatim from the calipers css-values
 * factory: we bind one factory at the config's `outOfRange` and call its
 * `strokeOpacity` helper. `'unset'` / `undefined` fall back to the configured default.
 */
function parse(
  raw: StrokeOpacityInput | undefined,
  cfg: StrokeOpacityConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const alpha =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.strokeOpacity(alpha);
}

/* ---------- output: store -> navigable ResolvedStrokeOpacity ---------- */

function build(store: Store): ResolvedStrokeOpacity {
  return {
    css: () => store.css(),
    value: () => store.value() as number,
  };
}

/* ---------- the manuscript + the factory ---------- */

const strokeOpacityManuscript: Manuscript<
  StrokeOpacityInput,
  Store,
  ResolvedStrokeOpacity,
  StrokeOpacityConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookStrokeOpacity: the stroke-opacity factory. `publishBookStrokeOpacity({ config })`
 * binds a stroke-opacity book (default value + out-of-range policy); calling the book
 * renders a `ResolvedStrokeOpacity`. A bare book call renders the configured default alpha.
 */
export const publishBookStrokeOpacity = publishBook(
  strokeOpacityManuscript,
);
