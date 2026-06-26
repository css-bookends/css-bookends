import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  ResolvedStrokeMiterlimit,
  StrokeMiterlimitConfig,
  StrokeMiterlimitInput,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookStrokeMiterlimit({ config }). */
export const defaultConfig: StrokeMiterlimitConfig = {
  value: 4,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.StrokeMiterlimit`. */
type Store = CssValue<'StrokeMiterlimit'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw ratio into the canonical store. The validation (range `>= 1`
 * and the throw-or-clamp policy) is reused verbatim from the calipers css-values
 * factory: we bind one factory at the config's `outOfRange` and call its
 * `strokeMiterlimit` helper. `'unset'` / `undefined` fall back to the configured default.
 */
function parse(
  raw: StrokeMiterlimitInput | undefined,
  cfg: StrokeMiterlimitConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const ratio =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.strokeMiterlimit(ratio);
}

/* ---------- output: store -> navigable ResolvedStrokeMiterlimit ---------- */

function build(store: Store): ResolvedStrokeMiterlimit {
  return {
    css: () => store.css(),
    value: () => store.value() as number,
  };
}

/* ---------- the manuscript + the factory ---------- */

const strokeMiterlimitManuscript: Manuscript<
  StrokeMiterlimitInput,
  Store,
  ResolvedStrokeMiterlimit,
  StrokeMiterlimitConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookStrokeMiterlimit: the stroke-miterlimit factory.
 * `publishBookStrokeMiterlimit({ config })` binds a stroke-miterlimit book
 * (default value + out-of-range policy); calling the book renders a
 * `ResolvedStrokeMiterlimit`. A bare book call renders the configured default ratio.
 */
export const publishBookStrokeMiterlimit = publishBook(
  strokeMiterlimitManuscript,
);
