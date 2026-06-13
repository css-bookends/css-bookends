import type { DegMeasurement } from '@css-bookends/css-calipers';
import type { Color } from 'chroma-js';
import type { Oklch } from 'culori';

export type { Color } from 'chroma-js';

type MixArgs = Parameters<Color['mix']>;

type CssOptions = {
  forceAlpha?: boolean;
  preferKeywordTransparent?: boolean;
};

export type ColorWrapper = {
  unsafeColor: Color;
  css: (options?: CssOptions) => string;
  alpha: {
    (): number;
    (value: number): ColorWrapper;
  };
  darken: (value?: number) => ColorWrapper;
  brighten: (value?: number) => ColorWrapper;
  lighten: (value?: number) => ColorWrapper;
  saturate: (value?: number) => ColorWrapper;
  desaturate: (value?: number) => ColorWrapper;
  hueShift: (value: DegMeasurement) => ColorWrapper;
  mix: (
    target: ColorInput,
    ratio?: number,
    mode?: MixArgs[2],
  ) => ColorWrapper;
  mixSolid: (
    target: ColorInput,
    ratio?: number,
    mode?: MixArgs[2],
  ) => ColorWrapper;
  blend: {
    multiply: (options?: BlendOptions) => ColorWrapper;
    screen: (options?: BlendOptions) => ColorWrapper;
  };
  clone: () => ColorWrapper;
  value: () => Color;
  solid: () => ColorWrapper;
};

export type ColorInput = Color | ColorWrapper | string | ColorObject;
type BlendOptions = {
  ratio?: number;
  stripColor?: ColorInput;
};

export type CuloriOKLCH = Oklch;

type OklchCreator = {
  (value: string): ColorWrapper;
  (l: number, c: number, h: number, alpha?: number): ColorWrapper;
};

type ColorCreators = {
  css: (value: string) => ColorWrapper;
  hex: (value: string) => ColorWrapper;
  rgba: (
    r: number,
    g: number,
    b: number,
    alpha?: number,
  ) => ColorWrapper;
  hsl: (
    h: number,
    s: number,
    l: number,
    alpha?: number,
  ) => ColorWrapper;
  hwb: (
    h: number,
    w: number,
    b: number,
    alpha?: number,
  ) => ColorWrapper;
  lab: (
    l: number,
    a: number,
    b: number,
    alpha?: number,
  ) => ColorWrapper;
  lch: (
    l: number,
    c: number,
    h: number,
    alpha?: number,
  ) => ColorWrapper;
  oklab: (
    l: number,
    a: number,
    b: number,
    alpha?: number,
  ) => ColorWrapper;
  oklch: OklchCreator;
};

export type OKLCH = {
  l: number;
  c: number;
  h: number;
  a?: number;
};

export type ColorInputWithOKLCH = OKLCH | string | ColorWrapper;

/* ---------- added: structured object input (one per color space; `alpha` everywhere) ---------- */

export type ColorObject =
  | { space: 'rgb'; r: number; g: number; b: number; alpha?: number }
  | { space: 'hsl'; h: number; s: number; l: number; alpha?: number }
  | { space: 'hwb'; h: number; w: number; b: number; alpha?: number }
  | { space: 'lab'; l: number; a: number; b: number; alpha?: number }
  | { space: 'lch'; l: number; c: number; h: number; alpha?: number }
  | {
      space: 'oklab';
      l: number;
      a: number;
      b: number;
      alpha?: number;
    }
  | {
      space: 'oklch';
      l: number;
      c: number;
      h: number;
      alpha?: number;
    };

/** The color-space discriminants (`'rgb' | 'hsl' | ...`). */
export type ColorSpace = ColorObject['space'];

/* ---------- added: symbolic keywords (emit-only; no fixed value) ---------- */

export type CurrentColor = 'currentColor';

/** CSS Color 4 system colors (current). */
export type SystemColor =
  | 'Canvas'
  | 'CanvasText'
  | 'LinkText'
  | 'VisitedText'
  | 'ActiveText'
  | 'ButtonFace'
  | 'ButtonText'
  | 'ButtonBorder'
  | 'Field'
  | 'FieldText'
  | 'Highlight'
  | 'HighlightText'
  | 'SelectedItem'
  | 'SelectedItemText'
  | 'Mark'
  | 'MarkText'
  | 'GrayText'
  | 'AccentColor'
  | 'AccentColorText';

/** Deprecated system colors (Appendix A): valid values, accepted as passthrough. */
export type DeprecatedSystemColor =
  | 'ActiveBorder'
  | 'ActiveCaption'
  | 'AppWorkspace'
  | 'Background'
  | 'ButtonHighlight'
  | 'ButtonShadow'
  | 'CaptionText'
  | 'InactiveBorder'
  | 'InactiveCaption'
  | 'InactiveCaptionText'
  | 'InfoBackground'
  | 'InfoText'
  | 'Menu'
  | 'MenuText'
  | 'Scrollbar'
  | 'ThreeDDarkShadow'
  | 'ThreeDFace'
  | 'ThreeDHighlight'
  | 'ThreeDLightShadow'
  | 'ThreeDShadow'
  | 'Window'
  | 'WindowFrame'
  | 'WindowText';

/** CSS-wide cascade keywords: valid color values, accepted as passthrough. */
export type CascadeKeyword =
  | 'inherit'
  | 'initial'
  | 'unset'
  | 'revert'
  | 'revert-layer';

/** Any keyword with no fixed value (emit-only; modifying/converting it throws). */
export type SymbolicColor =
  | CurrentColor
  | SystemColor
  | DeprecatedSystemColor
  | CascadeKeyword;
