import type {
  Color,
  Hsl,
  Hwb,
  Lab,
  Lch,
  Oklab,
  Oklch,
  Rgb,
} from 'culori';
import { converter, parse } from 'culori';

import type {
  ColorInput,
  ColorObject,
  Store,
  SymbolicColor,
} from './types';

export * from './types';

/* ============================================================================
 * INPUT (Part 1 of the book): parse a `ColorInput` into the canonical store.
 *
 * The store is the boundary between input and the rest of the book. Translatable
 * values become a culori color object; symbolic keywords are kept verbatim and
 * pass through on emit (modifying them throws later, not here). Storage
 * normalization and output formatting are separate, later steps.
 * ==========================================================================*/

/* The symbolic allowlist, in canonical casing. Runtime mirror of the
 * `Symbolic*` types; `satisfies` keeps each entry a valid keyword. */
const SYMBOLIC_KEYWORDS = [
  'currentColor',
  // system colors (current, CSS Color 4)
  'Canvas',
  'CanvasText',
  'LinkText',
  'VisitedText',
  'ActiveText',
  'ButtonFace',
  'ButtonText',
  'ButtonBorder',
  'Field',
  'FieldText',
  'Highlight',
  'HighlightText',
  'SelectedItem',
  'SelectedItemText',
  'Mark',
  'MarkText',
  'GrayText',
  'AccentColor',
  'AccentColorText',
  // system colors (deprecated, Appendix A - still accepted)
  'ActiveBorder',
  'ActiveCaption',
  'AppWorkspace',
  'Background',
  'ButtonHighlight',
  'ButtonShadow',
  'CaptionText',
  'InactiveBorder',
  'InactiveCaption',
  'InactiveCaptionText',
  'InfoBackground',
  'InfoText',
  'Menu',
  'MenuText',
  'Scrollbar',
  'ThreeDDarkShadow',
  'ThreeDFace',
  'ThreeDHighlight',
  'ThreeDLightShadow',
  'ThreeDShadow',
  'Window',
  'WindowFrame',
  'WindowText',
  // CSS-wide cascade keywords
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
] as const satisfies readonly SymbolicColor[];

/** lower-cased keyword -> canonical casing, for case-insensitive matching. */
const SYMBOLIC_BY_LOWER = new Map<string, SymbolicColor>(
  SYMBOLIC_KEYWORDS.map((keyword) => [
    keyword.toLowerCase(),
    keyword,
  ]),
);

const isColorObject = (
  input: ColorObject | Color,
): input is ColorObject =>
  typeof input === 'object' && input !== null && 'space' in input;

const isCuloriColor = (input: ColorObject | Color): input is Color =>
  typeof input === 'object' && input !== null && 'mode' in input;

/**
 * Adapt a structured `ColorObject` to a culori color object. We accept
 * CSS-authoring ranges (rgb 0-255, hsl/hwb percentages 0-100) and convert them
 * to culori's normalized ranges; lab/lch/oklab/oklch channels are 1:1.
 */
const colorObjectToCulori = (input: ColorObject): Color => {
  switch (input.space) {
    case 'rgb': {
      const color: Rgb = {
        mode: 'rgb',
        r: input.r / 255,
        g: input.g / 255,
        b: input.b / 255,
      };
      if (input.alpha !== undefined) color.alpha = input.alpha;
      return color;
    }
    case 'hsl': {
      const color: Hsl = {
        mode: 'hsl',
        h: input.h,
        s: input.s / 100,
        l: input.l / 100,
      };
      if (input.alpha !== undefined) color.alpha = input.alpha;
      return color;
    }
    case 'hwb': {
      const color: Hwb = {
        mode: 'hwb',
        h: input.h,
        w: input.w / 100,
        b: input.b / 100,
      };
      if (input.alpha !== undefined) color.alpha = input.alpha;
      return color;
    }
    case 'lab': {
      const color: Lab = {
        mode: 'lab',
        l: input.l,
        a: input.a,
        b: input.b,
      };
      if (input.alpha !== undefined) color.alpha = input.alpha;
      return color;
    }
    case 'lch': {
      const color: Lch = {
        mode: 'lch',
        l: input.l,
        c: input.c,
        h: input.h,
      };
      if (input.alpha !== undefined) color.alpha = input.alpha;
      return color;
    }
    case 'oklab': {
      const color: Oklab = {
        mode: 'oklab',
        l: input.l,
        a: input.a,
        b: input.b,
      };
      if (input.alpha !== undefined) color.alpha = input.alpha;
      return color;
    }
    case 'oklch': {
      const color: Oklch = {
        mode: 'oklch',
        l: input.l,
        c: input.c,
        h: input.h,
      };
      if (input.alpha !== undefined) color.alpha = input.alpha;
      return color;
    }
  }
};

/**
 * Parse any `ColorInput` into the canonical store.
 *
 * - string: a symbolic keyword (case-insensitive) -> passthrough store;
 *   otherwise parsed as a CSS color; an unparseable string throws.
 * - structured `ColorObject` -> adapted to a culori color.
 * - re-wrap: an existing culori color (internal/engine use) -> reused as-is.
 */
export const parseColor = (input: ColorInput | Color): Store => {
  if (typeof input === 'string') {
    const canonical = SYMBOLIC_BY_LOWER.get(input.toLowerCase());
    if (canonical !== undefined) {
      return { kind: 'symbolic', keyword: canonical };
    }
    const color = parse(input);
    if (color === undefined) {
      throw new Error(`color: unparseable color string "${input}"`);
    }
    return { kind: 'color', color };
  }

  if (isColorObject(input)) {
    return { kind: 'color', color: colorObjectToCulori(input) };
  }

  if (isCuloriColor(input)) {
    return { kind: 'color', color: input };
  }

  throw new Error('color: unsupported color input');
};

/* ============================================================================
 * STORAGE (Part 2 of the book): normalize the canonical store.
 *
 * Every translatable color is converted to OKLCH, so the rest of the book works
 * from one perceptually-uniform representation: modifications become direct
 * coordinate edits (l/c/h), and outputs convert out of OKLCH. Symbolic keywords
 * have no value to normalize and pass through untouched.
 *
 * This is pure culori math and runs anywhere JS runs - it needs no browser
 * `oklch()` support. Browser compatibility is purely an output-step concern
 * (which format you emit), not a storage concern.
 * ==========================================================================*/

const toOklch = converter('oklch');

/** Normalize a parsed store into the canonical OKLCH working space. */
export const storeColor = (store: Store): Store => {
  if (store.kind === 'symbolic') {
    return store;
  }
  return { kind: 'color', color: toOklch(store.color) };
};
