import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  FontSizeAdjustConfig,
  FontSizeAdjustInput,
  ResolvedFontSizeAdjust,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookFontSizeAdjust({ config }). */
export const defaultConfig: FontSizeAdjustConfig = {
  value: 'none',
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.FontSizeAdjust`. */
type Store = CssValue<'FontSizeAdjust'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw font-size-adjust into the canonical store. The validation
 * (non-negative range, the keyword set, and the throw-or-clamp policy) is reused
 * verbatim from the calipers css-values factory: we bind one factory at the
 * config's `outOfRange` and call its `fontSizeAdjust` helper. `'unset'` /
 * `undefined` fall back to the configured default.
 */
function parse(
  raw: FontSizeAdjustInput | undefined,
  cfg: FontSizeAdjustConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const next = raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.fontSizeAdjust(next);
}

/* ---------- output: store -> navigable ResolvedFontSizeAdjust ---------- */

function build(store: Store): ResolvedFontSizeAdjust {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const fontSizeAdjustManuscript: Manuscript<
  FontSizeAdjustInput,
  Store,
  ResolvedFontSizeAdjust,
  FontSizeAdjustConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookFontSizeAdjust: the font-size-adjust factory.
 * `publishBookFontSizeAdjust({ config })` binds a font-size-adjust book (default
 * value + out-of-range policy); calling the book renders a
 * `ResolvedFontSizeAdjust`. A bare book call renders the configured default.
 */
export const publishBookFontSizeAdjust = publishBook(
  fontSizeAdjustManuscript,
);
