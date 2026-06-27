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

/**
 * The shape `.css()` returns by default.
 *
 * - `'object'` (the default): a property-keyed style object, e.g.
 *   `{ opacity: '0.5' }`, ready to spread into a style object.
 * - `'string'`: the bare value, e.g. `'0.5'`.
 *
 * Both forms are ALWAYS reachable on the result (`.style.css()` /
 * `.value.css()`); `format` only decides what the top-level `.css()` hands back.
 */
export type OutputFormat = 'object' | 'string';

/** The factory's configuration; both keys are the instance-wide defaults. */
export interface CssValuesConfig {
  outOfRange?: OutOfRange;
  format?: OutputFormat;
}

/** Per-call options; each overrides the instance default for that call. */
export interface CssValueOptions {
  outOfRange?: OutOfRange;
  format?: OutputFormat;
}

/** The `format: 'object'` shape for one property: its style key -> value. */
export type CssValueStyle<
  CssProperty extends CssPropertyKey,
  StyleKey extends string,
> = { [K in StyleKey]: PropertyValueMap[CssProperty] };

/**
 * The `.value` node: call it for the raw scalar (`number`) or keyword
 * (`string`); `.value.css()` renders the bare value, typed against the
 * property's csstype `Property`.
 */
export type CssValueNode<CssProperty extends CssPropertyKey> = (() =>
  | number
  | string) & { css: () => PropertyValueMap[CssProperty] };

/**
 * A single typed CSS value, navigable and carrying both output forms.
 *
 * - `.css()` -> the CONFIGURED default form (`format: 'object'` -> the style
 *   object, `'string'` -> the bare value). The single render terminal.
 * - `.value.css()` -> the bare value as a CSS string; `.value()` -> the raw
 *   `number` (scalar input) or `string` (keyword input).
 * - `.style.css()` -> the property-keyed style object.
 * - `.unit()` -> the unit (empty for these unitless scalar properties).
 */
export interface CssValue<
  CssProperty extends CssPropertyKey,
  StyleKey extends string,
> {
  css: () =>
    | PropertyValueMap[CssProperty]
    | CssValueStyle<CssProperty, StyleKey>;
  value: CssValueNode<CssProperty>;
  style: { css: () => CssValueStyle<CssProperty, StyleKey> };
  unit: () => string;
}

/**
 * A generated property helper: accepts the property's constrained number or one
 * of its keywords, and returns a typed {@link CssValue}.
 */
export type CssValueHelper<
  CssProperty extends CssPropertyKey,
  Keyword extends string,
  StyleKey extends string,
> = (
  value: number | Keyword,
  opts?: CssValueOptions,
) => CssValue<CssProperty, StyleKey>;

/**
 * The full helper map produced by {@link createCssValues}: one helper per spec
 * row, keyed by the row's `name`, each carrying that row's `.css()` return type,
 * keyword union, and style key (defaulting to the row name). Derived from the
 * spec tuple so the map stays in lockstep with the table.
 */
export type CssValues = {
  readonly [Row in CssValueSpecEntry as Row['name']]: Row extends SpecRow<
    string,
    infer CssProperty,
    infer Keyword,
    infer StyleKey
  >
    ? CssValueHelper<CssProperty, Keyword, StyleKey>
    : never;
};

type CssValueSpecEntry = (typeof CSS_VALUE_SPEC)[number];

const clampNumber = (
  value: number,
  min: number,
  max: number,
): number => Math.min(max, Math.max(min, value));

/**
 * Assemble the navigable {@link CssValue} from a rendered string + raw value.
 * `.css()` returns the configured default form; `.value` is callable (raw) and
 * carries `.value.css()`; `.style.css()` is the property-keyed object.
 */
const makeValue = <
  CssProperty extends CssPropertyKey,
  StyleKey extends string,
