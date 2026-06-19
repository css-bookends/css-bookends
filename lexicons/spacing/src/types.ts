import type { IMeasurement } from '@css-bookends/css-calipers';

/**
 * The spacing LEXICON's shared contract. spacing is shared guts (never used alone); the
 * padding and margin BOOKS compose it: `parseSpacing` (validate, with each book's policy)
 * for INPUT, then `resolveSpacing` (spell the shorthand out into the canonical four-side
 * `SpacingStore`) for STORAGE.
 *
 * Value types are generic over the measurement type `M` (padding narrows it to
 * `NonNegativeMeasurement`), the allowed keyword set `K`, and any extra value kinds `F`
 * (e.g. `anchor-size()`, margin-only), so each book narrows the lexicon to its spec at the
 * type level (the runtime `SpacingPolicy` mirrors the value-domain split).
 */

/** CSS-wide keywords, valid on any property (and on both padding + margin). */
export type CssWideKeyword =
  | 'inherit'
  | 'initial'
  | 'unset'
  | 'revert'
  | 'revert-layer';

/** Full keyword set: the CSS-wide keywords plus `auto` (margin only, not padding). */
export type SpacingKeyword = CssWideKeyword | 'auto';

/** The axis keyword of `anchor-size()`. */
export type AnchorSizeKeyword =
  | 'width'
  | 'height'
  | 'block'
  | 'inline'
  | 'self-block'
  | 'self-inline';

/**
 * A modeled `anchor-size()` value (CSS Anchor Positioning). Valid on margin (and
 * inset/sizing) but NOT padding. Grammar:
 *   anchor-size( [ <dashed-ident> || <anchor-size> ]? , <length-percentage>? )
 */
export interface AnchorSize {
  readonly kind: 'anchorSize';
  /** the anchor's `<dashed-ident>` name (e.g. `--my-anchor`); omitted = default anchor. */
  readonly anchor?: string;
  /** which size to read; omitted = the property's own axis. */
  readonly size?: AnchorSizeKeyword;
  /** fallback used when not anchor-positioned / the anchor is absent. */
  readonly fallback?: IMeasurement;
}

/** Options for the `anchorSize()` builder. */
export type AnchorSizeOptions = Omit<AnchorSize, 'kind'>;

/**
 * A single spacing value.
 * - `M` = the measurement type (padding narrows it to `NonNegativeMeasurement`).
 * - `K` = the allowed keyword set (padding drops `auto`).
 * - `F` = extra value kinds (margin adds `AnchorSize`; padding sets `never`).
 */
export type SpacingValue<
  M extends IMeasurement = IMeasurement,
  K extends SpacingKeyword = SpacingKeyword,
  F extends AnchorSize = AnchorSize,
> = M | K | 0 | F;

/** The physical sides. */
export type Side = 'top' | 'right' | 'bottom' | 'left';

/** The axes: `x` = left + right, `y` = top + bottom. */
export type Axis = 'x' | 'y';

/**
 * Object form: per-axis (`x`/`y`) and/or per-side values. An explicit side overrides
 * its axis. No `all` key - a bare scalar is the all-sides shorthand.
 */
export type SpacingObject<
  M extends IMeasurement = IMeasurement,
  K extends SpacingKeyword = SpacingKeyword,
  F extends AnchorSize = AnchorSize,
> = Partial<Record<Axis | Side, SpacingValue<M, K, F>>>;

/**
 * What the lexicon accepts: a scalar (shorthand) or the object form. `parseSpacing` returns
 * it unchanged (validated, shorthand intact); `resolveSpacing` spells it out into the
 * canonical four-side `SpacingStore`.
 */
export type SpacingInput<
  M extends IMeasurement = IMeasurement,
  K extends SpacingKeyword = SpacingKeyword,
  F extends AnchorSize = AnchorSize,
> = SpacingValue<M, K, F> | SpacingObject<M, K, F>;

/**
 * The canonical store: the input spelled out per physical side. **Partial** - only the
 * sides the input specified are present (a scalar fills all four; `{ x }` fills left +
 * right only), so a book can emit just those sides (longhands) and let a hand-written
 * `calc()`/`var()` side sit next to them. Produced by `resolveSpacing`.
 */
export type SpacingStore<
  M extends IMeasurement = IMeasurement,
  K extends SpacingKeyword = SpacingKeyword,
  F extends AnchorSize = AnchorSize,
> = Partial<Record<Side, SpacingValue<M, K, F>>>;

/**
 * The value-domain policy a consuming book applies (the padding/margin spec split).
 * Each flag defaults to allowed; a book sets `false` to forbid (-> violation).
 */
export interface SpacingPolicy {
  /** allow the `auto` keyword (margin: true; padding: false). */
  auto?: boolean;
  /** allow negative measurements (margin: true; padding: false). */
  negative?: boolean;
  /** allow `anchor-size()` (margin: true; padding: false). */
  anchorSize?: boolean;
}
