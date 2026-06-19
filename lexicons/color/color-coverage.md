# color book — coverage

What the color book actually covers, on top of the spec value surface in
[`color-space.md`](./color-space.md). Goal: **comprehensive, not exhaustive** — cover the
mainstream CSS Color 4 surface, skip the niche. The backing library is an internal,
swappable detail (see [`backing-library.md`](./backing-library.md)); this document is the
contract.

## Two kinds of value (our handling)

- **Translatable** — resolves to a concrete point in a color space. Manipulable
  (darken / mix / hueShift) and convertible to any output format.
- **Symbolic** — a contextual keyword with no fixed value (`currentColor`, system colors,
  CSS-wide keywords). You make one and **emit it** (it renders its own keyword for any
  requested format); **modifying it is a violation** (throws in dev / warns in prod, per
  the strictness config).

## Input (make): lenient

**Rule: if it is a valid CSS color value, we accept it.** Anything the backing library can
parse (including `hwb()`, `color(display-p3 …)`, and wide-gamut `color()` spaces) is
accepted and normalized in storage. Structured object inputs are also accepted:
`{ space:'rgb', r,g,b, alpha? }` (r/g/b 0–255), `hsl` / `hwb` (s/l/w/b 0–100),
`lab` / `lch` / `oklab` / `oklch`. Plus **re-wrap** of an existing `ResolvedColor`.

## Storage

Every translatable color is normalized to **OKLCH**; symbolic values are kept as-is. Output
converts back out of OKLCH into the requested format.

## Output formats + alpha / gamut policy

- Formats: `rgba` (default), `rgb`, `hex`, `hexAlpha`, `hsl`, `hwb`, `lab`, `lch`, `oklab`,
  `oklch`, `displayP3`. Output is always the `.css()` terminal; selectors set the format.
- Every alpha-capable format ALWAYS renders its alpha slot (`rgba(…, 1)`, `oklch(… / 1)`);
  only `rgb` / `hex` (hex6) carry no alpha. The `omitOpaqueAlpha` config drops the slot for
  the optional-alpha formats when the color is opaque.
- `transparent` is translatable (`rgb(0 0 0 / 0)`): fully manipulable; how a
  fully-transparent color emits is set by the `transparent` config option
  (`keyword` / `white` / `black`).
- One `strictness` knob (factory config; `'auto'` = throw in dev / warn in prod, or explicit
  `'throw'` / `'warn'` / `'silent'`) governs every "can't faithfully represent this" case:
  dropping a non-opaque alpha (`rgb` / `hex`), out of the target format's gamut (clamped via
  chroma reduction), and modifying a symbolic color.

## make × emit matrix (test grid)

- **Translatable inputs × output formats:** full cross-product over a representative color,
  plus a translucent (alpha) case across the alpha-capable formats.
- **Symbolic inputs:** the keyword passes through on emit for any format; modifying throws.
- **Lenient / wide-gamut input** (`hwb` / `display-p3` / `rec2020`): accepted and normalized.

## Out of scope / lenient-only

- Wide-gamut spaces `color(rec2020 …)`, `color(prophoto-rgb …)`, `color(xyz …)` are not
  first-class **structured** inputs, but are accepted leniently on input (parsed and
  normalized).
- There is no `modern`/fallback output format — fallback declarations are a separate
  property helper's job.

## Deferred (not yet built)

Modification gaps, kept as real failing markers in the test matrix until implemented:
`blend.multiply` / `blend.screen` (+ overlay — the old impl was a non-standard alpha hack,
needs a real design), `setLightness` / `setChroma` / `setHue`, `contrast` / `ensureContrast`,
`complement`, `invert`, `grayscale`.
