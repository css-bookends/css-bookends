import {
  borderImageOutset as borderImageOutsetValue,
  type MultiCssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  BorderImageOutsetConfig,
  BorderImageOutsetEntry,
  BorderImageOutsetInput,
  ResolvedBorderImageOutset,
} from './types';

/* The book carries no tunable config: it is always called with an explicit input. */
export const defaultConfig: BorderImageOutsetConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated multi-part value, typed against `Property.BorderImageOutset`. */
type Store = MultiCssValue<'BorderImageOutset'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw border-image-outset tuple into the canonical store. The
 * validation (each entry a non-negative `<number>` hardened through
 * `f({ min: 0 })` or an `IMeasurement` length) is reused verbatim from the
 * css-value-core `borderImageOutset` helper. The tuple's optional trailing
 * elements are dropped before spreading into the variadic engine call, so only
 * the supplied one to four entries are forwarded.
 */
function parse(raw: BorderImageOutsetInput | undefined): Store {
  if (raw === undefined) {
    throw new Error(
      'borderImageOutset: a border-image-outset input is required ' +
        '(one to four edge entries)',
    );
  }
  const [
    first,
    ...rest
  ] = raw;
  const tail = rest.filter(
    (entry): entry is BorderImageOutsetEntry => entry !== undefined,
  );
  return borderImageOutsetValue(first, ...tail);
}

/* ---------- output: store -> navigable ResolvedBorderImageOutset ---------- */

function build(store: Store): ResolvedBorderImageOutset {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const borderImageOutsetManuscript: Manuscript<
  BorderImageOutsetInput,
  Store,
  ResolvedBorderImageOutset,
  BorderImageOutsetConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookBorderImageOutset: the border-image-outset factory.
 * `publishBookBorderImageOutset()` binds a border-image-outset book; calling the
 * book with one to four edge entries renders a `ResolvedBorderImageOutset`.
 */
export const publishBookBorderImageOutset = publishBook(
  borderImageOutsetManuscript,
);
