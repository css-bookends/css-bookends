import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  MathDepthConfig,
  MathDepthInput,
  ResolvedMathDepth,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookMathDepth({ config }). */
export const defaultConfig: MathDepthConfig = {
  value: 0,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.MathDepth`. */
type Store = CssValue<'MathDepth'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw math-depth into the canonical store. The validation (the
 * integer constraint, the `'auto-add'` keyword, and the throw-or-clamp policy)
 * is reused verbatim from the calipers css-values factory: we bind one factory
 * at the config's `outOfRange` and call its `mathDepth` helper. `'unset'` /
 * `undefined` fall back to the configured default.
 */
function parse(
  raw: MathDepthInput | undefined,
  cfg: MathDepthConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const next = raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.mathDepth(next);
}

/* ---------- output: store -> navigable ResolvedMathDepth ---------- */

function build(store: Store): ResolvedMathDepth {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const mathDepthManuscript: Manuscript<
  MathDepthInput,
  Store,
  ResolvedMathDepth,
  MathDepthConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookMathDepth: the math-depth factory. `publishBookMathDepth({ config })`
 * binds a math-depth book (default value + out-of-range policy); calling the book
 * renders a `ResolvedMathDepth`. A bare book call renders the configured default.
 */
export const publishBookMathDepth = publishBook(mathDepthManuscript);