>(
  styleKey: string,
  rendered: PropertyValueMap[CssProperty],
  raw: number | string,
  format: OutputFormat,
): CssValue<CssProperty, StyleKey> => {
  const styleObject = (): CssValueStyle<CssProperty, StyleKey> =>
    ({ [styleKey]: rendered }) as CssValueStyle<
      CssProperty,
      StyleKey
    >;
  const value = Object.assign(() => raw, {
    css: () => rendered,
  }) as CssValueNode<CssProperty>;
  return {
    css: () => (format === 'object' ? styleObject() : rendered),
    value,
    style: { css: styleObject },
    unit: () => '',
  };
};

/**
 * Build the value object for a number input, constraining it with the row's
 * primitive (`i()` for `int`, `f()` for `float`). Under `'clamp'`, the number is
 * first pulled to whichever bound(s) the row has (one-directional, open sides
 * left alone); otherwise the primitive throws on an out-of-range value. Either
 * way a non-integer on an `int` row still throws: clamp covers range, not
 * integer-ness.
 */
const buildNumber = <
  CssProperty extends CssPropertyKey,
  StyleKey extends string,
>(
  row: SpecRow,
  value: number,
  policy: OutOfRange,
  format: OutputFormat,
): CssValue<CssProperty, StyleKey> => {
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
  // `(string & {})`, so the scalar's `string` render is directly assignable.
  const styleKey = row.styleKey ?? row.name;
  return makeValue<CssProperty, StyleKey>(
    styleKey,
    scalar.css(),
    scalar.value(),
    format,
  );
};

/** Build the value object for a keyword input (passed through untouched). */
const buildKeyword = <
  CssProperty extends CssPropertyKey,
  StyleKey extends string,
>(
  row: SpecRow,
  keyword: string,
  format: OutputFormat,
): CssValue<CssProperty, StyleKey> => {
  const styleKey = row.styleKey ?? row.name;
  return makeValue<CssProperty, StyleKey>(
    styleKey,
    keyword,
    keyword,
    format,
  );
};

/**
 * Generate a single property helper from a spec row. Number inputs are
 * constrained via the row's scalar primitive; keyword inputs (members of the
 * row's `keywords`) pass through.
 */
const makeHelper = (
  spec: SpecRow,
  defaultPolicy: OutOfRange,
  defaultFormat: OutputFormat,
): CssValueHelper<CssPropertyKey, string, string> => {
  const keywords = new Set<string>(spec.keywords);
  return (value, opts) => {
    const format = opts?.format ?? defaultFormat;
    if (typeof value === 'string') {
      if (!keywords.has(value)) {
        throw new Error(
          `${spec.name}: '${value}' is not a valid keyword` +
            ` (expected one of: ${spec.keywords.join(', ') || 'none'})`,
        );
      }
      return buildKeyword(spec, value, format);
    }
    const policy = opts?.outOfRange ?? defaultPolicy;
    return buildNumber(spec, value, policy, format);
  };
};

/**
 * Create a set of per-property CSS-value helpers, layered on the scalar
 * primitives `i()` / `f()`. Each helper constrains its number against the
 * property's bound and accepts that property's keyword companions, returning a
 * navigable, `.css()`-renderable {@link CssValue} typed against csstype.
 *
 * `config.outOfRange` is the instance-wide default for out-of-range numbers
 * (`'throw'`, the default, or `'clamp'`). `config.format` is the instance-wide
 * default output shape (`'object'`, the default, or `'string'`). A per-call
 * `opts` overrides either. The package's bare `opacity` / `zIndex` / ... exports
 * are this factory at its defaults.
 */
export const createCssValues = (
  config: CssValuesConfig = {},
): CssValues => {
  const defaultPolicy: OutOfRange = config.outOfRange ?? 'throw';
  const defaultFormat: OutputFormat = config.format ?? 'object';
  const helpers = {} as Record<
    string,
    CssValueHelper<CssPropertyKey, string, string>
  >;
  for (const spec of CSS_VALUE_SPEC) {
    helpers[spec.name] = makeHelper(
      spec,
      defaultPolicy,
      defaultFormat,
    );
  }
  return helpers as unknown as CssValues;
};
