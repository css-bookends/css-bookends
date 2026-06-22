# shadows value surface

The valid CSS value surface for the three shadow-producing features:

- the **`box-shadow`** property (CSS Backgrounds & Borders 3),
- the **`text-shadow`** property (CSS Text Decoration 3/4), and
- the **`drop-shadow()`** filter function (Filter Effects 1), used inside `filter` /
  `backdrop-filter`.

Implementation-agnostic; what any book covers is tracked in that book's coverage doc and
tests. This doc is the map of what CSS allows, exhaustively, with the **differences**
between the three made explicit.

All three describe the same conceptual thing (an offset, optionally blurred, optionally
coloured shadow), but they accept **different value surfaces**. The short version:

- `box-shadow` is the richest: it has spread, `inset`, and a comma list.
- `text-shadow` drops spread and `inset` (offsets + optional blur only); it is **inherited**.
- `drop-shadow()` drops spread, `inset`, and the inner comma list (one shadow per call);
  it shadows the element's **alpha shape**, not a box.

---

## 1. box-shadow

### Grammar

```
box-shadow = none | <shadow>#

<shadow> = inset? && <length>{2,4} && <color>?
```

`&&` means the three components (the optional `inset` keyword, the 2-to-4 lengths, the
optional `<color>`) may appear in **any order**, except that the lengths themselves must
appear as a contiguous, ordered run (offset-x, then offset-y, then blur, then spread).
`#` marks the property value as a **comma-separated list** of one or more `<shadow>`.

MDN expresses the same surface expanded:

```
box-shadow = <spread-shadow>#

<spread-shadow> =
  <'box-shadow-color'>?                                          &&
  [ [ none | <length>{2} ] [ <length [0,∞]> <length>? ]? ]?      &&
  [ outset | inset ]?
```

### The length slots (positional order)

The `<length>{2,4}` run is interpreted **positionally**:

| # | Slot          | Required | Negative allowed? |
| - | ------------- | -------- | ----------------- |
| 1 | **offset-x**  | yes      | yes (negative = shadow to the left)  |
| 2 | **offset-y**  | yes      | yes (negative = shadow above)        |
| 3 | **blur-radius**   | no (default `0`) | **NO — non-negative** |
| 4 | **spread-radius** | no (default `0`) | **yes (negative shrinks the shadow)** |

- **blur-radius** (`<length [0,∞]>`): if `0`, the shadow edge is sharp; larger values blur
  it more. Spec wording: *"A negative value is not allowed."*
- **spread-radius**: a positive value expands the shadow shape in every direction by that
  amount; a **negative value shrinks it**. This negative-allowed slot is the key spread
  distinction from `text-shadow`/`drop-shadow()`, which have no spread at all.

### `inset` keyword

`inset?` — when present, the shadow is drawn **inside** the element's border box (an inner
shadow), rather than as an outer drop shadow. Omitting it (or, per MDN's expanded grammar,
writing `outset`) gives the default outer shadow. **`inset` is unique to `box-shadow`** —
neither `text-shadow` nor `drop-shadow()` has it.

### `<color>`

`<color>?` — optional. When omitted, the shadow uses **`currentColor`** (the element's
`color`). Full `<color>` surface per CSS Color (named colors, `#hex`, `rgb()`/`rgba()`,
`hsl()`, `hwb()`, `lab()`/`lch()`, `oklab()`/`oklch()`, `color()`, `color-mix()`,
`currentColor`, `transparent`, etc.).

### Comma-separated list & stacking order

`<shadow>#` accepts multiple shadows separated by commas. **Painting order: the first
shadow in the list is on top, each subsequent shadow is painted behind the previous one**
(front-to-back). Same ordering convention as `text-shadow`.

### Canonical facts

| initial | inherited | computed value | animation type |
| --- | --- | --- | --- |
| `none` | **no** | `none`, or a list where every length is made absolute and every color computed | by computed value (a shadow list) |

Animation notes: shadows interpolate component-wise (offsets, blur, spread, color). If two
paired shadows differ in their `inset`-ness, the list is **not** interpolable. Shorter
lists are padded with transparent zero-length shadows to match the longer list.

