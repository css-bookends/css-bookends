import type { Color } from 'culori';

/**
 * The color book's TYPE contract: the live, library-agnostic surface for the
 * input + storage layers. Runtime lives in `./color.ts`, which re-exports these.
 *
 * The backing library (culori) is referenced only by the internal `Store.color`
 * shape; the author-facing types (`ColorInput`, `ColorObject`, `Symbolic*`) never
 * name it.
 */

/* ---------- structured object input (one per color space; `alpha` everywhere) ---------- */

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

/* ---------- symbolic keywords (emit-only; no fixed value) ---------- */

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

/* ---------- the canonical store ---------- */

/**
 * The canonical store, shared by the input and storage steps.
 *
 * - `color` is a culori color object. It can be any mode after INPUT (parse), and
 *   is normalized to OKLCH after STORAGE. That OKLCH-only state is a runtime
 *   invariant (asserted by the storage tests), not encoded in the type: the engine
 *   ties input and storage to one `Store`, so `color` stays broad here.
 * - symbolic keywords carry no value and pass through untouched.
 */
export type Store =
  | { kind: 'color'; color: Color }
  | { kind: 'symbolic'; keyword: SymbolicColor };

/* ---------- author-facing input ---------- */

/**
 * What a color may be created from. Re-wrapping an existing result is added in the
 * output step (once the library-agnostic result type exists); until then re-wrap is
 * an internal `parseColor` concern, kept off this public contract.
 */
export type ColorInput = string | ColorObject;
