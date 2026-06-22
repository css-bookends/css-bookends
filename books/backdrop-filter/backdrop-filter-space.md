# backdrop-filter value surface

The valid CSS value surface for the `backdrop-filter` property per the spec, including the
`<filter-function>` value surface it shares with `filter`. Implementation-agnostic; what a
book covers is tracked in its own coverage doc and tests.

`backdrop-filter` filters the area *behind* the element (the backdrop), so the effect is
visible only where the element is wholly or partly transparent. It is defined in Filter
Effects Level 2; the `<filter-function>` value surface is defined in Filter Effects Level 1
and is identical to the one `filter` uses.

## Grammar

```
backdrop-filter = none | <filter-value-list>

<filter-value-list> = [ <filter-function> | <url> ]+

<filter-function> =
    <blur()>       |
    <brightness()> |
    <contrast()>   |
    <drop-shadow()> |
    <grayscale()>  |
    <hue-rotate()> |
    <invert()>     |
    <opacity()>    |
    <saturate()>   |
    <sepia()>
```

- A value is either the keyword `none`, or an **ordered, space-separated list of one or
  more** items, each item being a `<filter-function>` or a `<url>`. The `+` multiplier
  means at least one; there is no upper bound and no commas between items.
- **`<url>`** references an SVG `<filter>` element (e.g. `url(#myfilter)` or
  `url(filters.svg#f)`). The referenced filter supplies the filter operation; this is the
  full SVG filter-primitive surface, not one of the short filter functions.
- Functions and URLs may be **mixed and repeated** in one list (e.g.
  `url(#f) blur(4px) saturate(150%)`).

### Vendor-prefixed alias (compatibility, not spec)

`-webkit-backdrop-filter` is a vendor-prefixed alias with the same value grammar. It is a
compatibility surface only and is not part of the specification; the unprefixed
`backdrop-filter` is the spec property.

## Filter functions

Shared with `filter`. The amount-based functions take a `<number>` or `<percentage>` where
`1` = `100%`. **Negative values are invalid** (a parse/validity error) for every function
below, including the `blur()` length and the `drop-shadow()` blur. Where noted, the amount
is **clamped above** at `1` (`100%`) for rendering, but values over `100%` are still valid
input.

| function | grammar | omitted-arg default | range / clamping | units |
| --- | --- | --- | --- | --- |
| `blur()` | `blur( <length>? )` | `0px` (no blur) | non-negative; negative is invalid; no upper bound | `<length>` only — **no percentage** |
| `brightness()` | `brightness( [ <number> \| <percentage> ]? )` | `1` (`100%`) | non-negative; **values over `100%` allowed** (not clamped above) | `<number>` or `<percentage>` |
| `contrast()` | `contrast( [ <number> \| <percentage> ]? )` | `1` (`100%`) | non-negative; **values over `100%` allowed** (not clamped above) | `<number>` or `<percentage>` |
| `drop-shadow()` | `drop-shadow( <color>? && <length>{2,3} )` | offsets/blur default `0`; color defaults to `currentcolor` | 2 or 3 lengths: offset-x, offset-y, optional blur; **blur cannot be negative**; **no spread, no inset** | `<length>` offsets + optional `<color>` |
| `grayscale()` | `grayscale( [ <number> \| <percentage> ]? )` | `1` (`100%`) | non-negative; **clamped above to `1`** | `<number>` or `<percentage>` |
| `hue-rotate()` | `hue-rotate( [ <angle> \| <zero> ]? )` | `0deg` | any angle; **not normalized** (so animation past `360deg` is allowed) | `<angle>` (`deg`, `grad`, `rad`, `turn`) or bare `0` |
| `invert()` | `invert( [ <number> \| <percentage> ]? )` | `1` (`100%`) | non-negative; **clamped above to `1`** | `<number>` or `<percentage>` |
| `opacity()` | `opacity( [ <number> \| <percentage> ]? )` | `1` (`100%`) | non-negative; **clamped above to `1`** | `<number>` or `<percentage>` |
| `saturate()` | `saturate( [ <number> \| <percentage> ]? )` | `1` (`100%`) | non-negative; **values over `100%` allowed** (not clamped above) | `<number>` or `<percentage>` |
| `sepia()` | `sepia( [ <number> \| <percentage> ]? )` | `1` (`100%`) | non-negative; **clamped above to `1`** | `<number>` or `<percentage>` |

