// The color book. Consume it ONLY through the factory `publishBookColor` (never a
// pre-built instance): bind your own, configured via `output` / `base` / `strictness`.
//
//   const color = publishBookColor({ config: { output: colorFormats.hex } });
//   color('#3366cc').darken(0.2).css();
//
// The colour VALUE surface (parse / store / resolve, `colorFormats`, the types) now
// lives in `@css-bookends/css-calipers`; it is re-exported here so this package's public
// API is unchanged. The `publishBook`-based book stays here.
//
// NOTE: the calipers `color()` convenience is intentionally NOT re-exported: this
// package's factory-only contract forbids a ready-made bare `color` export (you bind
// one via `publishBookColor`). Everything else from the value surface is re-exported.
export { colorManuscript, publishBookColor } from './color';
export {
  type CascadeKeyword,
  type ColorConfig,
  colorFormats,
  type ColorInput,
  type ColorObject,
  type ColorSpace,
  type ColorString,
  type CssColor,
  type CssFormat,
  type CurrentColor,
  defaultColorConfig,
  defaultFormatPriority,
  type DeprecatedSystemColor,
  type FormatName,
  parseColor,
  type ResolvedColor,
  type ColorStore as Store,
  storeColor,
  type Strictness,
  type SymbolicColor,
  type SystemColor,
  type TransparentRendering,
} from '@css-bookends/css-calipers';
