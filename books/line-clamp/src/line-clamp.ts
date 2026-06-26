import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  LineClampConfig,
  LineClampInput,
  ResolvedLineClamp,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookLineClamp({ config }). */
export const defaultConfig: LineClampConfig = {
  value: 'none',
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/**
 * The store is the validated calipers value. The css-value helper is named
 * `lineClamp`, but its csstype property key is `WebkitLineClamp` (the
 * `-webkit-line-clamp` property), so the store is typed against that key.
 */
type Store = CssValue<'WebkitLineClamp'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw line count into the canonical store. The validation (the
 * positive-integer bound, the `'none'` keyword, and the throw policy) is reused
 * verbatim from the calipers css-values factory: we bind one factory at the
 * config's `outOfRange` and call its `lineClamp` helper. `'unset'` / `undefined`
 * fall back to the configured default.
 */
function parse(
  raw: LineClampInput | undefined,
  cfg: LineClampConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const next = raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.lineClamp(next);
}

/* ---------- output: store -> navigable ResolvedLineClamp ---------- */

function build(store: Store): ResolvedLineClamp {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const lineClampManuscript: Manuscript<
  LineClampInput,
  Store,
  ResolvedLineClamp,
  LineClampConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookLineClamp: the line-clamp factory. `publishBookLineClamp({ config })`
 * binds a line-clamp book (default value + out-of-range policy); calling the book
 * renders a `ResolvedLineClamp`. A bare book call renders the configured default.
 */
export const publishBookLineClamp = publishBook(lineClampManuscript);
