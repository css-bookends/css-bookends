import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type { ResolvedZoom, ZoomConfig, ZoomInput } from './types';

/* The book's built-in defaults. A project overrides these via publishBookZoom({ config }). */
export const defaultConfig: ZoomConfig = {
  value: 1,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.Zoom`. */
type Store = CssValue<'Zoom'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw factor into the canonical store. The validation (range `>= 0`
 * and the throw-or-clamp policy) is reused verbatim from the calipers css-values
 * factory: we bind one factory at the config's `outOfRange` and call its
 * `zoom` helper. `'unset'` / `undefined` fall back to the configured default.
 */
function parse(raw: ZoomInput | undefined, cfg: ZoomConfig): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const factor =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.zoom(factor);
}

/* ---------- output: store -> navigable ResolvedZoom ---------- */

function build(store: Store): ResolvedZoom {
  return {
    css: () => store.css(),
    value: () => store.value() as number,
  };
}

/* ---------- the manuscript + the factory ---------- */

const zoomManuscript: Manuscript<
  ZoomInput,
  Store,
  ResolvedZoom,
  ZoomConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookZoom: the zoom factory. `publishBookZoom({ config })` binds
 * a zoom book (default value + out-of-range policy); calling the book renders
 * a `ResolvedZoom`. A bare book call renders the configured default factor.
 */
export const publishBookZoom = publishBook(zoomManuscript);
