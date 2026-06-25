import type { CssPropertyKey } from './propertyMap';

/**
 * One row of the css-value spec table. Each row describes a single-value CSS
 * property: the constrained scalar (an integer or a float, with optional
 * `min`/`max` bounds) plus that property's keyword companions.
 *
 * - `name` is the camelCase helper name (`opacity`, `zIndex`).
 * - `cssProperty` is the csstype `Property` key, so `.css()` is typed against
 *   that property's `Property.X` value type (via `PropertyValueMap`).
 * - `keywords` is the literal union of bare keywords the property also accepts
 *   (`'auto'`, `'normal'`, ...). It passes through untouched.
 *
 * The two generics (`CssProperty`, `Keyword`) are preserved per row so each
 * generated helper carries its own `.css()` return type and keyword union.
 */
export interface SpecRow<
  Name extends string = string,
  CssProperty extends CssPropertyKey = CssPropertyKey,
  Keyword extends string = string,
> {
  readonly name: Name;
  readonly kind: 'int' | 'float';
  readonly min?: number;
  readonly max?: number;
  readonly keywords: readonly Keyword[];
  readonly cssProperty: CssProperty;
}

/**
 * Helper that ties a row's `name`, `cssProperty`, and `keywords` together while
 * inferring each as a literal. Authoring a row through `row(...)` keeps `name`
 * and `keywords` as literals (so the helper map key and keyword param stay
 * precise) without sprinkling `as const` on every entry.
 */
const row = <
  const Name extends string,
  CssProperty extends CssPropertyKey,
  const Keyword extends string,
>(
  entry: SpecRow<Name, CssProperty, Keyword>,
): SpecRow<Name, CssProperty, Keyword> => entry;

/**
 * The css-value spec table: one row per single-value property. The factory in
 * `./cssValues.ts` generates a typed helper from each row, so adding a property
 * is a one-line table edit, not a hand-written function.
 *
 * Sourced from `docs/css-number-value-types.md`. Multi-value properties and
 * those lacking a clean single-value mapping (e.g. `maxLines`, the counter
 * trio, grid lines, `scale`, `tabSize`) are intentionally excluded.
 */
export const CSS_VALUE_SPEC = [
  // Opacity family: float, [0, 1], no keywords.
  row({
    name: 'opacity',
    kind: 'float',
    min: 0,
    max: 1,
    keywords: [],
    cssProperty: 'Opacity',
  }),
  row({
    name: 'fillOpacity',
    kind: 'float',
    min: 0,
    max: 1,
    keywords: [],
    cssProperty: 'FillOpacity',
  }),
  row({
    name: 'strokeOpacity',
    kind: 'float',
    min: 0,
    max: 1,
    keywords: [],
    cssProperty: 'StrokeOpacity',
  }),
  row({
    name: 'stopOpacity',
    kind: 'float',
    min: 0,
    max: 1,
    keywords: [],
    cssProperty: 'StopOpacity',
  }),
  row({
    name: 'floodOpacity',
    kind: 'float',
    min: 0,
    max: 1,
    keywords: [],
    cssProperty: 'FloodOpacity',
  }),
  row({
    name: 'shapeImageThreshold',
    kind: 'float',
    min: 0,
    max: 1,
    keywords: [],
    cssProperty: 'ShapeImageThreshold',
  }),

  // Float, >= 0.
  row({
    name: 'lineHeight',
    kind: 'float',
    min: 0,
    keywords: [
      'normal',
    ],
    cssProperty: 'LineHeight',
  }),
  row({
    name: 'flexGrow',
    kind: 'float',
    min: 0,
    keywords: [],
    cssProperty: 'FlexGrow',
  }),
  row({
    name: 'flexShrink',
    kind: 'float',
    min: 0,
    keywords: [],
    cssProperty: 'FlexShrink',
  }),
  row({
    name: 'animationIterationCount',
    kind: 'float',
    min: 0,
    keywords: [
      'infinite',
    ],
    cssProperty: 'AnimationIterationCount',
  }),
  row({
    name: 'fontSizeAdjust',
    kind: 'float',
    min: 0,
    keywords: [
      'none',
      'from-font',
    ],
    cssProperty: 'FontSizeAdjust',
  }),
  row({
    name: 'zoom',
    kind: 'float',
    min: 0,
    keywords: [],
    cssProperty: 'Zoom',
  }),

  // Float, specific range.
  row({
    name: 'fontWeight',
    kind: 'float',
    min: 1,
    max: 1000,
    keywords: [
      'normal',
      'bold',
      'lighter',
      'bolder',
    ],
    cssProperty: 'FontWeight',
  }),
  row({
    name: 'strokeMiterlimit',
    kind: 'float',
    min: 1,
    keywords: [],
    cssProperty: 'StrokeMiterlimit',
  }),

  // Integer, unbounded (negatives allowed).
  row({
    name: 'zIndex',
    kind: 'int',
    keywords: [
      'auto',
    ],
    cssProperty: 'ZIndex',
  }),
  row({
    name: 'order',
    kind: 'int',
    keywords: [],
    cssProperty: 'Order',
  }),
  row({
    name: 'mathDepth',
    kind: 'int',
    keywords: [
      'auto-add',
    ],
    cssProperty: 'MathDepth',
  }),

  // Integer, min 1.
  row({
    name: 'columnCount',
    kind: 'int',
    min: 1,
    keywords: [
      'auto',
    ],
    cssProperty: 'ColumnCount',
  }),
  row({
    name: 'orphans',
    kind: 'int',
    min: 1,
    keywords: [],
    cssProperty: 'Orphans',
  }),
  row({
    name: 'widows',
    kind: 'int',
    min: 1,
    keywords: [],
    cssProperty: 'Widows',
  }),
  row({
    name: 'lineClamp',
    kind: 'int',
    min: 1,
    keywords: [
      'none',
    ],
    cssProperty: 'WebkitLineClamp',
  }),
] as const;

/** The spec table's type (a readonly tuple of {@link SpecRow}s). */
export type CssValueSpec = typeof CSS_VALUE_SPEC;
