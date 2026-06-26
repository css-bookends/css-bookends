import {
  borderImageSlice as borderImageSliceValue,
  type MultiCssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  BorderImageSliceConfig,
  BorderImageSliceInput,
  ResolvedBorderImageSlice,
} from './types';

/* The book carries no tunable config: it is always called with an explicit input. */
export const defaultConfig: BorderImageSliceConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated multi-part value, typed against `Property.BorderImageSlice`. */
type Store = MultiCssValue<'BorderImageSlice'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw border-image-slice tuple into the canonical store. The
 * validation (one to four non-negative `<number>` entries hardened through
 * `f({ min: 0 })`, with an optional trailing `'fill'`; `'fill'` only valid as
 * the trailing entry) is reused verbatim from the css-value-core
 * `borderImageSlice` helper. The tuple's optional trailing elements are dropped
 * before spreading into the variadic engine call, so only the supplied entries
 * are forwarded.
 */
function parse(raw: BorderImageSliceInput | undefined): Store {
  if (raw === undefined) {
    throw new Error(
      'borderImageSlice: a border-image-slice input is required ' +
        '(one to four numbers plus an optional trailing fill)',
    );
  }
  const [
    first,
    ...rest
  ] = raw;
  const tail = rest.filter(
    (entry): entry is number | 'fill' => entry !== undefined,
  );
  return borderImageSliceValue(first, ...tail);
}

/* ---------- output: store -> navigable ResolvedBorderImageSlice ---------- */

function build(store: Store): ResolvedBorderImageSlice {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const borderImageSliceManuscript: Manuscript<
  BorderImageSliceInput,
  Store,
  ResolvedBorderImageSlice,
  BorderImageSliceConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookBorderImageSlice: the border-image-slice factory.
 * `publishBookBorderImageSlice()` binds a border-image-slice book; calling the
 * book with one to four numbers plus an optional trailing `'fill'` renders a
 * `ResolvedBorderImageSlice`.
 */
export const publishBookBorderImageSlice = publishBook(
  borderImageSliceManuscript,
);
