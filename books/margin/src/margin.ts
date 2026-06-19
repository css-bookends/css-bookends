import {
  anchorSize,
  parseSpacing,
  resolveSpacing,
} from '@css-bookends/spacing';

import type { MarginInput, MarginStore } from './types';

/**
 * INPUT step of the margin BOOK. Margin's value domain is the spacing lexicon's permissive
 * default (auto + negatives + anchor-size all allowed), so this validates via the lexicon's
 * `parseSpacing` with the default policy and returns the input unchanged.
 */
export const parseMargin = (input: MarginInput): MarginInput =>
  parseSpacing(input);

/**
 * STORAGE step of the margin BOOK. Spells the (validated) input out into the canonical
 * four-side `MarginStore` via the shared lexicon `resolveSpacing` (scalar -> all sides;
 * `x`/`y` -> their axis; explicit side overrides axis; unset sides omitted). Assumes the
 * input was validated by `parseMargin` (parse-don't-validate).
 */
export const storeMargin = (input: MarginInput): MarginStore =>
  resolveSpacing(input);

// Re-export the margin-only value builder so margin users have a single import.
export { anchorSize };
