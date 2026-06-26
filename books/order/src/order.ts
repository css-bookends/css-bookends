import {
  createCssValues,
  type CssValue,
} from '@css-bookends/css-value-core';
import {
  type Manuscript,
  publishBook,
} from '@css-bookends/self-publish';

import type { OrderConfig, OrderInput, ResolvedOrder } from './types';

/* The book's built-in defaults. A project overrides these via publishBookOrder({ config }). */
export const defaultConfig: OrderConfig = {
  value: 0,
  outOfRange: 'throw',
};

/* ---------- internal store (storage) ---------- */

/** The store is the validated calipers value, typed against `Property.Order`. */
type Store = CssValue<'Order'>;

/* ---------- input: raw -> store ---------- */

/**
 * Validate a raw ordinal into the canonical store. The validation (an unbounded
 * integer, negatives allowed, and the throw-or-clamp policy) is reused verbatim
 * from the calipers css-values factory: we bind one factory at the config's
 * `outOfRange` and call its `order` helper. `'unset'` / `undefined` fall back to
 * the configured default.
 */
function parse(raw: OrderInput | undefined, cfg: OrderConfig): Store {
  const values = createCssValues({ outOfRange: cfg.outOfRange });
  const ordinal =
    raw === undefined || raw === 'unset' ? cfg.value : raw;
  return values.order(ordinal);
}

/* ---------- output: store -> navigable ResolvedOrder ---------- */

function build(store: Store): ResolvedOrder {
  return {
    css: () => store.css(),
    value: () => store.value() as number,
  };
}

/* ---------- the manuscript + the factory ---------- */

const orderManuscript: Manuscript<
  OrderInput,
  Store,
  ResolvedOrder,
  OrderConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  output: (store) => build(store),
};

/**
 * publishBookOrder: the order factory. `publishBookOrder({ config })` binds
 * an order book (default value + out-of-range policy); calling the book renders
 * a `ResolvedOrder`. A bare book call renders the configured default ordinal.
 */
export const publishBookOrder = publishBook(orderManuscript);
