import {
  f,
  i,
  type IMeasurement,
  isMeasurement,
} from '@css-bookends/css-calipers';
import type { Property } from 'csstype';

/**
 * The MULTI-PART CSS-VALUE HELPER LAYER.
 *
 * The single-value layer in `./cssValues.ts` is table-driven: one constrained
 * scalar plus a keyword union per property, rendered through `i()` / `f()`. The
 * properties here do not fit that one-scalar-one-keyword shape. Each accepts a
 * *composite* value: a list of `<custom-ident> <integer>` pairs (the counter
 * trio), a tri-state grid-line position (integer line, `span N`, named line, or
 * `auto`), one-to-three scale factors, or a number-or-length `tab-size`.
 *
 * They share the single layer's contracts: numeric pieces go through `i()` /
 * `f()` (so out-of-range and non-integer inputs throw at build time), keywords
 * pass through untouched, and `.css()` is typed against the property's csstype
 * `Property.X` value type via {@link MultiPropertyValueMap}.
 *
 * Every value object exposes the same trio as the single layer's `CssValue`:
 * `.css()` (typed render), `.toString()` (mirrors `.css()`), and `.value()`
 * (the raw `string` render). Builders validate eagerly and throw on bad input.
 */

/**
 * An indexable bridge over csstype's `Property` namespace for the multi-part
 * properties, mirroring `./propertyMap.ts`'s {@link PropertyValueMap}. A helper's
 * PascalCase key (e.g. `'CounterReset'`) indexes this to recover
 * `Property.CounterReset`, so each `.css()` is typed against the right csstype
 * value type. Add a helper here -> add its `Property` key.
 */
export interface MultiPropertyValueMap {
  CounterReset: Property.CounterReset;
  CounterIncrement: Property.CounterIncrement;
  CounterSet: Property.CounterSet;
  GridRowStart: Property.GridRowStart;
  GridRowEnd: Property.GridRowEnd;
  GridColumnStart: Property.GridColumnStart;
  GridColumnEnd: Property.GridColumnEnd;
  Scale: Property.Scale;
  TabSize: Property.TabSize;
  BorderImageWidth: Property.BorderImageWidth;
  BorderImageOutset: Property.BorderImageOutset;
  BorderImageSlice: Property.BorderImageSlice;
  MaskBorderWidth: Property.MaskBorderWidth;
  MaskBorderOutset: Property.MaskBorderOutset;
  MaskBorderSlice: Property.MaskBorderSlice;
  StrokeWidth: Property.StrokeWidth;
  StrokeDashoffset: Property.StrokeDashoffset;
  StrokeDasharray: Property.StrokeDasharray;
}

/** The set of csstype `Property` keys the multi-part layer covers. */
export type MultiPropertyKey = keyof MultiPropertyValueMap;

/**
 * A single typed multi-part CSS value. Built through a property helper
 * (`scale(1, 2)`, `counterReset(['page', 1])`), rendered with `.css()` (typed
 * against the property's csstype `Property` key). `.value()` returns the raw
 * rendered `string`; `.toString()` mirrors `.css()`.
 */
export interface MultiCssValue<CssProperty extends MultiPropertyKey> {
  css: () => MultiPropertyValueMap[CssProperty];
  toString: () => string;
  value: () => string;
}

/**
 * Wrap a finished render string as a typed value object. Every
 * `MultiPropertyValueMap[CssProperty]` widens to include `(string & {})`, so the
 * rendered `string` is directly assignable; no cast is needed.
 */
const wrap = <CssProperty extends MultiPropertyKey>(
  rendered: string,
): MultiCssValue<CssProperty> => ({
  css: () => rendered,
  toString: () => rendered,
  value: () => rendered,
});

// --- Counters -------------------------------------------------------------

/**
 * One `<custom-ident> <integer>?` entry of a counter property. A bare string is
 * the ident with the property's default integer; a `[ident, integer]` tuple
 * supplies the integer explicitly. The integer is hardened with `i()`.
 */
export type CounterEntry =
  | string
  | readonly [
      name: string,
      value: number,
    ];

const CUSTOM_IDENT = /^-?[_a-zA-Z][\w-]*$/;

const assertCustomIdent = (name: string, helper: string): void => {
  if (!CUSTOM_IDENT.test(name)) {
    throw new Error(
      `${helper}: '${name}' is not a valid <custom-ident> ` +
        `(letters, digits, '-', '_'; must not start with a digit)`,
    );
  }
};

/**
 * Build a counter helper. Accepts the keyword `'none'`, or one or more
 * `<custom-ident> <integer>?` entries. A bare ident uses `defaultValue`; a
 * `[ident, n]` tuple hardens `n` through `i()` (any integer, negatives allowed).
 */