Notes on individual functions:

- **`blur()`** — takes a `<length>` only; percentages are not accepted. Omitted argument is
  treated as `0px`.
- **`brightness()` / `contrast()` / `saturate()`** — the three "unbounded-above" functions:
  `1` (`100%`) is the no-op identity, `0` collapses the channel (black / grey / grayscale),
  and values above `1`/`100%` are valid and exceed the identity.
- **`drop-shadow()`** — grammar is `<color>? && <length>{2,3}` (the `&&` means the color and
  the length-list may appear in either order, each at most once). The lengths are
  offset-x and offset-y (required) plus an optional blur radius. It deliberately omits
  `box-shadow`'s spread radius and `inset` keyword. Filter functions placed *after*
  `drop-shadow()` in the list apply to the shadow as well.
- **`hue-rotate()`** — accepts an `<angle>` or the bare `<zero>` literal; the spec forbids
  normalizing the value so that animations beyond `360deg` remain meaningful. Omitted
  argument is `0deg` (no rotation).
- **`grayscale()` / `invert()` / `opacity()` / `sepia()`** — `0` (`0%`) is the no-op for
  grayscale/invert/sepia and full transparency for opacity. These are clamped above to `1`
  for rendering, though over-`100%` input is still valid.

## Keywords

- **`none`** — no filter is applied to the backdrop (the initial value).
- **CSS-wide keywords**, valid on the property: `inherit`, `initial`, `unset`, `revert`,
  `revert-layer`.

## Functional notations

- `<number>`, `<percentage>`, `<length>`, and `<angle>` arguments accept the standard math
  functions (`calc()`, `min()`, `max()`, `clamp()`) and substitution functions (`var()`,
  `env()`) wherever a value of that type is expected.
- The `<url>` item is a plain URL reference to an SVG `<filter>`; it is not a math context.

## Canonical facts

| initial | inherited | applies to | computed value | animation type |
| --- | --- | --- | --- | --- |
| `none` | no | all elements (in SVG: container elements without `<defs>`, and graphics elements) | as specified | by computed value, as a **filter function list** (per Filter Effects 1 §14) |

- **Percentages:** n/a at the property level (percentages appear only inside the amount
  functions).
- **Animation / interpolation:** when two filter lists have the **same sequence of
  functions**, each function interpolates by its own rule (each function defines an
  interpolation identity, e.g. `blur` → `0px`, `brightness` → `1`, `grayscale`/`invert`/
  `sepia`/`drop-shadow` color → `0`/`transparent`). Mismatched lists or any `<url>` in
  either list fall back to discrete animation.
- `backdrop-filter` (when not `none` and not on the document root) establishes a **stacking
  context** and a **containing block** for fixed/absolutely positioned descendants, like
  `filter`.

## Notes

- **`backdrop-filter` vs `filter`.** `filter` processes the element's *own* rendering;
  `backdrop-filter` processes the **backdrop** — everything painted behind the element
  within the backdrop root. Both share the identical `<filter-value-list>` /
  `<filter-function>` value surface defined in Filter Effects 1.
- **Order is significant.** The functions/URLs in a list are applied **in declaration
  order**; reordering changes the result (e.g. `blur()` then `drop-shadow()` differs from
  the reverse).
- **`url()` SVG filters.** A `<url>` resolves to an SVG `<filter>` element, exposing the
  full SVG filter-primitive pipeline as a single list item; this is a much larger surface
  than the ten shorthand filter functions and is the spec-sanctioned way to express
  arbitrary filters.
- **Visibility constraint (behavioral, not a validity constraint).** The backdrop effect is
  only visible where the element/its background is transparent or semi-transparent; this
  affects what is seen, not which values are valid.

## Sources

- W3C Filter Effects Module Level 2 (the `backdrop-filter` property): https://www.w3.org/TR/filter-effects-2/
  - Editor's Draft (current): https://drafts.csswg.org/filter-effects-2/
- W3C Filter Effects Module Level 1 (the `<filter-function>` definitions, ranges, clamping): https://www.w3.org/TR/filter-effects-1/
  - Editor's Draft (current): https://drafts.csswg.org/filter-effects-1/
- MDN `backdrop-filter`: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
- MDN `filter`: https://developer.mozilla.org/en-US/docs/Web/CSS/filter
- MDN `<filter-function>`: https://developer.mozilla.org/en-US/docs/Web/CSS/filter-function
