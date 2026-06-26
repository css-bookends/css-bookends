import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  LineHeightConfig,
  LineHeightInput,
  ResolvedLineHeight,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookLineHeight({ config }). */
export const defaultConfig: LineHeightConfig = {
  value: 'normal',
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.LineHeight`. */
type Store = CssValue<'LineHeight'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw line-height into the canonical store. The validation (the
 * non-negative bound, the `'normal'` keyword, and the throw-or-clamp policy) is
 * reused verbatim from the calipers css-values factory: we bind one factory at
 * the config's `outOfRange` and call its `lineHeight` helper. `'unset'` /
 * `undefined` fall back to the configured default.
 */
function parse(
  raw: LineHeightInput | undefined,
  cfg: LineHeightConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const next = raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.lineHeight(next);
}

/* ---------- output: store -> navigable ResolvedLineHeight ---------- */

function build(store: Store): ResolvedLineHeight {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const lineHeightManuscript: Manuscript<
  LineHeightInput,
  Store,
  ResolvedLineHeight,
  LineHeightConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookLineHeight: the line-height factory. `publishBookLineHeight({ config })`
 * binds a line-height book (default value + out-of-range policy); calling the book
 * renders a `ResolvedLineHeight`. A bare book call renders the configured default.
 */
export const publishBookLineHeight = publishBook(
  lineHeightManuscript,
);
