import { isMeasurement } from '@css-bookends/css-calipers';

import type {
  AnchorSize,
  AnchorSizeKeyword,
  AnchorSizeOptions,
  Axis,
  Side,
  SpacingInput,
  SpacingKeyword,
  SpacingPolicy,
  SpacingValue,
} from './types';

/* ============================================================================
 * INPUT guts of the padding/margin books, factored into the spacing LEXICON.
 *
 * The lexicon's job is INPUT only: accept a permissive `SpacingInput` (scalar
 * shorthand or `{ x, y, top, right, bottom, left }`), VALIDATE its shape and each
 * value against the book's policy, and return it unchanged (shorthand intact).
 *
 * It does NOT spell the value out into the four sides - that resolution is the
 * book's STORAGE step (it differs slightly between padding and margin), so it lives
 * in the books, not here.
 *
 * Expandable: a `SpacingPolicy` lets a book forbid `auto`, negatives, and/or
 * `anchor-size()` (the padding/margin spec split). Each flag defaults to allowed;
 * `false` -> violation.
 * ==========================================================================*/

const SPACING_KEYWORDS = new Set<SpacingKeyword>([
  'auto',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
]);

const ANCHOR_SIZE_KEYWORDS = new Set<AnchorSizeKeyword>([
  'width',
  'height',
  'block',
  'inline',
  'self-block',
  'self-inline',
]);

const OBJECT_KEYS: ReadonlyArray<Axis | Side> = [
  'x',
  'y',
  'top',
  'right',
  'bottom',
  'left',
];

const isAnchorSize = (value: unknown): value is AnchorSize =>
  typeof value === 'object' &&
  value !== null &&
  (value as { kind?: unknown }).kind === 'anchorSize';

/**
 * Build a margin-only `anchor-size()` value, e.g.
 * `anchorSize({ anchor: '--btn', size: 'width', fallback: m(50) })`.
 */
export const anchorSize = (
  options: AnchorSizeOptions = {},
): AnchorSize => {
  if (
    options.anchor !== undefined &&
    !options.anchor.startsWith('--')
  ) {
    throw new Error(
      `spacing: anchor name must be a dashed-ident (got "${options.anchor}")`,
    );
  }
  if (
    options.size !== undefined &&
    !ANCHOR_SIZE_KEYWORDS.has(options.size)
  ) {
    throw new Error(
      `spacing: invalid anchor-size keyword "${String(options.size)}"`,
    );
  }
  return { kind: 'anchorSize', ...options };
};

/** A valid single spacing value: `0`, a known keyword, a measurement, or anchor-size(). */
const isSpacingValue = (value: unknown): value is SpacingValue =>
  value === 0 ||
  (typeof value === 'string' &&
    SPACING_KEYWORDS.has(value as SpacingKeyword)) ||
  isMeasurement(value) ||
  isAnchorSize(value);

/** Enforce the book's value-domain policy on one value. */
const checkValue = (
  key: string,
  value: SpacingValue,
  policy: SpacingPolicy,
): void => {
  if (value === 'auto' && policy.auto === false) {
    throw new Error(`spacing: "auto" is not allowed for "${key}"`);
  }
  if (
    isMeasurement(value) &&
    value.getValue() < 0 &&
    policy.negative === false
  ) {
    throw new Error(
      `spacing: a negative value is not allowed for "${key}"`,
    );
  }
  if (isAnchorSize(value) && policy.anchorSize === false) {
    throw new Error(
      `spacing: anchor-size() is not allowed for "${key}"`,
    );
  }
};

/**
 * Validate a `SpacingInput` against the book's value-domain `policy` (default: `auto`,
 * negatives, and anchor-size() all allowed) and return it unchanged. Spelling it out
 * into the four sides is the book's storage step, not this.
 */
export const parseSpacing = <
  K extends SpacingKeyword = SpacingKeyword,
  F extends AnchorSize = AnchorSize,
>(
  input: SpacingInput<K, F>,
  policy: SpacingPolicy = {},
): SpacingInput<K, F> => {
  const raw: SpacingInput = input;

  // scalar shorthand: a single value.
  if (isSpacingValue(raw)) {
    checkValue('value', raw, policy);
    return input;
  }

  // object form: validate every provided key against the value domain + policy.
  if (typeof raw === 'object' && raw !== null) {
    for (const key of OBJECT_KEYS) {
      const value = raw[key];
      if (value === undefined) continue;
      if (!isSpacingValue(value)) {
        throw new Error(`spacing: invalid value for "${key}"`);
      }
      checkValue(key, value, policy);
    }
    return input;
  }

  throw new Error(`spacing: unsupported input "${String(raw)}"`);
};
