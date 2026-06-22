import type { DegMeasurement } from '@css-bookends/css-calipers';
import type { Manuscript } from '@css-bookends/self-publish';
import { publishBook } from '@css-bookends/self-publish';
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
import { interpolate, parse } from 'culori';

import type {
  ColorConfig,
  ColorInput,
  ColorObject,
  ColorSpace,
  CssColor,
  CssFormat,
  FormatName,
  ResolvedColor,
  Store,
  SymbolicColor,
} from './types';

import { colorFormats, type ColorSpaceDescriptor } from './formats';
import { chooseFormat } from './formats/escalate';
import {
  alphaOf,
  clamp01,
  toOklch,
  violate,
} from './formats/internals';

export * from './types';

/* A resolved color privately carries its store here so it can be re-wrapped by
 * `parseColor` (lib-agnostic: this holds our `Store`, never a culori name). */
const STORED = Symbol('color.store');

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
  input: ColorInput | Color,
): input is ColorObject =>
  typeof input === 'object' && input !== null && 'space' in input;

const isCuloriColor = (input: ColorInput | Color): input is Color =>
  typeof input === 'object' && input !== null && 'mode' in input;

const cloneStore = (store: Store): Store =>
  store.kind === 'symbolic'
    ? { kind: 'symbolic', keyword: store.keyword }
    : { kind: 'color', color: { ...store.color } };

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

  // re-wrap: an existing ResolvedColor carries its store privately.
  if (
    typeof input === 'object' &&
    input !== null &&
    STORED in input
  ) {
    return cloneStore((input as { [STORED]: Store })[STORED]);
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

/** Normalize a parsed store into the canonical OKLCH working space. */
export const storeColor = (store: Store): Store => {
  if (store.kind === 'symbolic') {
    return store;
  }
  return { kind: 'color', color: toOklch(store.color) };
};

/* ============================================================================
 * OUTPUT (Part 3 of the book): render the store in any format; build the result.
 *
 * The store is OKLCH; output converts OUT of it with culori and serializes. Every
 * alpha-capable format always renders its alpha slot; `rgb`/`hex` carry no alpha.
 * "Can't faithfully represent this" cases (dropped alpha, out-of-gamut) are
 * surfaced via the strictness knob (throw in dev / warn in prod by default), with a
 * best-effort value (clamped chroma) still produced in the warn case.
 * ==========================================================================*/

// The unified format registry (each entry a descriptor: render + metadata) lives in
// `./formats`; re-export it so `colorFormats.hex` stays the public output selector.
export { colorFormats };

// Render a (non-fully-transparent) color in the requested format by dispatching to
// that format's descriptor. The descriptors own the per-format render; this single
// dispatch replaced the old per-format switch.
const serialize = (
  color: Color,
  format: CssFormat,
  cfg: ColorConfig,
): string =>
  (colorFormats[format.format] as ColorSpaceDescriptor).render(
    color,
    cfg,
  );

const renderColor = (
  color: Color,
  format: CssFormat,
  cfg: ColorConfig,
): string => {
  // fully-transparent rendering policy (alpha 0): a keyword, or white/black at 0.
  if (alphaOf(color) === 0) {
    if (cfg.transparent === 'keyword') return 'transparent';
    const substitute: Color =
      cfg.transparent === 'white'
        ? { mode: 'rgb', r: 1, g: 1, b: 1, alpha: 0 }
        : { mode: 'rgb', r: 0, g: 0, b: 0, alpha: 0 };
    return serialize(substitute, format, cfg);
  }
  return serialize(color, format, cfg);
};

const render = (
  store: Store,
  output: CssFormat | CssFormat[],
  cfg: ColorConfig,
): CssColor => {
  // symbolic colors pass through: their keyword emits for any requested format.
  if (store.kind === 'symbolic') {
    return store.keyword;
  }
  // resolve the output (a single format, or a priority list) to one faithful format.
  const format = chooseFormat(store.color, output);
  return renderColor(store.color, format, cfg);
};

const wrapHue = (h: number): number => ((h % 360) + 360) % 360;

const resolve = <F extends FormatName = FormatName>(
  store: Store,
  cfg: ColorConfig,
): ResolvedColor<F> => {
  // a format selector: same color, new configured output, still finished via .css().
  const withFormat = (output: CssFormat): ResolvedColor =>
    resolve(store, { ...cfg, output });
  // a modification: a NEW color (re-normalized to OKLCH), same config.
  const withColor = (raw: Color): ResolvedColor =>
    resolve(storeColor({ kind: 'color', color: raw }), cfg);
  const self = (): ResolvedColor => resolve(store, cfg);

  // modifications are only valid on a translatable color; on a symbolic keyword
  // they are a violation (throw in dev / warn in prod) and leave the color as-is.
  const modifiable = (op: string): Oklch | undefined => {
    if (store.kind === 'symbolic') {
      violate(
        `color: cannot ${op} a symbolic color '${store.keyword}'`,
        cfg.strictness,
      );
      return undefined;
    }
    return store.color as Oklch;
  };

  const targetColor = (target: ColorInput): Color | undefined => {
    const resolved = storeColor(parseColor(target));
    if (resolved.kind !== 'color') {
      violate(
        'color: cannot mix with a symbolic color',
        cfg.strictness,
      );
      return undefined;
    }
    return resolved.color;
  };

  const blend = (
    op: string,
    target: ColorInput,
    ratio: number,
    mode: ColorSpace,
    makeBaseSolid: boolean,
  ): Color | undefined => {
    const c = modifiable(op);
    if (c === undefined) return undefined;
    const t = targetColor(target);
    if (t === undefined) return undefined;
    const base = makeBaseSolid ? { ...c, alpha: 1 } : c;
    return interpolate(
      [
        base,
        t,
      ],
      mode,
    )(clamp01(ratio));
  };

  const result = {
    css: (format?: CssFormat) =>
      render(store, format ?? cfg.output, cfg),
    rgba: () => withFormat(colorFormats.rgba),
    rgb: () => withFormat(colorFormats.rgb),
    hex: () => withFormat(colorFormats.hex),
    hexAlpha: () => withFormat(colorFormats.hexAlpha),
    hsl: () => withFormat(colorFormats.hsl),
    hwb: () => withFormat(colorFormats.hwb),
    lab: () => withFormat(colorFormats.lab),
    lch: () => withFormat(colorFormats.lch),
    oklab: () => withFormat(colorFormats.oklab),
    oklch: () => withFormat(colorFormats.oklch),
    displayP3: () => withFormat(colorFormats.displayP3),

    alpha: ((value?: number) => {
      if (value === undefined) {
        return store.kind === 'color' ? (store.color.alpha ?? 1) : 1;
      }
      const c = modifiable('set the alpha of');
      return c === undefined
        ? self()
        : withColor({ ...c, alpha: value });
    }) as ResolvedColor['alpha'],

    darken: (amount = 0.1) => {
      const c = modifiable('darken');
      return c === undefined
        ? self()
        : withColor({ ...c, l: c.l * (1 - clamp01(amount)) });
    },
    lighten: (amount = 0.1) => {
      const c = modifiable('lighten');
      return c === undefined
        ? self()
        : withColor({ ...c, l: c.l + (1 - c.l) * clamp01(amount) });
    },
    brighten: (amount = 0.1) => result.lighten(amount),
    saturate: (amount = 0.1) => {
      const c = modifiable('saturate');
      return c === undefined
        ? self()
        : withColor({ ...c, c: c.c * (1 + Math.max(0, amount)) });
    },
    desaturate: (amount = 0.1) => {
      const c = modifiable('desaturate');
      return c === undefined
        ? self()
        : withColor({ ...c, c: c.c * (1 - clamp01(amount)) });
    },
    hueShift: (value: DegMeasurement) => {
      const c = modifiable('hue-shift');
      return c === undefined
        ? self()
        : withColor({
            ...c,
            h: wrapHue((c.h ?? 0) + value.getValue()),
          });
    },

    mix: (
      target: ColorInput,
      ratio = 0.5,
      mode: ColorSpace = 'oklch',
    ) => {
      const mixed = blend('mix', target, ratio, mode, false);
      return mixed === undefined ? self() : withColor(mixed);
    },
    mixSolid: (
      target: ColorInput,
      ratio = 0.5,
      mode: ColorSpace = 'oklch',
    ) => {
      const mixed = blend('mix', target, ratio, mode, true);
      return mixed === undefined ? self() : withColor(mixed);
    },
    mixWithAlpha: (
      target: ColorInput,
      ratio = 0.5,
      alpha?: number,
      mode: ColorSpace = 'oklch',
    ) => {
      const c = modifiable('mix');
      if (c === undefined) return self();
      const mixed = blend('mix', target, ratio, mode, true);
      if (mixed === undefined) return self();
      return withColor({ ...mixed, alpha: alpha ?? c.alpha ?? 1 });
    },

    solid: () => {
      const c = modifiable('solidify');
      return c === undefined ? self() : withColor({ ...c, alpha: 1 });
    },
    clone: () => self(),
  };

  // carry the store privately so this result can be re-wrapped via `color(result)`.
  Object.defineProperty(result, STORED, { value: store });
  return result as unknown as ResolvedColor<F>;
};

/**
 * The default output priority: the simplest faithful format first. With no argument
 * `.css()` escalates down this ladder to the first format that holds the color (see
 * `formats/README.md`). Overridable per book via `publishBookColor({ config })`.
 */
export const defaultFormatPriority: CssFormat[] = [
  colorFormats.hex,
  colorFormats.rgb,
  colorFormats.hexAlpha,
  colorFormats.rgba,
  colorFormats.hsl,
  colorFormats.hwb,
  colorFormats.displayP3,
  colorFormats.lab,
  colorFormats.lch,
  colorFormats.oklab,
  colorFormats.oklch,
];

/** The book's defaults. */
export const defaultColorConfig: ColorConfig = {
  output: defaultFormatPriority,
  strictness: 'auto',
  transparent: 'keyword',
  omitOpaqueAlpha: false,
};

/** The color book's manuscript: input -> storage -> output. */
export const colorManuscript: Manuscript<
  ColorInput,
  Store,
  ResolvedColor,
  ColorConfig
> = {
  defaults: defaultColorConfig,
  input: (raw) => {
    if (raw === undefined) {
      throw new Error('color: an input color is required');
    }
    return parseColor(raw);
  },
  storage: (store) => storeColor(store),
  output: (store, cfg) => resolve(store, cfg),
};

/** The color factory: `publishBookColor({ config })` binds a color book. */
export const publishBookColor = publishBook(colorManuscript);
