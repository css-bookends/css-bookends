// The per-property CSS-VALUE HELPER LAYER: typed helpers for single-value CSS
// properties (`opacity`, `zIndex`, ...), each a constrained scalar (built on the
// `i()` / `f()` primitives) plus that property's keyword companions, with
// `.css()` typed against csstype's `Property`. The bare helper exports are
// `createCssValues()` at its defaults (`outOfRange: 'throw'`).
import { createCssValues } from './cssValues';

export {
  createCssValues,
  type CssValue,
  type CssValueHelper,
  type CssValueOptions,
  type CssValues,
  type CssValuesConfig,
  type OutOfRange,
} from './cssValues';
export {
  borderImageOutset,
  borderImageSlice,
  borderImageWidth,
  type CounterEntry,
  counterIncrement,
  counterReset,
  counterSet,
  gridColumnEnd,
  gridColumnStart,
  type GridLineInput,
  gridRowEnd,
  gridRowStart,
  maskBorderOutset,
  maskBorderSlice,
  maskBorderWidth,
  type MultiCssValue,
  type MultiPropertyKey,
  type MultiPropertyValueMap,
  type NumberOrLength,
  scale,
  span,
  type SpanInput,
  strokeDasharray,
  strokeDashoffset,
  strokeWidth,
  tabSize,
} from './multi';
export {
  type CssPropertyKey,
  type PropertyValueMap,
} from './propertyMap';
export {
  CSS_VALUE_SPEC,
  type CssValueSpec,
  type SpecRow,
} from './spec';

/** The default instance: the bare helpers below are bound to it. */
const defaults = createCssValues();

export const {
  animationIterationCount,
  columnCount,
  fillOpacity,
  flexGrow,
  flexShrink,
  floodOpacity,
  fontSizeAdjust,
  fontWeight,
  lineClamp,
  lineHeight,
  mathDepth,
  opacity,
  order,
  orphans,
  shapeImageThreshold,
  stopOpacity,
  strokeMiterlimit,
  strokeOpacity,
  widows,
  zIndex,
  zoom,
} = defaults;
