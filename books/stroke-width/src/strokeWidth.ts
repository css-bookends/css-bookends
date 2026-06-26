import {
  type MultiCssValue,
  strokeWidth as strokeWidthValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  ResolvedStrokeWidth,
  StrokeWidthConfig,
  StrokeWidthInput,
} from './types';

/* The book has no tunable config. */
export const defaultConfig: StrokeWidthConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated multi-part value, typed against `Property.StrokeWidth`. */
type Store = MultiCssValue<'StrokeWidth'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw stroke width into the canonical store. The validation (a
 * non-negative `<number>` hardened through `f({ min: 0 })`, or a length rendered
 * from an `IMeasurement`) is reused verbatim from the css-value-core
 * `strokeWidth` helper. The helper takes a single `number | IMeasurement`, so
 * the book forwards the input straight through.
 */
function parse(raw: StrokeWidthInput | undefined): Store {
  if (raw === undefined) {
    throw new Error(
      'strokeWidth: an input is required (a non-negative number or a length)',
    );
  }
  return strokeWidthValue(raw);
}

/* ---------- output: store -> navigable ResolvedStrokeWidth ---------- */

function build(store: Store): ResolvedStrokeWidth {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const strokeWidthManuscript: Manuscript<
  StrokeWidthInput,
  Store,
  ResolvedStrokeWidth,
  StrokeWidthConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookStrokeWidth: the stroke-width factory. `publishBookStrokeWidth()`
 * binds a stroke-width book; calling the book with a non-negative `<number>` or
 * an `IMeasurement` renders a `ResolvedStrokeWidth`.
 */
export const publishBookStrokeWidth = publishBook(
  strokeWidthManuscript,
);
