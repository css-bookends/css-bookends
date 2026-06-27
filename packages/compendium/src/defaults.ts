// The compendium's LAZY-DEFAULTS entry: `publishCompendium()` called once at its
// defaults, with every bound book and lexicon re-exported by name. This is the
// zero-config path, the convenience layer ON TOP of the factory: import the helper
// you want already bound, and never call a factory yourself. The configurable path
// stays the package default export, `publishCompendium`.
//
//   import { opacity, m, color } from '@css-bookends/compendium/defaults';
//   opacity(0.5).css(); // '0.5'
//   m(8).css();         // '8px'
//   color('#3366cc').darken(0.2).css();
//
// The lexicon helpers (`m` / `r` / `i` / `f` / the unit helpers / refinements) are
// re-exported straight from css-calipers (the same default instances the compendium
// binds). Each bound BOOK is pulled off the bound compendium and given an explicit
// `Compendium['<key>']` annotation: that names the type through the local `Compendium`
// type (portable) instead of letting tsc infer a deep, pnpm-nested node_modules path
// (which is not portable, TS2742). `color` is the bound colour BOOK and shadows the
// calipers `color` value fn that the star re-export also carries (a local export wins).
import type { Compendium } from './index';
import { publishCompendium } from './index';

export * from '@css-bookends/css-calipers';

const bound: Compendium = publishCompendium();

// the colour BOOK (shadows the calipers `color` value fn from the star export above)
export const color: Compendium['color'] = bound.color;

// factory books, each bound at its defaults
export const animationIterationCount: Compendium['animationIterationCount'] =
  bound.animationIterationCount;
export const borderImageOutset: Compendium['borderImageOutset'] =
  bound.borderImageOutset;
export const borderImageSlice: Compendium['borderImageSlice'] =
  bound.borderImageSlice;
export const borderImageWidth: Compendium['borderImageWidth'] =
  bound.borderImageWidth;
export const borders: Compendium['borders'] = bound.borders;
export const columnCount: Compendium['columnCount'] =
  bound.columnCount;
export const counterIncrement: Compendium['counterIncrement'] =
  bound.counterIncrement;
export const counterReset: Compendium['counterReset'] =
  bound.counterReset;
export const counterSet: Compendium['counterSet'] = bound.counterSet;
export const fillOpacity: Compendium['fillOpacity'] =
  bound.fillOpacity;
export const flexGrow: Compendium['flexGrow'] = bound.flexGrow;
export const flexShrink: Compendium['flexShrink'] = bound.flexShrink;
export const floodOpacity: Compendium['floodOpacity'] =
  bound.floodOpacity;
export const fontSizeAdjust: Compendium['fontSizeAdjust'] =
  bound.fontSizeAdjust;
export const fontWeight: Compendium['fontWeight'] = bound.fontWeight;
export const gridColumnEnd: Compendium['gridColumnEnd'] =
  bound.gridColumnEnd;
export const gridColumnStart: Compendium['gridColumnStart'] =
  bound.gridColumnStart;
export const gridRowEnd: Compendium['gridRowEnd'] = bound.gridRowEnd;
export const gridRowStart: Compendium['gridRowStart'] =
  bound.gridRowStart;
export const lineClamp: Compendium['lineClamp'] = bound.lineClamp;
export const lineHeight: Compendium['lineHeight'] = bound.lineHeight;
export const margin: Compendium['margin'] = bound.margin;
export const maskBorderOutset: Compendium['maskBorderOutset'] =
  bound.maskBorderOutset;
export const maskBorderSlice: Compendium['maskBorderSlice'] =
  bound.maskBorderSlice;
export const maskBorderWidth: Compendium['maskBorderWidth'] =
  bound.maskBorderWidth;
export const mathDepth: Compendium['mathDepth'] = bound.mathDepth;
export const opacity: Compendium['opacity'] = bound.opacity;
export const order: Compendium['order'] = bound.order;
export const orphans: Compendium['orphans'] = bound.orphans;
export const padding: Compendium['padding'] = bound.padding;
export const scale: Compendium['scale'] = bound.scale;
export const shapeImageThreshold: Compendium['shapeImageThreshold'] =
  bound.shapeImageThreshold;
export const stopOpacity: Compendium['stopOpacity'] =
  bound.stopOpacity;
export const strokeDasharray: Compendium['strokeDasharray'] =
  bound.strokeDasharray;
export const strokeDashoffset: Compendium['strokeDashoffset'] =
  bound.strokeDashoffset;
export const strokeMiterlimit: Compendium['strokeMiterlimit'] =
  bound.strokeMiterlimit;
export const strokeOpacity: Compendium['strokeOpacity'] =
  bound.strokeOpacity;
export const strokeWidth: Compendium['strokeWidth'] =
  bound.strokeWidth;
export const tabSize: Compendium['tabSize'] = bound.tabSize;
export const widows: Compendium['widows'] = bound.widows;
export const zIndex: Compendium['zIndex'] = bound.zIndex;
export const zoom: Compendium['zoom'] = bound.zoom;

// composed-book namespaces (utility surfaces, no factory)
export const backdropFilter: Compendium['backdropFilter'] =
  bound.backdropFilter;
export const positioning: Compendium['positioning'] =
  bound.positioning;
export const shadows: Compendium['shadows'] = bound.shadows;
export const supportsFallback: Compendium['supportsFallback'] =
  bound.supportsFallback;
export const transforms: Compendium['transforms'] = bound.transforms;
