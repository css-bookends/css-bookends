import type { Property } from 'csstype';

/**
 * An indexable bridge over csstype's `Property` NAMESPACE.
 *
 * csstype exposes per-property value types as namespace members (`Property.Opacity`,
 * `Property.ZIndex`), and a namespace cannot be `keyof`-ed or indexed by a generic
 * key. This interface re-exposes exactly the members the spec table uses, so a row's
 * PascalCase `cssProperty` key (e.g. `'Opacity'`) can index it: `PropertyValueMap['Opacity']`
 * is `Property.Opacity`. That is what lets one generic factory type every helper's
 * `.css()` return against the right csstype value type.
 *
 * Add a row to the spec table -> add its `Property` key here.
 */
export interface PropertyValueMap {
  Opacity: Property.Opacity;
  FillOpacity: Property.FillOpacity;
  StrokeOpacity: Property.StrokeOpacity;
  StopOpacity: Property.StopOpacity;
  FloodOpacity: Property.FloodOpacity;
  ShapeImageThreshold: Property.ShapeImageThreshold;
  LineHeight: Property.LineHeight;
  FlexGrow: Property.FlexGrow;
  FlexShrink: Property.FlexShrink;
  AnimationIterationCount: Property.AnimationIterationCount;
  FontSizeAdjust: Property.FontSizeAdjust;
  Zoom: Property.Zoom;
  FontWeight: Property.FontWeight;
  StrokeMiterlimit: Property.StrokeMiterlimit;
  ZIndex: Property.ZIndex;
  Order: Property.Order;
  MathDepth: Property.MathDepth;
  ColumnCount: Property.ColumnCount;
  Orphans: Property.Orphans;
  Widows: Property.Widows;
  WebkitLineClamp: Property.WebkitLineClamp;
}

/** The set of csstype `Property` keys the css-value layer covers. */
export type CssPropertyKey = keyof PropertyValueMap;
