# The per-property helper surface (bookends)

This is the bookends-layer companion to the calipers input surface
(`lexicons/calipers/surface.md`). calipers types the value TYPES; this doc maps
which CSS PROPERTIES get a dedicated, pre-constrained helper, and under what
constraint. Each helper binds a calipers primitive to one CSS property, applies
that property's bound and keyword companions, and types its `.css()` output
against the csstype `Property.X` value type.

Two engine tables back the helpers: single-value rows (`spec.ts`) and composite
helpers (`multi.ts`). Each property ships as one book (`@css-bookends/<property>`)
that wraps the engine helper through `publishBook`. Every entry below is
source-derived; nothing is inferred.

## Single-value helpers (`spec.ts`, 21 rows)

### Opacity family: float `[0, 1]`, no keyword

| CSS property | Helper | Constraint | csstype key |
| --- | --- | --- | --- |
| `opacity` | `opacity` | float, `[0, 1]` | `Opacity` |
| `fill-opacity` | `fillOpacity` | float, `[0, 1]` | `FillOpacity` |
| `stroke-opacity` | `strokeOpacity` | float, `[0, 1]` | `StrokeOpacity` |
| `stop-opacity` | `stopOpacity` | float, `[0, 1]` | `StopOpacity` |
| `flood-opacity` | `floodOpacity` | float, `[0, 1]` | `FloodOpacity` |
| `shape-image-threshold` | `shapeImageThreshold` | float, `[0, 1]` | `ShapeImageThreshold` |

### Other floats, `>= 0`

| CSS property | Helper | Constraint | csstype key |
| --- | --- | --- | --- |
| `line-height` | `lineHeight` | float, `min 0`; keyword `normal` | `LineHeight` |
| `flex-grow` | `flexGrow` | float, `min 0` | `FlexGrow` |
| `flex-shrink` | `flexShrink` | float, `min 0` | `FlexShrink` |
| `animation-iteration-count` | `animationIterationCount` | float, `min 0`; keyword `infinite` | `AnimationIterationCount` |
| `font-size-adjust` | `fontSizeAdjust` | float, `min 0`; keywords `none`, `from-font` | `FontSizeAdjust` |
| `zoom` | `zoom` | float, `min 0` | `Zoom` |

### Floats with a specific range

| CSS property | Helper | Constraint | csstype key |
| --- | --- | --- | --- |
| `font-weight` | `fontWeight` | float, `[1, 1000]`; keywords `normal`, `bold`, `lighter`, `bolder` | `FontWeight` |
| `stroke-miterlimit` | `strokeMiterlimit` | float, `min 1` | `StrokeMiterlimit` |

### Integers, unbounded (negatives allowed)

| CSS property | Helper | Constraint | csstype key |
| --- | --- | --- | --- |
| `z-index` | `zIndex` | int, unbounded; keyword `auto` | `ZIndex` |
| `order` | `order` | int, unbounded | `Order` |
| `math-depth` | `mathDepth` | int, unbounded; keyword `auto-add` | `MathDepth` |

### Integers, `>= 1`

| CSS property | Helper | Constraint | csstype key |
| --- | --- | --- | --- |
| `column-count` | `columnCount` | int, `min 1`; keyword `auto` | `ColumnCount` |
| `orphans` | `orphans` | int, `min 1` | `Orphans` |
| `widows` | `widows` | int, `min 1` | `Widows` |
| `-webkit-line-clamp` | `lineClamp` | int, `min 1`; keyword `none` | `WebkitLineClamp` |

The single-value out-of-range policy is configurable per book / per call:
`'throw'` (strict, the default) or `'clamp'` (looser, clamps one-directional to
whichever bound exists). Clamp fixes range, not integer-ness, so a non-integer on
an int row still throws.

## Composite helpers (`multi.ts`, 18 helpers)

These take a composite value (ident-plus-integer pairs, tri-state grid lines,
one-to-three factors, edge-quad lists), so they do not fit the single-scalar
table. Numeric pieces still go through `i()` / `f()` and validate eagerly.

### Counters: `<custom-ident> <integer>?` pairs or `none`

| CSS property | Helper | Constraint | csstype key |
| --- | --- | --- | --- |
| `counter-reset` | `counterReset` | int per pair (any); omitted integer defaults to `0`; keyword `none` | `CounterReset` |
| `counter-increment` | `counterIncrement` | int per pair (any); omitted integer defaults to `1`; keyword `none` | `CounterIncrement` |
| `counter-set` | `counterSet` | int per pair (any); omitted integer defaults to `0`; keyword `none` | `CounterSet` |

### Grid lines: integer line, `span N`, named line, or `auto`

