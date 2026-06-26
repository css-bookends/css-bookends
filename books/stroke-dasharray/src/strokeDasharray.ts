import {
  type MultiCssValue,
  strokeDasharray as strokeDasharrayValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type {
  ResolvedStrokeDasharray,
  StrokeDasharrayConfig,
  StrokeDasharrayInput,
} from './types';

/* The book carries no tunable config: it is always called with an explicit input. */
export const defaultConfig: StrokeDasharrayConfig = {};

/* ---------- internal store (storage) ---------- */

/** The store is the validated multi-part value, typed against `Property.StrokeDasharray`. */
type Store = MultiCssValue<'StrokeDasharray'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw stroke-dasharray into the canonical store. The validation (the
 * keyword `'none'`, or each list entry a non-negative `<number>` hardened
 * through `f({ min: 0 })` or an `IMeasurement` length) is reused verbatim from
 * the css-value-core `strokeDasharray` helper. The keyword forwards as the
 * standalone `'none'` overload; the non-empty tuple spreads into the variadic
 * `(first, ...rest)` overload.
 */
function parse(raw: StrokeDasharrayInput | undefined): Store {
  if (raw === undefined) {
    throw new Error(
      "strokeDasharray: an input is required ('none' or a list of entries)",
    );
  }
  if (raw === 'none') {
    return strokeDasharrayValue('none');
  }
  const [
    first,
    ...rest
  ] = raw;
  return strokeDasharrayValue(first, ...rest);
}

/* ---------- output: store -> navigable ResolvedStrokeDasharray ---------- */

function build(store: Store): ResolvedStrokeDasharray {
  return {
    css: () => store.css(),
    value: () => store.value(),
  };
}

/* ---------- the manuscript + the factory ---------- */

const strokeDasharrayManuscript: Manuscript<
  StrokeDasharrayInput,
  Store,
  ResolvedStrokeDasharray,
  StrokeDasharrayConfig
> = {
  defaults: defaultConfig,
  input: (raw) => parse(raw),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookStrokeDasharray: the stroke-dasharray factory.
 * `publishBookStrokeDasharray()` binds a stroke-dasharray book; calling the book
 * with `'none'` or a non-empty list of number / length entries renders a
 * `ResolvedStrokeDasharray`.
 */
export const publishBookStrokeDasharray = publishBook(
  strokeDasharrayManuscript,
);