const makeCounterHelper =
  <CssProperty extends MultiPropertyKey>(
    helper: string,
    defaultValue: number,
  ) =>
  (
    // `'none'` is accepted as the standalone keyword; at the type level it is a
    // `string`, indistinct from a `<custom-ident>`, so the union is just
    // `CounterEntry`. The keyword is recognized (and guarded against being
    // combined with entries) at runtime below.
    first: CounterEntry,
    ...rest: readonly CounterEntry[]
  ): MultiCssValue<CssProperty> => {
    if (first === 'none') {
      if (rest.length > 0) {
        throw new Error(
          `${helper}: 'none' cannot be combined with counter entries`,
        );
      }
      return wrap('none');
    }
    const entries = [
      first,
      ...rest,
    ];
    const parts = entries.map((entry) => {
      const [
        name,
        value,
      ] =
        typeof entry === 'string'
          ? [
              entry,
              defaultValue,
            ]
          : entry;
      assertCustomIdent(name, helper);
      const n = i(value, { context: helper }).css();
      return `${name} ${n}`;
    });
    return wrap(parts.join(' '));
  };

/**
 * `counter-reset`: `<custom-ident> <integer>?` pairs (omitted integer defaults
 * to `0`) or `none`. `.css()` is `Property.CounterReset`.
 */
export const counterReset = makeCounterHelper<'CounterReset'>(
  'counterReset',
  0,
);

/**
 * `counter-increment`: `<custom-ident> <integer>?` pairs (omitted integer
 * defaults to `1`) or `none`. `.css()` is `Property.CounterIncrement`.
 */
export const counterIncrement = makeCounterHelper<'CounterIncrement'>(
  'counterIncrement',
  1,
);

/**
 * `counter-set`: `<custom-ident> <integer>?` pairs (omitted integer defaults to
 * `0`) or `none`. `.css()` is `Property.CounterSet`.
 */
export const counterSet = makeCounterHelper<'CounterSet'>(
  'counterSet',
  0,
);

// --- Grid lines -----------------------------------------------------------

/**
 * A grid-line position: a nonzero `<integer>` line number (negatives count from
 * the end edge), `'auto'`, a `<custom-ident>` named line (a string that is not
 * `'auto'` / `'span'`), or a `span N` count (`>= 1`) via {@link span}.
 */
export type GridLineInput = number | string | SpanInput;

/** A `span <integer>` grid-line value, built by {@link span}. */
export interface SpanInput {
  readonly span: number;
  readonly name?: string;
}

/**
 * Build a `span N` (optionally `span N name`) grid-line value. `count` is
 * hardened to an integer `>= 1`. Pass the result to a grid-line helper:
 * `gridColumnEnd(span(2))`.
 */
export const span = (count: number, name?: string): SpanInput => ({
  span: count,
  name,
});

const makeGridLineHelper =
  <CssProperty extends MultiPropertyKey>(helper: string) =>
  (line: GridLineInput): MultiCssValue<CssProperty> => {
    if (typeof line === 'number') {
      if (line === 0) {
        throw new Error(
          `${helper}: a grid line number must be nonzero (got 0)`,
        );
      }
      return wrap(i(line, { context: helper }).css());
    }
    if (typeof line === 'string') {
      if (line === 'span') {
        throw new Error(
          `${helper}: use span(n) to build a 'span' value`,
        );
      }
      if (line !== 'auto') {
        assertCustomIdent(line, helper);
      }
      return wrap(line);
    }
    // SpanInput
    const count = i(line.span, {
      min: 1,
      context: `${helper} span`,
    }).css();
    if (line.name !== undefined) {
      assertCustomIdent(line.name, helper);
      return wrap(`span ${count} ${line.name}`);
    }
    return wrap(`span ${count}`);
  };

/** `grid-row-start`. `.css()` is `Property.GridRowStart`. */
export const gridRowStart =
  makeGridLineHelper<'GridRowStart'>('gridRowStart');
/** `grid-row-end`. `.css()` is `Property.GridRowEnd`. */
export const gridRowEnd =
  makeGridLineHelper<'GridRowEnd'>('gridRowEnd');
/** `grid-column-start`. `.css()` is `Property.GridColumnStart`. */
export const gridColumnStart =
  makeGridLineHelper<'GridColumnStart'>('gridColumnStart');
/** `grid-column-end`. `.css()` is `Property.GridColumnEnd`. */
export const gridColumnEnd =
  makeGridLineHelper<'GridColumnEnd'>('gridColumnEnd');

// --- scale ----------------------------------------------------------------

