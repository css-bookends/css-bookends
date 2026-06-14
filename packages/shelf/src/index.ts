// The whole bookshelf: a flat re-export of every lexicon and book so you can
// import everything from one place. Prefer the individual packages when you only
// need one concern.
export * from '@css-bookends/css-calipers';
export * from '@css-bookends/media-queries';

// color: a helper ALWAYS comes from its factory, never a pre-built instance. The
// color package ships `publishBookColor` (the factory) - bind your own with
// `publishBookColor({ config })`. The shelf re-exports the factory + format presets
// + types; it deliberately does NOT surface a ready-made color instance.
export type {
  ColorConfig,
  ColorInput,
  ColorObject,
  CssFormat,
  FormatName,
  ResolvedColor,
} from '@css-bookends/color';
export { colorFormats, publishBookColor } from '@css-bookends/color';
