import {
  maskBorderSlice as maskBorderSliceValue,
  type MultiCssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  MaskBorderSliceConfig,
  MaskBorderSliceFill,
  MaskBorderSliceInput,
  MaskBorderSliceNumber,
  ResolvedMaskBorderSlice,
} from './types';

/* The book's built-in defaults. Mask-border-slice has no tunable config of its own. */
export const defaultConfig: MaskBorderSliceConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated engine value, typed against `Property.MaskBorderSlice`. */
type Store = MultiCssValue<'MaskBorderSlice'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw mask-border-slice input into the canonical store. The grammar
 * (one to four non-negative `<number>` entries hardened through `f({ min: 0 })`,
 * with an optional trailing `'fill'` keyword) is reused verbatim from the
 * css-value-core `maskBorderSlice` helper. The input tuple's optional trailing
 * slots may be `undefined`, so the empty slots are dropped before the remaining
 * entries are spread into the helper's variadic call.
 */
function parse(raw: MaskBorderSliceInput | undefined): Store {
  // an input is required (the engine helper takes at least one entry). Unlike a
  // single-arg helper we cannot defer a missing input to the engine, so guard it.
  if (raw === undefined) {
    throw new Error(
      'maskBorderSlice: an input is required (one to four numbers with an optional trailing fill)',
    );
  }
  const [
    first,
    ...rest
  ] = raw;
  const trailing = rest.filter(
    (entry): entry is MaskBorderSliceNumber | MaskBorderSliceFill =>
      entry !== undefined,
  );
  return maskBorderSliceValue(first, ...trailing);
}

/* ---------- output: store -> navigable ResolvedMaskBorderSlice ---------- */

function build(store: Store): ResolvedMaskBorderSlice {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const maskBorderSliceManuscript: Manuscript<
  MaskBorderSliceInput,
  Store,
  ResolvedMaskBorderSlice,
  MaskBorderSliceConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookMaskBorderSlice: the mask-border-slice factory.
 * `publishBookMaskBorderSlice()` binds a mask-border-slice book; calling the book
 * with one to four non-negative `<number>` entries (with an optional trailing
 * `'fill'` keyword) renders a `ResolvedMaskBorderSlice`.
 */
export const publishBookMaskBorderSlice = publishBook(
  maskBorderSliceManuscript,
);
