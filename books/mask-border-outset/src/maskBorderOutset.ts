import {
  maskBorderOutset as maskBorderOutsetValue,
  type MultiCssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  MaskBorderOutsetConfig,
  MaskBorderOutsetInput,
  ResolvedMaskBorderOutset,
} from './types';

/* The book's built-in defaults. Mask-border-outset has no tunable config of its own. */
export const defaultConfig: MaskBorderOutsetConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated engine value, typed against `Property.MaskBorderOutset`. */
type Store = MultiCssValue<'MaskBorderOutset'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw mask-border-outset input into the canonical store. The grammar
 * (one to four entries, each a non-negative `<number>` hardened through
 * `f({ min: 0 })` or an `IMeasurement` length) is reused verbatim from the
 * css-value-core `maskBorderOutset` helper. The input tuple is spread into the
 * helper's variadic call.
 */
function parse(raw: MaskBorderOutsetInput | undefined): Store {
  // an input is required (the engine helper takes at least one entry). Unlike a
  // single-arg helper we cannot defer a missing input to the engine, so guard it.
  if (raw === undefined) {
    throw new Error(
      'maskBorderOutset: an input is required (one to four edge entries)',
    );
  }
  const [
    first,
    ...rest
  ] = raw;
  return maskBorderOutsetValue(
    first,
    ...rest.filter(
      (entry): entry is NonNullable<typeof entry> =>
        entry !== undefined,
    ),
  );
}

/* ---------- output: store -> navigable ResolvedMaskBorderOutset ---------- */

function build(store: Store): ResolvedMaskBorderOutset {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const maskBorderOutsetManuscript: Manuscript<
  MaskBorderOutsetInput,
  Store,
  ResolvedMaskBorderOutset,
  MaskBorderOutsetConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookMaskBorderOutset: the mask-border-outset factory.
 * `publishBookMaskBorderOutset()` binds a mask-border-outset book; calling the
 * book with one to four edge entries (each a non-negative `<number>` or a length
 * measurement) renders a `ResolvedMaskBorderOutset`.
 */
export const publishBookMaskBorderOutset = publishBook(
  maskBorderOutsetManuscript,
);
