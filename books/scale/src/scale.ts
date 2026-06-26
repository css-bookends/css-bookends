import {
  type MultiCssValue,
  scale as scaleValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type { ResolvedScale, ScaleConfig, ScaleInput } from './types';

/* The book's built-in defaults. A project overrides these via publishBookScale({ config }). */
export const defaultConfig: ScaleConfig = {
  value: [
    1,
  ],
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated multi-part value, typed against `Property.Scale`. */
type Store = MultiCssValue<'Scale'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw scale into the canonical store. The validation (one to three
 * factors hardened through `f()`, or the `'none'` keyword) is reused verbatim
 * from the css-value-core `scale` helper. The engine helper is variadic
 * (`scale('none')` or `scale(x, y?, z?)`), so a factor tuple is spread back into
 * it. `undefined` falls back to the configured default.
 */
function parse(raw: ScaleInput | undefined, cfg: ScaleConfig): Store {
  const input = raw === undefined ? cfg.value : raw;
  if (input === 'none') {
    return scaleValue('none');
  }
  return scaleValue(...input);
}

/* ---------- output: store -> navigable ResolvedScale ---------- */

function build(store: Store): ResolvedScale {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const scaleManuscript: Manuscript<
  ScaleInput,
  Store,
  ResolvedScale,
  ScaleConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookScale: the scale factory. `publishBookScale({ config })` binds a
 * scale book (its default value); calling the book renders a `ResolvedScale`. A
 * bare book call renders the configured default scale.
 */
export const publishBookScale = publishBook(scaleManuscript);
