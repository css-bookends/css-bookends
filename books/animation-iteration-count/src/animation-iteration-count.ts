import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  AnimationIterationCountConfig,
  AnimationIterationCountInput,
  ResolvedAnimationIterationCount,
} from './types';

/* The book's built-in defaults. A project overrides these via publishBookAnimationIterationCount({ config }). */
export const defaultConfig: AnimationIterationCountConfig = {
  value: 1,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.AnimationIterationCount`. */
type Store = CssValue<'AnimationIterationCount'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw count into the canonical store. The validation (the
 * non-negative bound, the `'infinite'` keyword, and the throw-or-clamp policy)
 * is reused verbatim from the calipers css-values factory: we bind one factory
 * at the config's `outOfRange` and call its `animationIterationCount` helper.
 * `'unset'` / `undefined` fall back to the configured default.
 */
function parse(
  raw: AnimationIterationCountInput | undefined,
  cfg: AnimationIterationCountConfig,
): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const count =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.animationIterationCount(count);
}

/* ---------- output: store -> navigable ResolvedAnimationIterationCount ---------- */

function build(store: Store): ResolvedAnimationIterationCount {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const animationIterationCountManuscript: Manuscript<
  AnimationIterationCountInput,
  Store,
  ResolvedAnimationIterationCount,
  AnimationIterationCountConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookAnimationIterationCount: the animation-iteration-count factory.
 * `publishBookAnimationIterationCount({ config })` binds a book (default count +
 * out-of-range policy); calling the book renders a
 * `ResolvedAnimationIterationCount`. A bare book call renders the configured
 * default count.
 */
export const publishBookAnimationIterationCount = publishBook(
  animationIterationCountManuscript,
);
