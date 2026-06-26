import {
  maskBorderWidth as maskBorderWidthValue,
  type MultiCssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  MaskBorderWidthConfig,
  MaskBorderWidthInput,
  ResolvedMaskBorderWidth,
} from './types';

/* The book's built-in defaults. Mask-border-width has no tunable config of its own. */
export const defaultConfig: MaskBorderWidthConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated engine value, typed against `Property.MaskBorderWidth`. */
type Store = MultiCssValue<'MaskBorderWidth'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw mask-border-width input into the canonical store. The grammar
 * (one to four entries, each a non-negative `<number>` hardened through
 * `f({ min: 0 })`, an `IMeasurement` length, or the keyword `'auto'`) is reused
 * verbatim from the css-value-core `maskBorderWidth` helper. The input tuple is
 * spread into the helper's variadic call.
 */
function parse(raw: MaskBorderWidthInput | undefined): Store {
  // an input is required (the engine helper takes at least one entry). Unlike a
  // single-arg helper we cannot defer a missing input to the engine, so guard it.
  if (raw === undefined) {
    throw new Error(
      'maskBorderWidth: an input is required (one to four edge entries)',
    );
  }
  const [
    first,
    ...rest
  ] = raw;
  return maskBorderWidthValue(
    first,
    ...rest.filter(
      (entry): entry is NonNullable<typeof entry> =>
        entry !== undefined,
    ),
  );
}

/* ---------- output: store -> navigable ResolvedMaskBorderWidth ---------- */

function build(store: Store): ResolvedMaskBorderWidth {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const maskBorderWidthManuscript: Manuscript<
  MaskBorderWidthInput,
  Store,
  ResolvedMaskBorderWidth,
  MaskBorderWidthConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookMaskBorderWidth: the mask-border-width factory.
 * `publishBookMaskBorderWidth()` binds a mask-border-width book; calling the book
 * with one to four edge entries (each a non-negative `<number>`, a length
 * measurement, or `'auto'`) renders a `ResolvedMaskBorderWidth`.
 */
export const publishBookMaskBorderWidth = publishBook(
  maskBorderWidthManuscript,
);