| CSS property | Helper | Constraint | csstype key |
| --- | --- | --- | --- |
| `grid-row-start` | `gridRowStart` | nonzero int line (negatives count from end), or `span(n >= 1)`, or `<custom-ident>`, or `auto` | `GridRowStart` |
| `grid-row-end` | `gridRowEnd` | same as above | `GridRowEnd` |
| `grid-column-start` | `gridColumnStart` | same as above | `GridColumnStart` |
| `grid-column-end` | `gridColumnEnd` | same as above | `GridColumnEnd` |

The `span N` value is built with the `span(count, name?)` factory (`count`
hardened to int `>= 1`).

### Scale and tab-size

| CSS property | Helper | Constraint | csstype key |
| --- | --- | --- | --- |
| `scale` | `scale` | one to three float factors (negatives allowed; percentage form out of scope), or keyword `none` | `Scale` |
| `tab-size` | `tabSize` | float `>= 0`, or an `IMeasurement` length (percentage form out of scope) | `TabSize` |

### Border-image edge quads: 1-to-4 entries

| CSS property | Helper | Constraint | csstype key |
| --- | --- | --- | --- |
| `border-image-width` | `borderImageWidth` | 1-4 entries: float `>= 0`, `IMeasurement`, or `auto` | `BorderImageWidth` |
| `border-image-outset` | `borderImageOutset` | 1-4 entries: float `>= 0` or `IMeasurement` | `BorderImageOutset` |
| `border-image-slice` | `borderImageSlice` | 1-4 float `>= 0` entries, optional trailing `fill` (percentage form out of scope) | `BorderImageSlice` |

### Mask-border edge quads: 1-to-4 entries

| CSS property | Helper | Constraint | csstype key |
| --- | --- | --- | --- |
| `mask-border-width` | `maskBorderWidth` | 1-4 entries: float `>= 0`, `IMeasurement`, or `auto` | `MaskBorderWidth` |
| `mask-border-outset` | `maskBorderOutset` | 1-4 entries: float `>= 0` or `IMeasurement` | `MaskBorderOutset` |
| `mask-border-slice` | `maskBorderSlice` | 1-4 float `>= 0` entries, optional trailing `fill` (percentage form out of scope) | `MaskBorderSlice` |

### Stroke

| CSS property | Helper | Constraint | csstype key |
| --- | --- | --- | --- |
| `stroke-width` | `strokeWidth` | single float `>= 0` (SVG user units) or an `IMeasurement` (percentage form out of scope) | `StrokeWidth` |
| `stroke-dashoffset` | `strokeDashoffset` | single float (any; SVG user units) or an `IMeasurement` (percentage form out of scope) | `StrokeDashoffset` |
| `stroke-dasharray` | `strokeDasharray` | keyword `none`, or a list of float `>= 0` / `IMeasurement` entries (percentage form out of scope) | `StrokeDasharray` |

## Out of scope / not covered

Intentionally not a typed helper, per the catalogue, the MDN sweep, and the spec
comments:

- **Keyword-only properties** (no number at all): `animation-composition`,
  `clip-rule`, `dominant-baseline`, `fill`, `font-optical-sizing`, `paint-order`,
  `reading-flow`, `scrollbar-color`, `speak-as`, `vector-effect`.
- **Length / percentage / resolution-only properties** that look number-bearing
  but require a unit (so they are `m()`'s domain, not a unitless helper): `cx`,
  `cy`, `x`, `y`, `r` (`<length-percentage>` in CSS form), `column-width`,
  `-webkit-text-stroke-width`, `text-decoration-thickness`, `image-resolution`,
  `font-stretch` / `font-width`, `baseline-shift`, `column-height`.
- **The percentage / length alternative** of a number-form helper: pass it as an
  `IMeasurement` carrying `%`, never a bare number (`tab-size`, the border-image /
  mask-border / stroke helpers).
- **`reading-order`**: a real unitless-integer property (same primitive as
  `order` / `z-index`), blocked on tooling, not coverage. csstype has no
  `Property.ReadingOrder` key (verified against the installed csstype 3.2.x), so a
  typed helper cannot render against it yet. Add it once csstype ships the key.
- **`font-feature-settings`, `font-variation-settings`, `max-lines`,
  `hyphenate-limit-chars`, `initial-letter`, `-webkit-box-ordinal-group`,
  `-webkit-box-flex`**: catalogued as number-bearing but not exposed as helpers
  in the current `spec.ts` / `multi.ts` tables (tag-value or multi-shape forms,
  not the one-scalar shape).
- **Transform / value-grammar functions** (`scale()`, `scaleX()`, `matrix()`,
  ...): bare-number functions, not properties; the `scale` PROPERTY is covered,
  the functions are not.

## Sources

- `packages/css-value-core/src/spec.ts`, `src/multi.ts`, `src/index.ts`
- `lexicons/calipers/docs/css-number-value-types.md`,
  `lexicons/calipers/docs/css-number-value-types-sweep.md`
- `lexicons/calipers/surface.md` (the value-type companion)
