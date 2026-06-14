# Backing library research (the color guts)

Which library (or libraries) backs the color book's guts to get full coverage of the
`color-spaces.md` surface and the function set in `src/color.ts`, best-in-class. The
contract never names the library; this is purely a guts decision and is swappable.

## What we need the guts to do

- **Parse** any CSS color string (named, hex, rgb/hsl/hwb/lab/lch/oklab/oklch, `color()`).
- **Construct** from components in every space (rgb/hsl/hwb/lab/lch/oklab/oklch).
- **Output** every format: rgb (+legacy), hex (+alpha), hsl, hwb, lab, lch, oklab,
  oklch, modern, `color(display-p3 …)`.
- **Manipulate** (immutable): alpha, lighten/darken (lightness), saturate/desaturate
  (chroma), hueShift, mix/mixSolid, blend (multiply/screen), solid; plus the gaps:
  setLightness/setChroma/setHue, contrast/ensureContrast, complement, invert, grayscale.
- **Gamut mapping** (out-of-gamut OKLCH and wide-gamut P3), not naive clipping.

## Candidates

| Library | CSS Color 4 coverage | Style | Notable | Downloads (wk) | Used by |
| --- | --- | --- | --- | --- | --- |
| **culori** | all spaces (rgb/hsl/hwb/lab/lch/oklab/oklch/`color()`/p3) in + out | function-oriented (plain objects + composable fns), ESM-native, tree-shakeable | parse, `formatCss`/`formatHex`/`formatRgb`, `converter`, `interpolate`, blend modes, `differenceE*`, gamut (`clampChroma`/`toGamut`/`inGamut`), `wcagContrast`/`wcagLuminance` | ~513k | **Tailwind v4, Radix UI** |
| **colorjs.io** | every CSS Color 4 format I/O; also Jzazbz/Rec.2100 | class-based (Color object) + procedural tree-shakeable API; dependency-free | real CSS gamut-mapping algorithm; deltaE 76/CMC/2000/Jz; WCAG + APCA contrast; get/set coords; mix/range/steps | ~2.7M | spec editors' reference |
| chroma-js (current guts) | sRGB-centric; **no native oklab/oklch/p3 output** | chainable | data-viz scales/interpolation | ~1.3M | legacy |

Maintainers: colorjs.io is by **Lea Verou + Chris Lilley** (the CSS Color spec
editors), so it is the most spec-accurate / cutting-edge. culori is leaner and
function-oriented.

## How culori covers our function set

- parse any string -> `parse` / string converters
- construct per space -> mode objects + `converter('<space>')`
- output any format -> `formatCss(convert(c,'<space>'))`, `formatHex`, `formatRgb`; p3 via formatCss of the p3 mode
- alpha -> set `.alpha`
- darken/lighten -> edit OKLCH `l`; saturate/desaturate -> edit OKLCH `c` (gamut-aware via `clampChroma`); hueShift -> edit OKLCH `h`; setLightness/Chroma/Hue -> set those coords
- mix/mixSolid -> `interpolate` / `samples`
- blend multiply/screen -> `blend`
- contrast/ensureContrast -> `wcagContrast` / `wcagLuminance`
- complement (h+180), invert (1 - rgb), grayscale (c -> 0) -> derived
- gamut mapping -> `clampChroma` / `toGamut` / `inGamut`

So **culori alone covers the entire surface** (chroma-js, the current gut, cannot
emit oklab/oklch/p3 and is the wrong tool here).

## Recommendation

- **Primary: culori.** Full CSS Color 4 coverage, function-oriented (fits our
  immutable plain-data wrapper and the swappable-guts model), ESM + tree-shakeable
  (good for a lexicon's bundle), and battle-tested as the engine behind **Tailwind
  v4 and Radix**. Covers every function we listed, including WCAG contrast and gamut
  mapping. Replaces chroma-js entirely.
- **colorjs.io: only if** we later need APCA contrast or the strictest spec-grade
  gamut mapping / advanced deltaE. It is the most authoritative (spec editors) but
  class-based and heavier; overkill for our surface, where culori's `clampChroma` +
  `wcagContrast` already suffice.

Net: standardize the guts on **culori**, drop chroma-js.

## Sources

- culori: https://culorijs.org/
- color.js: https://colorjs.io/ , gamut mapping: https://colorjs.io/docs/gamut-mapping
- npm trends (downloads): https://npmtrends.com/chroma-js-vs-color.js-vs-colord-vs-colorjs.io-vs-culori
- culori vs chroma-js vs tinycolor2: https://www.pkgpulse.com/blog/culori-vs-chroma-js-vs-tinycolor2-color-manipulation-javascript-2026
- Tailwind v4 (OKLCH palette): https://tailwindcss.com/blog/tailwindcss-v4
