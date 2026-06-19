# color value surface

The valid CSS `<color>` value surface per the spec. Implementation-agnostic; what the
color book actually covers (input leniency, storage, output formats, modification, config)
is tracked in `color-coverage.md` and the tests.

## What `<color>` is

`<color>` is a value type used by `color`, `background-color`, `border-color`, and many
other properties. A value is one of:

- an **absolute color** — a fixed point in a color space (named, hex, the color functions,
  `transparent`);
- a **context-dependent color** — resolves against the element's context, with no fixed
  value of its own (`currentcolor`, `<system-color>`);
- a **CSS-wide keyword** (`inherit` / `initial` / …).

## Absolute colors

### Named + transparent
- `<named-color>`: ~148 keywords (`rebeccapurple`, `tomato`, …), sRGB.
- `transparent` = `rgb(0 0 0 / 0)`.

### Hex
`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` (3 / 4 / 6 / 8 digits), sRGB.

### sRGB functions
- `rgb()` / `rgba()` — modern `rgb(R G B [/ A])` and legacy comma `rgb(r, g, b)` /
  `rgba(r, g, b, a)`. R/G/B as `<number>` (0–255) or `<percentage>`; `none` allowed (modern).
- `hsl()` / `hsla()` — `hsl(H S L [/ A])`; H is `<hue>`, S/L `<percentage>` (or `<number>`
  in modern).
- `hwb()` — `hwb(H W B [/ A])`.

### CIELAB + Oklab functions
- `lab(L a b [/ A])`, `lch(L C H [/ A])`
- `oklab(L a b [/ A])`, `oklch(L C H [/ A])`
- L is `<percentage>` or `<number>`; `none` allowed.

### `color()` — predefined + custom spaces
`color(<colorspace> <c1> <c2> <c3> [/ A])`. Predefined RGB spaces: `srgb`, `srgb-linear`,
`display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`. XYZ: `xyz`, `xyz-d50`, `xyz-d65`.
Components are `<number>` | `<percentage>` | `none`.

### Alpha
`<alpha-value>` = `<number>` (0–1) or `<percentage>`. Modern functions take `/ A`; legacy
`rgba()` / `hsla()` take a 4th comma value.

## Context-dependent colors

- `currentcolor` — the computed value of the element's `color` property.
- `<system-color>`:
  - **Current (CSS Color 4):** `Canvas`, `CanvasText`, `LinkText`, `VisitedText`,
    `ActiveText`, `ButtonFace`, `ButtonText`, `ButtonBorder`, `Field`, `FieldText`,
    `Highlight`, `HighlightText`, `SelectedItem`, `SelectedItemText`, `Mark`, `MarkText`,
    `GrayText`, `AccentColor`, `AccentColorText`.
  - **Deprecated (Appendix), still valid:** `ActiveBorder`, `ActiveCaption`, `AppWorkspace`,
    `Background`, `ButtonHighlight`, `ButtonShadow`, `CaptionText`, `InactiveBorder`,
    `InactiveCaption`, `InactiveCaptionText`, `InfoBackground`, `InfoText`, `Menu`,
    `MenuText`, `Scrollbar`, `ThreeD*`, `Window`, `WindowFrame`, `WindowText`.

## Functional notations

- `calc()` / `min()` / `max()` / `clamp()` in any numeric component; `var()` and `env()`
  anywhere a value is expected.
- **CSS Color 5 (check level/support):** `color-mix(in <space>, C1 [p1], C2 [p2])`;
  relative color syntax (`rgb(from C r g b)`, `oklch(from C l c h)`, …); `light-dark(C1, C2)`;
  `contrast-color()` (newer, unstable).

## Keywords

CSS-wide keywords valid on any property taking `<color>`: `inherit`, `initial`, `unset`,
`revert`, `revert-layer`.

## Canonical facts (the `color` property)

| initial | inherited | computed value | animation type |
| --- | --- | --- | --- |
| `canvastext` (UA-dependent) | yes | computed color | by computed value (color) |

Other properties that accept `<color>` carry their own initial/inherited values; the row
above is for the `color` property itself.

## Notes

- `<hue>` (in `hsl`/`hwb`/`lch`/`oklch`) is `<angle>` | `<number>` (degrees).
- A value may lie outside a given rendering space's gamut; gamut mapping is the renderer's
  concern, not a validity constraint.
- `none` components (modern syntax) are valid and participate specially in interpolation.

## Sources

- CSS Color Module Level 4: https://www.w3.org/TR/css-color-4/
- CSS Color Module Level 5 (`color-mix`, relative color, `contrast-color`): https://www.w3.org/TR/css-color-5/
- MDN `<color>`: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
- MDN `<system-color>`: https://developer.mozilla.org/en-US/docs/Web/CSS/system-color