---

## 2. text-shadow

### Grammar

```
text-shadow = none | <shadow-t>#

<shadow-t> = <color>? && <length>{2,3}
```

(CSS Text Decoration 3 writes the same surface inline as
`none | [ <color>? && <length>{2,3} ]#`.) Again `&&` = any order between the optional color
and the length run; `#` = comma-separated list.

### The length slots (positional order)

| # | Slot         | Required | Negative allowed? |
| - | ------------ | -------- | ----------------- |
| 1 | **offset-x** | yes      | yes |
| 2 | **offset-y** | yes      | yes |
| 3 | **blur-radius**  | no (default `0`) | **NO — non-negative** |

- Values are *"interpreted as for `box-shadow`"* for the slots that exist.
- **No spread, no `inset`.** Spec wording (Text Decoration): *"spread values and the
  `inset` keyword are not allowed."* This is the core difference from `box-shadow`: only
  `{2,3}` lengths (offsets + optional blur), never the 4th spread slot.
- blur-radius is non-negative, same constraint as `box-shadow`.

### `<color>`

`<color>?` — optional; defaults to **`currentColor`** when omitted. Same CSS Color surface
as above.

### Comma-separated list & stacking order

`<shadow-t>#` — multiple comma-separated shadows; **first listed is on top** (same
front-to-back order as `box-shadow`). Each layer shadows the element's text and its text
decorations composited together.

### Canonical facts

| initial | inherited | computed value | animation type |
| --- | --- | --- | --- |
| `none` | **yes** | `none`, or a list, each item being three absolute lengths plus a computed color | as shadow list |

The standout canonical difference: **`text-shadow` is inherited; `box-shadow` is not.**

---

## 3. drop-shadow() filter function

### Grammar

```
<drop-shadow()> = drop-shadow( [ <color>? && <length>{2,3} ] )
```

Used as a `<filter-function>` value inside the **`filter`** and **`backdrop-filter`**
properties. `&&` = color and lengths in any order inside the parens.

### The length slots (positional order)

| # | Slot                 | Required | Negative allowed? |
| - | -------------------- | -------- | ----------------- |
| 1 | **offset-x**         | yes      | yes |
| 2 | **offset-y**         | yes      | yes |
| 3 | **blur / std-deviation** | no (default `0`) | **NO — non-negative** |

- The optional third length is the **standard deviation** of the Gaussian blur (the spec
  notes this is conceptually the blur amount; *"Negative values are not allowed."*).
- **No spread, no `inset`, no inner comma list.** Spec wording: *"Spread values or multiple
  shadows are not accepted for this level of the specification."* A single `drop-shadow()`
  produces exactly one shadow; you stack effects by writing multiple `drop-shadow(...)`
  functions in the `filter` value, not by commas inside one call.

### `<color>`

`<color>?` — optional. When omitted the shadow color is taken from the element's **`color`
property** (i.e. `currentColor`). Same CSS Color surface as above.

### Shape behavior (vs box-shadow)

A `drop-shadow()` is a blurred, offset version of the **input image's alpha mask**, drawn
in the shadow color and composited beneath the image. It therefore traces the element's
actual **alpha shape** (transparency outline), not a rectangular border box — this is the
defining difference from `box-shadow`, which always shadows a box. It corresponds to the
SVG `feDropShadow` filter primitive.

### Canonical facts

`drop-shadow()` is a function, not a property, so it has no own initial/inherited row; its
host properties carry those (`filter` and `backdrop-filter` both: initial `none`, not
inherited, animation type per the filter-function list). The function value itself has no
spread, no `inset`, and no inner list.

---

## 4. Shared value-surface details (all three)

### `<length>`

Every length slot in all three features accepts the full `<length>` surface:

- Absolute units: `px`, `cm`, `mm`, `in`, `pt`, `pc`, `Q`.
- Font-relative units: `em`, `rem`, `ex`, `rex`, `cap`, `rcap`, `ch`, `rch`, `ic`, `ric`,
  `lh`, `rlh`.
