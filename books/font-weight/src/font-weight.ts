import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  FontWeightConfig,
  FontWeightInput,
  ResolvedFontWeight,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookFontWeight({ config }). */
export const defaultConfig: FontWeightConfig = {
  value: 'normal',
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.FontWeight`. */
type Store = CssValue<'FontWeight'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw font-weight into the canonical store. The validation (the
 * `[1, 1000]` bound, the keyword set, and the throw-or-clamp policy) is reused
 * verbatim from the calipers css-values factory: we bind one factory at the
 * config's `outOfRange` and call its `fontWeight` helper. `'unset'` /
 * `undefined` fall back to the configured default.
 */
function parse(
  raw: FontWeightInput | undefined,
  cfg: FontWeightConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const next = raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.fontWeight(next);
}

/* ---------- output: store -> navigable ResolvedFontWeight ---------- */

function build(store: Store): ResolvedFontWeight {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const fontWeightManuscript: Manuscript<
  FontWeightInput,
  Store,
  ResolvedFontWeight,
  FontWeightConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookFontWeight: the font-weight factory. `publishBookFontWeight({ config })`
 * binds a font-weight book (default value + out-of-range policy); calling the book
 * renders a `ResolvedFontWeight`. A bare book call renders the configured default.
 */
export const publishBookFontWeight = publishBook(
  fontWeightManuscript,
);
