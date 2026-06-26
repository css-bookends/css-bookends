import { f, i } from '@css-bookends/css-calipers';

import {
  type CssPropertyKey,
  type PropertyValueMap,
} from './propertyMap';
import { CSS_VALUE_SPEC, type SpecRow } from './spec';

/**
 * How an out-of-range (or non-integer) number is handled.
 *
 * - `'throw'`: defer to the scalar primitive, which throws on a value outside
 *   the bound (or a non-integer for an `int` row). This is the default.
 * - `'clamp'`: clamp the number to whichever bound(s) the row has, then build
 *   the primitive. One-directional: a value below `min` is pulled up to `min`,
 *   a value above `max` is pulled down to `max`, and an open side (no bound) is
 *   left alone. Clamp fixes RANGE only, not integer-ness, so an in-range
 *   non-integer on an `int` row still throws (clamping it makes no sense).
 */
export type OutOfRange = 'throw' | 'clamp';

/** The factory's configuration. `outOfRange` is the instance-wide default. */
export interface CssValuesConfig {
  outOfRange?: OutOfRange;
}

/** Per-call options; `outOfRange` overrides the instance default for that call. */
export interface CssValueOptions {
  outOfRange?: OutOfRange;
}

/**
 * A single typed CSS value. Build it through a property helper (`opacity(0.5)`),
 * then render with `.css()` (typed against that property's csstype `Property`
 * key). `.value()` returns the raw `number` (scalar input) or `string`
 * (keyword input); `.toString()` mirrors `.css()`.
 */
export interface CssValue<CssProperty extends CssPropertyKey> {
  css: () => PropertyValueMap[CssProperty];
  toString: () => string;
  value: () => number | string;
}

/**
 * A generated property helper: accepts the property's constrained number or one
 * of its keywords, and returns a typed {@link CssValue}.
 */
export type CssValueHelper<
  CssProperty extends CssPropertyKey,
  Keyword extends string,
> = (
  value: number | Keyword,
  opts?: CssValueOptions,
) => CssValue<CssProperty>;

/**
 * The full helper map produced by {@link createCssValues}: one helper per spec
 * row, keyed by the row's `name`, each carrying that row's `.css()` return type
 * and keyword union. Derived from the spec tuple so the map stays in lockstep
 * with the table.
 */
export type CssValues = {
  readonly [Row in CssValueSpecEntry as Row['name']]: Row extends SpecRow<
    string,
    infer CssProperty,
    infer Keyword
  >
    ? CssValueHelper<CssProperty, Keyword>
    : never;
};

type CssValueSpecEntry = (typeof CSS_VALUE_SPEC)[number];

const clampNumber = (
  value: number,
  min: number,
  max: number,
): number => Math.min(max, Math.max(min, value));

/**
 * Build the value object for a number input, constraining it with the row's
 * primitive (`i()` for `int`, `f()` for `float`). Under `'clamp'`, the number is
 * first pulled to whichever bound(s) the row has (one-directional, open sides
 * left alone); otherwise the primitive throws on an out-of-range value. Either
 * way a non-integer on an `int` row still throws: clamp covers range, not
 * integer-ness.
 */
const buildNumber = <CssProperty extends CssPropertyKey>(
  row: SpecRow,
  value: number,
  policy: OutOfRange,
): CssValue<CssProperty> => {
  let next = value;
  if (policy === 'clamp') {
    // clamp one-directional: pull to whichever bound exists. An open side (no
    // bound) is left alone, since there is nothing to clamp against there.
    const lo = row.min ?? Number.NEGATIVE_INFINITY;
    const hi = row.max ?? Number.POSITIVE_INFINITY;
    next = clampNumber(value, lo, hi);
  }

  const bounds = { min: row.min, max: row.max, context: row.name };
  const scalar =
    row.kind === 'int' ? i(next, bounds) : f(next, bounds);

  // Every `PropertyValueMap[CssProperty]` value type widens to include
  // `(string & {})`, so the scalar's `string` render is directly assignable; no
  // cast is needed (and one would be flagged as redundant).
  return {
    css: () => scalar.css(),
    toString: () => scalar.css(),
    value: () => scalar.value(),
  };
};

/** Build the value object for a keyword input (passed through untouched). */
const buildKeyword = <CssProperty extends CssPropertyKey>(
  keyword: string,
): CssValue<CssProperty> => ({
  css: () => keyword,
  toString: () => keyword,
  value: () => keyword,
});

/**
 * Generate a single property helper from a spec row. Number inputs are
 * constrained via the row's scalar primitive; keyword inputs (members of the
 * row's `keywords`) pass through.
 */
const makeHelper = (
  spec: SpecRow,
  defaultPolicy: OutOfRange,
): CssValueHelper<CssPropertyKey, string> => {
  const keywords = new Set<string>(spec.keywords);
  return (value, opts) => {
    if (typeof value === 'string') {
      if (!keywords.has(value)) {
        throw new Error(
          `${spec.name}: '${value}' is not a valid keyword` +
            ` (expected one of: ${spec.keywords.join(', ') || 'none'})`,
        );
      }
      return buildKeyword(value);
    }
    const policy = opts?.outOfRange ?? defaultPolicy;
    return buildNumber(spec, value, policy);
  };
};

/**
 * Create a set of per-property CSS-value helpers, layered on the scalar
 * primitives `i()` / `f()`. Each helper constrains its number against the
 * property's bound and accepts that property's keyword companions, returning a
 * `.css()`-renderable {@link CssValue} typed against csstype.
 *
 * `config.outOfRange` is the instance-wide default for out-of-range numbers
 * (`'throw'`, the default, or `'clamp'`); a per-call `opts.outOfRange` overrides
 * it. The package's bare `opacity` / `zIndex` / ... exports are this factory at
 * its defaults.
 */
export const createCssValues = (
  config: CssValuesConfig = {},
): CssValues => {
  const defaultPolicy: OutOfRange = config.outOfRange ?? 'throw';
  const helpers = {} as Record<
    string,
    CssValueHelper<CssPropertyKey, string>
  >;
  for (const spec of CSS_VALUE_SPEC) {
    helpers[spec.name] = makeHelper(spec, defaultPolicy);
  }
  return helpers as unknown as CssValues;
};