/**
 * `scale`: one to three number factors (negatives allowed; the percentage form
 * is out of scope), or the keyword `'none'`. Each factor is hardened through
 * `f()`. `.css()` is `Property.Scale`.
 */
export function scale(keyword: 'none'): MultiCssValue<'Scale'>;
export function scale(
  x: number,
  y?: number,
  z?: number,
): MultiCssValue<'Scale'>;
export function scale(
  first: number | 'none',
  y?: number,
  z?: number,
): MultiCssValue<'Scale'> {
  if (first === 'none') {
    return wrap('none');
  }
  const factors = [
    first,
    y,
    z,
  ].filter((n): n is number => n !== undefined);
  const rendered = factors
    .map((n) => f(n, { context: 'scale' }).css())
    .join(' ');
  return wrap(rendered);
}

// --- tab-size -------------------------------------------------------------

/**
 * `tab-size`: a `<number>` `>= 0` (NOT restricted to an integer; `2.5` is
 * valid) hardened through `f()`, or a length supplied as an `IMeasurement`. The
 * percentage form is out of scope. `.css()` is `Property.TabSize`.
 */
export const tabSize = (
  value: number | IMeasurement,
): MultiCssValue<'TabSize'> => {
  if (typeof value === 'number') {
    return wrap(f(value, { min: 0, context: 'tabSize' }).css());
  }
  return wrap(value.css());
};

// --- number-or-length tiers -----------------------------------------------

/**
 * One entry of a number-or-length property: a unitless `<number>` (a
 * css-calipers float input, hardened through `f()`) or a length supplied as an
 * `IMeasurement` (rendered via its `.css()`). The percentage form is out of
 * scope, so a percentage must be passed as an `IMeasurement` carrying a `%`
 * unit, never as a bare number.
 */
export type NumberOrLength = number | IMeasurement;

/**
 * Render one number-or-length entry. A number is hardened through `f()` with the
 * given bounds (so out-of-range / non-finite inputs throw); an `IMeasurement`
 * renders through its `.css()`. Anything else throws with the helper name.
 */
const renderNumberOrLength = (
  entry: unknown,
  helper: string,
  min?: number,
): string => {
  if (typeof entry === 'number') {
    return f(entry, { min, context: helper }).css();
  }
  if (isMeasurement(entry)) {
    return entry.css();
  }
  throw new Error(
    `${helper}: expected a <number> or an IMeasurement (got ${typeof entry})`,
  );
};

/**
 * Build a 1-to-4-value helper whose entries are each a `<number>` (hardened
 * with `min`) or an `IMeasurement`, with an optional per-entry keyword
 * (`'auto'` for the *-width properties). Mirrors the box-edge `{1,4}` shape
 * (`border-image-width`, `border-image-outset`, ...): supply one to four
 * entries, rendered space-separated in order.
 */
const makeEdgeQuadHelper =
  <CssProperty extends MultiPropertyKey>(
    helper: string,
    min: number | undefined,
    keywords: readonly string[],
  ) =>
  (
    first: NumberOrLength | string,
    ...rest: readonly (NumberOrLength | string)[]
  ): MultiCssValue<CssProperty> => {
    const entries = [
      first,
      ...rest,
    ];
    if (entries.length > 4) {
      throw new Error(
        `${helper}: expected 1 to 4 entries (got ${entries.length})`,
      );
    }
    const keywordSet = new Set(keywords);
    const parts = entries.map((entry) => {
      if (typeof entry === 'string') {
        if (!keywordSet.has(entry)) {
          throw new Error(
            `${helper}: '${entry}' is not a valid keyword` +
              ` (expected one of: ${keywords.join(', ') || 'none'})`,
          );
        }
        return entry;
      }
      return renderNumberOrLength(entry, helper, min);
    });
    return wrap(parts.join(' '));
  };

/**
 * `border-image-width`: one to four entries, each a non-negative `<number>`
 * multiplier (hardened through `f({ min: 0 })`), an `IMeasurement` length, or
 * the keyword `'auto'`. `.css()` is `Property.BorderImageWidth`.
 */
export const borderImageWidth =
  makeEdgeQuadHelper<'BorderImageWidth'>('borderImageWidth', 0, [
    'auto',
  ]);

/**
 * `border-image-outset`: one to four entries, each a non-negative `<number>`
 * (hardened through `f({ min: 0 })`) or an `IMeasurement` length. `.css()` is
 * `Property.BorderImageOutset`.
 */
export const borderImageOutset =
  makeEdgeQuadHelper<'BorderImageOutset'>('borderImageOutset', 0, []);

/**
 * `mask-border-width`: like {@link borderImageWidth} (non-negative `<number>`,
 * `IMeasurement`, or `'auto'`; one to four entries). `.css()` is
 * `Property.MaskBorderWidth`.
 */
