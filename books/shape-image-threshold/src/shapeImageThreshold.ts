import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  ResolvedShapeImageThreshold,
  ShapeImageThresholdConfig,
  ShapeImageThresholdInput,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookShapeImageThreshold({ config }). */
export const defaultConfig: ShapeImageThresholdConfig = {
  value: 0,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.ShapeImageThreshold`. */
type Store = CssValue<'ShapeImageThreshold'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw alpha into the canonical store. The validation (range [0, 1]
 * and the throw-or-clamp policy) is reused verbatim from the calipers css-values
 * factory: we bind one factory at the config's `outOfRange` and call its
 * `shapeImageThreshold` helper. `'unset'` / `undefined` fall back to the configured default.
 */
function parse(
  raw: ShapeImageThresholdInput | undefined,
  cfg: ShapeImageThresholdConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const alpha =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.shapeImageThreshold(alpha);
}

/* ---------- output: store -> navigable ResolvedShapeImageThreshold ---------- */

function build(store: Store): ResolvedShapeImageThreshold {
  return {
    css: () => store.css(),
    value: () => store.value() as number,
  };
}

/* ---------- the manuscript + the factory ---------- */

const shapeImageThresholdManuscript: Manuscript<
  ShapeImageThresholdInput,
  Store,
  ResolvedShapeImageThreshold,
  ShapeImageThresholdConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookShapeImageThreshold: the shape-image-threshold factory.
 * `publishBookShapeImageThreshold({ config })` binds a shape-image-threshold book
 * (default value + out-of-range policy); calling the book renders a
 * `ResolvedShapeImageThreshold`. A bare book call renders the configured default alpha.
 */
export const publishBookShapeImageThreshold = publishBook(
  shapeImageThresholdManuscript,
);
