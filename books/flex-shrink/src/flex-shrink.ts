import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  FlexShrinkConfig,
  FlexShrinkInput,
  ResolvedFlexShrink,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookFlexShrink({ config }). */
export const defaultConfig: FlexShrinkConfig = {
  value: 1,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.FlexShrink`. */
type Store = CssValue<'FlexShrink'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw factor into the canonical store. The validation (range `>= 0`
 * and the throw-or-clamp policy) is reused verbatim from the calipers css-values
 * factory: we bind one factory at the config's `outOfRange` and call its
 * `flexShrink` helper. `'unset'` / `undefined` fall back to the configured default.
 */
function parse(
  raw: FlexShrinkInput | undefined,
  cfg: FlexShrinkConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const factor =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.flexShrink(factor);
}

/* ---------- output: store -> navigable ResolvedFlexShrink ---------- */

function build(store: Store): ResolvedFlexShrink {
  return {
    css: () => store.css(),
    value: () => store.value() as number,
  };
}

/* ---------- the manuscript + the factory ---------- */

const flexShrinkManuscript: Manuscript<
  FlexShrinkInput,
  Store,
  ResolvedFlexShrink,
  FlexShrinkConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookFlexShrink: the flex-shrink factory. `publishBookFlexShrink({ config })` binds
 * a flex-shrink book (default value + out-of-range policy); calling the book renders
 * a `ResolvedFlexShrink`. A bare book call renders the configured default factor.
 */
export const publishBookFlexShrink = publishBook(
  flexShrinkManuscript,
);
