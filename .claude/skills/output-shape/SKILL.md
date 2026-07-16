---
name: output-shape
description: The output contract every CSS-Bookends book follows - a single `.css()` render terminal, typed variant/format objects (never magic strings), output hardened to its variant type, and immutable results. Use when adding or reviewing a book's output step, `.css()`, format/variant selectors, or result type.
---

# output-shape

A book's OUTPUT step renders the canonical store into a result. Every book's result
follows the same contract, modeled by the color lexicon (`lexicons/calipers/src/color/`). This is
the how-to for the "Output is always `.css()`" rule in `AGENTS.md`.

## The rules

- **`.css()` is the single render terminal.** Rendering to a CSS string ALWAYS goes
  through `.css()`. No method returns a rendered string per variant (no
  `.hex(): string`, `.long(): string`).
- **Variants are typed objects, never magic strings.** A book exports a named preset
  namespace of typed variant objects (`colorFormats.hex`, a true book's
  `borderFormats.long`) as a discriminated union, so each variant carries its own
  typed options. Pick one via a selector (or `formatAs` for a custom format); never an
  argument into `.css()` and never a bare string.
  ```ts
  color('#3366cc').hex().css();             // selector, then .css()
  color('#3366cc').formatAs(colorFormats.hex).css(); // custom/list, then .css()
  ```
- **Output is hardened to its variant** (see `type-hardening`). A selector narrows the
  result type, so `.hex().css()` is `ColorString<'hex'>`, not a plain string; the
  one-off `.formatAs(colorFormats.hex).css()` is too. The configured / escalating
  default `.css()` stays the generic type, since the variant is chosen at runtime.
- **Selectors return the navigable result, not a string.** `.hex()` returns the result
  configured to that variant (it does NOT render); you still finish with `.css()`, and
  the chosen variant persists through later modifications.
- **Immutable.** Every operation (a variant selector, a modification like `.darken()`)
  returns a NEW result; nothing mutates. `color.ts`: "modifications: immutable - each
  returns a NEW resolved color."
- **Output SHAPE is a config axis: `format: 'object' | 'string'`** (distinct from WHICH
  variant renders, which is the `output`/`formatAs` axis above). `'object'` makes `.css()`
  return a property-keyed style object (`{ opacity: '0.5' }`, `{ marginTop: '8px', … }`);
  `'string'` makes it return the bare value (`'0.5'`). Global default `'object'`. The output
  step MUST receive `cfg` and switch on `format`; a step that drops `cfg` and ignores config is
  a bug (borders did this). Reference: spacing (`lexicons/spacing/src/render.ts`,
  `SpacingConfig.format`). Per-property books still expose `.value()` for the raw scalar;
  multi-property books keep their decomposition axis (longhand/shorthand) separate from `format`.
  `format` can be set per book or once via the bundle's `global` slot (the three-tier cascade,
  see `smart-factory` / `AGENTS.md`).

## Reference

`lexicons/calipers/src/color/formats/` (variant registry + branding), `ResolvedColor<F>` in
`lexicons/calipers/src/color/types.ts`, the `.css()` rule in `AGENTS.md`.
