import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  OrphansConfig,
  OrphansInput,
  ResolvedOrphans,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookOrphans({ config }). */
export const defaultConfig: OrphansConfig = {
  value: 2,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.Orphans`. */
type Store = CssValue<'Orphans'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw count into the canonical store. The validation (an integer
 * `>= 1` and the throw-or-clamp policy) is reused verbatim from the calipers
 * css-values factory: we bind one factory at the config's `outOfRange` and call
 * its `orphans` helper. `'unset'` / `undefined` fall back to the configured default.
 */
function parse(
  raw: OrphansInput | undefined,
  cfg: OrphansConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const count =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.orphans(count);
}

/* ---------- output: store -> navigable ResolvedOrphans ---------- */

function build(store: Store): ResolvedOrphans {
  return {
    css: () => store.css(),
    value: () => store.value() as number,
  };
}

/* ---------- the manuscript + the factory ---------- */

const orphansManuscript: Manuscript<
  OrphansInput,
  Store,
  ResolvedOrphans,
  OrphansConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookOrphans: the orphans factory. `publishBookOrphans({ config })` binds
 * an orphans book (default value + out-of-range policy); calling the book renders
 * a `ResolvedOrphans`. A bare book call renders the configured default count.
 */
export const publishBookOrphans = publishBook(orphansManuscript);