export const maskBorderWidth = makeEdgeQuadHelper<'MaskBorderWidth'>(
  'maskBorderWidth',
  0,
  [
    'auto',
  ],
);

/**
 * `mask-border-outset`: like {@link borderImageOutset} (non-negative
 * `<number>` or `IMeasurement`; one to four entries). `.css()` is
 * `Property.MaskBorderOutset`.
 */
export const maskBorderOutset =
  makeEdgeQuadHelper<'MaskBorderOutset'>('maskBorderOutset', 0, []);

/**
 * Build a `border-image-slice` / `mask-border-slice` helper: one to four
 * non-negative `<number>` entries (hardened through `f({ min: 0 })`; the
 * percentage form is out of scope), with an optional trailing `'fill'`
 * keyword. The slice properties accept numbers (and percentages), not lengths,
 * so an `IMeasurement` is rejected.
 */
const makeSliceHelper =
  <CssProperty extends MultiPropertyKey>(helper: string) =>
  (
    first: number,
    ...rest: readonly (number | 'fill')[]
  ): MultiCssValue<CssProperty> => {
    const all = [
      first,
      ...rest,
    ];
    let fill = false;
    if (all[all.length - 1] === 'fill') {
      fill = true;
      all.pop();
    }
    if (all.some((entry) => entry === 'fill')) {
      throw new Error(
        `${helper}: 'fill' may only appear as the trailing keyword`,
      );
    }
    if (all.length < 1 || all.length > 4) {
      throw new Error(
        `${helper}: expected 1 to 4 numbers (got ${all.length})`,
      );
    }
    const parts = (all as number[]).map((entry) => {
      if (typeof entry !== 'number') {
        throw new Error(
          `${helper}: expected a <number> (got ${typeof entry})`,
        );
      }
      return f(entry, { min: 0, context: helper }).css();
    });
    if (fill) {
      parts.push('fill');
    }
    return wrap(parts.join(' '));
  };

/**
 * `border-image-slice`: one to four non-negative `<number>` entries, with an
 * optional trailing `'fill'` keyword. The percentage form is out of scope.
 * `.css()` is `Property.BorderImageSlice`.
 */
export const borderImageSlice = makeSliceHelper<'BorderImageSlice'>(
  'borderImageSlice',
);

/**
 * `mask-border-slice`: like {@link borderImageSlice} (one to four non-negative
 * `<number>` entries plus an optional trailing `'fill'`). `.css()` is
 * `Property.MaskBorderSlice`.
 */
export const maskBorderSlice =
  makeSliceHelper<'MaskBorderSlice'>('maskBorderSlice');

/**
 * `stroke-width`: a single non-negative `<number>` (SVG user units, hardened
 * through `f({ min: 0 })`) or an `IMeasurement` length. The percentage form is
 * out of scope. `.css()` is `Property.StrokeWidth`.
 */
export const strokeWidth = (
  value: NumberOrLength,
): MultiCssValue<'StrokeWidth'> =>
  wrap(renderNumberOrLength(value, 'strokeWidth', 0));

/**
 * `stroke-dashoffset`: a single `<number>` (any value; SVG user units, hardened
 * through `f()`) or an `IMeasurement` length. The percentage form is out of
 * scope. `.css()` is `Property.StrokeDashoffset`.
 */
export const strokeDashoffset = (
  value: NumberOrLength,
): MultiCssValue<'StrokeDashoffset'> =>
  wrap(renderNumberOrLength(value, 'strokeDashoffset'));

/**
 * `stroke-dasharray`: the keyword `'none'`, or a list of one or more entries,
 * each a non-negative `<number>` (SVG user units, hardened through
 * `f({ min: 0 })`) or an `IMeasurement` length. The percentage form is out of
 * scope. `.css()` is `Property.StrokeDasharray`.
 */
export function strokeDasharray(
  keyword: 'none',
): MultiCssValue<'StrokeDasharray'>;
export function strokeDasharray(
  first: NumberOrLength,
  ...rest: readonly NumberOrLength[]
): MultiCssValue<'StrokeDasharray'>;
export function strokeDasharray(
  first: NumberOrLength | 'none',
  ...rest: readonly NumberOrLength[]
): MultiCssValue<'StrokeDasharray'> {
  if (first === 'none') {
    if (rest.length > 0) {
      throw new Error(
        `strokeDasharray: 'none' cannot be combined with entries`,
      );
    }
    return wrap('none');
  }
  const entries = [
    first,
    ...rest,
  ];
  const parts = entries.map((entry) =>
    renderNumberOrLength(entry, 'strokeDasharray', 0),
  );
  return wrap(parts.join(' '));
}
