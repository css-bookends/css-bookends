# CSS color-space fallback: how it is handled

Research for the color lexicon's browser-fallback feature: when a color uses a
modern or wide-gamut space (`oklch`, `lab`, `color(display-p3 ...)`) that an older
browser cannot render, how do you ship a safe fallback. Feeds the borders color
fallback and the per-format helpers under `src/formats/`.

Sources (researched 2026-06-21):

- Chrome, migrate to HD color: https://developer.chrome.com/docs/css-ui/migrate-hd-color
- csstools postcss-oklab-function: https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-oklab-function
- WebKit, wide-gamut display-p3: https://webkit.org/blog/10042/wide-gamut-color-in-css-with-display-p3/
- MDN, color-gamut media feature: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/color-gamut
- CSS-Tricks, oklch(): https://css-tricks.com/almanac/functions/o/oklch/
- Evil Martians, OKLCH: https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl

## The two patterns

CSS cannot put two values on one declaration, so a fallback needs one of these.

1. **Cascade (duplicate the declaration, fallback first).** Browsers ignore values
   they cannot parse, so the last one they understand wins:
   ```css
   color: rgb(73 71 69);          /* fallback first */
   color: oklch(0.6 0.13 250);    /* modern wins if understood */
   ```
   This is what developers reach for most of the time.

2. **`@supports` feature query.** A base value, then the modern value inside a
   query that tests syntax support:
   ```css
   .btn { color: rgb(73 71 69); }
   @supports (color: oklch(0 0 0)) {
     .btn { color: oklch(0.6 0.13 250); }
   }
   ```

## What the standard tooling does

`@csstools/postcss-oklab-function` (used by postcss-preset-env; Tailwind v4 lives in
this world) emits a cascade chain, fallback-first:
```css
/* oklab(40% ...) becomes: */
color: rgb(73, 71, 69);                        /* sRGB floor */
color: color(display-p3 0.285 0.279 0.272);    /* wider-gamut tier */
/* original dropped by default; kept as a third line with preserve:true */
```
So a format-priority chain emitted as cascade redeclarations is industry-standard
behavior.

## Two orthogonal axes

- `@supports (color: ...)` tests whether the browser **parses the syntax**.
- `@media (color-gamut: p3)` / `(dynamic-range: high)` tests whether the **display
  can render** wide gamut.

These are independent. For `display-p3` you ideally check both. For `oklch` / `lab`
only syntax support is relevant (the browser gamut-maps to the display).

## The custom-property gotcha

The cascade trick breaks for CSS custom properties. Assigning an unsupported color
to a `--var` does not gracefully degrade, because custom properties accept any
value at declaration time. So colors that flow through variables must use
`@supports` (and `@media` for gamut), not cascade:
```css
:root { --accent: rgb(45 122 200); }
@supports (color: oklch(0 0 0)) {
  :root { --accent: oklch(0.6 0.13 250); }
}
```
The real driver of cascade vs `@supports` is **inline value vs custom property**,
more than shorthand vs longform (though shorthand/longform still maps cleanly in
practice: shorthand redeclares, longform `@supports`).

## Browser support (2026, approximate)

- `oklch` / `oklab` / `lab` / `lch`: ~93 to 95 percent.
- `color(display-p3 ...)` and `@media (color-gamut)`: broadly supported, but the
  wider color only shows on P3-capable displays.
- `rgb` / `hsl` / `hex`: universal. `hwb`: ~96 percent.

So the chain's main job is the long tail plus the `display-p3` gamut, not the
common case.

## Implications for CSS-Bookends

- Colors emitted as literal inline values (the platemaker's output, a book's
  rendered value) can use the cascade. `@supports` / `@media` is the escape hatch
  for custom properties and wide gamut.
- Among the sRGB notations (`rgb` / `rgba` / `hex` / `hsl` / `hwb`), only ONE is
  needed as the fallback floor; chaining several adds output with no compatibility
  gain (the difference is author readability, not support). The meaningful tiers are
  wide-gamut and modern (`display-p3`, `oklch`, `oklab`, `lab`, `lch`) down to a
  single sRGB floor. This is why our default chain is `display-p3 -> oklch -> rgb`.
- The color is normalized to OKLCH in storage, and culori (`clampChroma`, `inGamut`)
  gamut-maps losslessly, so computing each down-chain format is straightforward.