- Viewport-relative units: `vw`, `vh`, `vi`, `vb`, `vmin`, `vmax`, and the `sv*`/`lv*`/`dv*`
  variants (`svw`, `lvh`, `dvmin`, …).
- `0` (unitless zero is a valid length).
- **Functional / substitution:** `calc()`, `min()`, `max()`, `clamp()` (and other CSS math
  functions), plus `var()` and `env()` are valid anywhere a `<length>` is.

The **blur slot** in all three is range-restricted to `<length [0,∞]>` (non-negative). A
math function that resolves to a negative value in that slot is clamped to `0` rather than
making the declaration invalid. Only `box-shadow`'s **spread** slot accepts negative
lengths; offsets accept negatives everywhere.

### `<color>`

The `<color>?` slot in all three references the CSS Color module: named colors, `#hex`,
`rgb()`/`rgba()`, `hsl()`/`hsla()`, `hwb()`, `lab()`/`lch()`, `oklab()`/`oklch()`,
`color()`, `color-mix()`, the keywords `currentColor` and `transparent`, and the system
colors. Omitting the color defaults to `currentColor` in every case.

### CSS-wide keywords

As properties, `box-shadow` and `text-shadow` accept the CSS-wide keywords as their **whole
value**: `inherit`, `initial`, `unset`, `revert`, `revert-layer`. (These cannot appear
inside a single `<shadow>`/`<shadow-t>` entry; they replace the entire property value.)
`drop-shadow()` is a function value, so CSS-wide keywords apply to its host property
(`filter` / `backdrop-filter`), not to the function itself.

---

## 5. Comparison table

| Feature                | offsets (x, y) | blur (non-neg) | spread | `inset` | `<color>?` default | comma list | inherited |
| ---------------------- | -------------- | -------------- | ------ | ------- | ------------------ | ---------- | --------- |
| **box-shadow**         | yes (signed)   | yes            | **yes** (signed) | **yes** | `currentColor` | **yes** (first on top) | **no**  |
| **text-shadow**        | yes (signed)   | yes            | no     | no      | `currentColor`     | yes (first on top) | **yes** |
| **drop-shadow()**      | yes (signed)   | yes (std-dev)  | no     | no      | `currentColor`     | **no** (one per call) | n/a (function) |

Length count, restated: `box-shadow` = `<length>{2,4}` (offsets + blur + spread);
`text-shadow` = `<length>{2,3}` (offsets + blur); `drop-shadow()` = `<length>{2,3}`
(offsets + blur). The blur slot is non-negative in all three; only `box-shadow`'s 4th
(spread) slot accepts negatives. `drop-shadow()` additionally shadows the element's **alpha
shape** rather than a box.

---

## Sources

- CSS Backgrounds and Borders Module Level 3 — `box-shadow` (§6.1 Drop Shadows):
  https://www.w3.org/TR/css-backgrounds-3/#box-shadow
  (Editor's Draft: https://drafts.csswg.org/css-backgrounds-3/#box-shadow)
- CSS Text Decoration Module Level 3 — `text-shadow`:
  https://www.w3.org/TR/css-text-decor-3/#text-shadow-property
- CSS Text Decoration Module Level 4 — `text-shadow`:
  https://www.w3.org/TR/css-text-decor-4/#text-shadow-property
- Filter Effects Module Level 1 — `drop-shadow()`:
  https://www.w3.org/TR/filter-effects-1/#funcdef-filter-drop-shadow
- CSS Color Module Level 4 (`<color>` surface):
  https://www.w3.org/TR/css-color-4/
- CSS Values and Units Module Level 4 (`<length>`, math functions, CSS-wide keywords):
  https://www.w3.org/TR/css-values-4/
- MDN — box-shadow: https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow
- MDN — text-shadow: https://developer.mozilla.org/en-US/docs/Web/CSS/text-shadow
- MDN — drop-shadow():
  https://developer.mozilla.org/en-US/docs/Web/CSS/filter-function/drop-shadow
