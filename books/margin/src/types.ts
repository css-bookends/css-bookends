import type { IMeasurement } from '@css-bookends/css-calipers';
import type {
  AnchorSize,
  Axis,
  Side,
  SpacingInput,
  SpacingKeyword,
  SpacingStore,
} from '@css-bookends/spacing';

/**
 * The margin BOOK's input contract. Margin's value domain is exactly the spacing lexicon's
 * permissive default: any-unit measurements, the CSS-wide keywords plus `auto`, negative
 * values, and `anchor-size()`. See `margin-space.md` for the full CSS surface and the
 * lexicon's `spacing-spec.md` for the shared contract.
 */
export type MarginInput = SpacingInput<
  IMeasurement,
  SpacingKeyword,
  AnchorSize
>;

/**
 * The margin BOOK's canonical store: `MarginInput` spelled out per physical side (partial -
 * only the sides the input specified). Produced by `storeMargin`.
 */
export type MarginStore = SpacingStore<
  IMeasurement,
  SpacingKeyword,
  AnchorSize
>;

// Re-export the spacing value types margin consumers annotate with.
export type { AnchorSize, Axis, Side, SpacingKeyword };
