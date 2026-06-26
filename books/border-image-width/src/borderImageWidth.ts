import {
  borderImageWidth as borderImageWidthValue,
  type MultiCssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  BorderImageWidthConfig,
  BorderImageWidthEntry,
  BorderImageWidthInput,
  ResolvedBorderImageWidth,
} from './types';

/* The book carries no tunable config: it is always called with an explicit input. */
export const defaultConfig: BorderImageWidthConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated multi-part value, typed against `Property.BorderImageWidth`. */
type Store = MultiCssValue<'BorderImageWidth'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw border-image-width tuple into the canonical store. The
 * validation (each entry a non-negative `<number>` hardened through
 * `f({ min: 0 })`, an `IMeasurement` length, or the keyword `'auto'`) is reused
 * verbatim from the css-value-core `borderImageWidth` helper. The tuple's
 * optional trailing elements are dropped before spreading into the variadic
 * engine call, so only the supplied one to four entries are forwarded.
 */
function parse(raw: BorderImageWidthInput | undefined): Store {
  if (raw === undefined) {
    throw new Error(
      'borderImageWidth: a border-image-width input is required ' +
        '(one to four edge entries)',
    );
  }
  const [
    first,
    ...rest
  ] = raw;
  const tail = rest.filter(
    (entry): entry is BorderImageWidthEntry => entry !== undefined,
  );
  return borderImageWidthValue(first, ...tail);
}

/* ---------- output: store -> navigable ResolvedBorderImageWidth ---------- */

function build(store: Store): ResolvedBorderImageWidth {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const borderImageWidthManuscript: Manuscript<
  BorderImageWidthInput,
  Store,
  ResolvedBorderImageWidth,
  BorderImageWidthConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookBorderImageWidth: the border-image-width factory.
 * `publishBookBorderImageWidth()` binds a border-image-width book; calling the
 * book with one to four edge entries renders a `ResolvedBorderImageWidth`.
 */
export const publishBookBorderImageWidth = publishBook(
  borderImageWidthManuscript,
);
