import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  FlexGrowConfig,
  FlexGrowInput,
  ResolvedFlexGrow,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookFlexGrow({ config }). */
export const defaultConfig: FlexGrowConfig = {
  value: 0,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.FlexGrow`. */
type Store = CssValue<'FlexGrow'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw factor into the canonical store. The validation (range `>= 0`
 * and the throw-or-clamp policy) is reused verbatim from the calipers css-values
 * factory: we bind one factory at the config's `outOfRange` and call its
 * `flexGrow` helper. `'unset'` / `undefined` fall back to the configured default.
 */
function parse(
  raw: FlexGrowInput | undefined,
  cfg: FlexGrowConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const factor =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.flexGrow(factor);
}

/* ---------- output: store -> navigable ResolvedFlexGrow ---------- */

function build(store: Store): ResolvedFlexGrow {
  return {
    css: () => store.css(),
    value: () => store.value() as number,
  };
}

/* ---------- the manuscript + the factory ---------- */

const flexGrowManuscript: Manuscript<
  FlexGrowInput,
  Store,
  ResolvedFlexGrow,
  FlexGrowConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookFlexGrow: the flex-grow factory. `publishBookFlexGrow({ config })` binds
 * a flex-grow book (default value + out-of-range policy); calling the book renders
 * a `ResolvedFlexGrow`. A bare book call renders the configured default factor.
 */
export const publishBookFlexGrow = publishBook(flexGrowManuscript);
