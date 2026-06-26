import {
  type MultiCssValue,
  strokeDashoffset as strokeDashoffsetValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  ResolvedStrokeDashoffset,
  StrokeDashoffsetConfig,
  StrokeDashoffsetInput,
} from './types';

/* The book has no tunable config. */
export const defaultConfig: StrokeDashoffsetConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated multi-part value, typed against `Property.StrokeDashoffset`. */
type Store = MultiCssValue<'StrokeDashoffset'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw stroke dashoffset into the canonical store. The validation (a
 * signed `<number>` hardened through `f()`, or a length rendered from an
 * `IMeasurement`) is reused verbatim from the css-value-core `strokeDashoffset`
 * helper. The helper takes a single `number | IMeasurement`, so the book
 * forwards the input straight through.
 */
function parse(raw: StrokeDashoffsetInput | undefined): Store {
  if (raw === undefined) {
    throw new Error(
      'strokeDashoffset: an input is required (a number or a length)',
    );
  }
  return strokeDashoffsetValue(raw);
}

/* ---------- output: store -> navigable ResolvedStrokeDashoffset ---------- */

function build(store: Store): ResolvedStrokeDashoffset {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const strokeDashoffsetManuscript: Manuscript<
  StrokeDashoffsetInput,
  Store,
  ResolvedStrokeDashoffset,
  StrokeDashoffsetConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookStrokeDashoffset: the stroke-dashoffset factory.
 * `publishBookStrokeDashoffset()` binds a stroke-dashoffset book; calling the
 * book with a signed `<number>` or an `IMeasurement` renders a
 * `ResolvedStrokeDashoffset`.
 */
export const publishBookStrokeDashoffset = publishBook(
  strokeDashoffsetManuscript,
);
