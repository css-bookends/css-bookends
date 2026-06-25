# MDN property sweep: unitless-number properties (belt-and-suspenders)

This is the belt-and-suspenders MDN sweep flagged as still-open in
[css-number-value-types.md](./css-number-value-types.md). The goal: walk the full
MDN CSS properties reference index and find ANY property that accepts a bare
unitless `<number>` or `<integer>` and is NOT already catalogued there.

Out of scope, by the same rules as the main catalogue: keyword-only properties,
lengths, angles, times, frequencies, resolutions, the `fr` flex unit, and
percentages. The boundary types `<ratio>` and `<alpha-value>` are already handled
and are not re-listed.

## Result: the catalogue has one gap

The existing catalogue is nearly complete. The walk found exactly one property
that accepts a bare unitless number and is not in it: `reading-order`. Everything
else in the index either carries no number, or only carries a number-plus-unit
value (`m()`'s domain), or is already in the catalogue (directly or via a
shorthand whose longhands are listed).

`reading-order` is a recent CSS Display Level 4 property. It is the per-child
companion to `reading-flow: source-order`, and it behaves like `order`: a bare
signed `<integer>`, initial `0`. It maps to the same primitive as `order` and
`z-index` (integer `i()`, unbounded, negatives allowed).

## Newly-found property

| Property | Kind (int/float) | Range or constraint | Initial | Keyword companions | MDN URL |
| --- | --- | --- | --- | --- | --- |
| `reading-order` | integer | any; negatives allowed | `0` | none (bare `<integer>` only) | https://developer.mozilla.org/en-US/docs/Web/CSS/reading-order |

Primitive mapping: same group as `order`, `z-index`, `math-depth`, and the
`counter-*` properties. Integer `i()`, unbounded, negatives allowed. No keyword,
no percentage.

## Candidates checked and ruled out

Each of these was a plausible number-bearing candidate from the index. Each was
opened on MDN and confirmed to NOT admit a bare unitless number.

SVG geometry properties (CSS form requires explicit units, unlike the SVG
attribute form):

- `cx`, `cy`, `x`, `y`: `<length-percentage>` only. Initial `0`. A bare number is
  invalid CSS, even though the SVG attribute accepts user units.
- `r`: `<length-percentage>`, non-negative. Same unit requirement.

Length, percentage, resolution, or keyword only (no bare number):

- `font-stretch` and `font-width`: `<percentage>` plus keywords, no bare number.
  (`font-width` has no standalone MDN page; `font-stretch` is the documented page.)
- `column-width`, `-webkit-text-stroke-width`, `text-decoration-thickness`:
  `<length>` (or `<line-width>` keywords), no bare number.
- `image-resolution`: `<resolution>` plus `from-image` / `snap`. Initial `1dppx`.

Keyword-only (no number at all):

- `animation-composition`: `replace` / `add` / `accumulate`.
- `clip-rule`: `nonzero` / `evenodd`.
- `dominant-baseline`: `auto` and baseline keywords.
- `fill`: paint values (`<color>`, `<url>`, `none`, context keywords).
- `font-optical-sizing`: `auto` / `none`.
- `paint-order`: `normal` / `fill` / `stroke` / `markers`.
- `reading-flow`: `normal` and the `flex-*` / `grid-*` / `source-order` keywords.
- `scrollbar-color`: `auto` or two `<color>` values.
- `speak-as`: pronunciation keywords.
- `vector-effect`: `none` / `non-scaling-stroke` and at-risk keywords.

No standalone MDN page (not a documented CSS property):

- `baseline-shift`: 404 on MDN. Exists as an SVG attribute, not a documented CSS
  property page.
- `column-height`: 404 on MDN. Listed in the index but no page to confirm a value
  grammar.

## Shorthands of already-catalogued longhands (not separate findings)

These shorthands do carry a bare number, but only because their longhands are
already in the main catalogue. They are derivative, not new:

- `flex`: the `flex-grow` and `flex-shrink` portions are `<number [0,∞]>`. Both
  longhands are catalogued.
- `grid-row` and `grid-column`: `<integer>` line numbers (nonzero, negatives
  allowed) and `span <integer>` (>= 1). The `grid-*-start` / `grid-*-end`
  longhands are catalogued.

## Completeness statement

With `reading-order` added, the catalogue covers every unitless-number property
found by a full walk of the MDN CSS properties reference index as of June 2026.
Caveat: the index includes experimental and recently-added properties whose value
grammars can change. The two index entries with no MDN page (`baseline-shift`,
`column-height`) could not be confirmed either way. If either grows a documented
bare-number value later, it would need a re-check. The stable, documented surface
is complete apart from the single `reading-order` gap.

## Sources

Index walked:

- MDN CSS properties reference index: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference

Property pages opened and verified (one per property):

- `reading-order` (the gap): https://developer.mozilla.org/en-US/docs/Web/CSS/reading-order
- `reading-flow`: https://developer.mozilla.org/en-US/docs/Web/CSS/reading-flow
- `cx`: https://developer.mozilla.org/en-US/docs/Web/CSS/cx
- `r`: https://developer.mozilla.org/en-US/docs/Web/CSS/r
- `x`: https://developer.mozilla.org/en-US/docs/Web/CSS/x
- `flex`: https://developer.mozilla.org/en-US/docs/Web/CSS/flex
- `grid-row`: https://developer.mozilla.org/en-US/docs/Web/CSS/grid-row
- `font-stretch`: https://developer.mozilla.org/en-US/docs/Web/CSS/font-stretch
- `column-width`: https://developer.mozilla.org/en-US/docs/Web/CSS/column-width
- `text-decoration-thickness`: https://developer.mozilla.org/en-US/docs/Web/CSS/text-decoration-thickness
- `-webkit-text-stroke-width`: https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-text-stroke-width
- `image-resolution`: https://developer.mozilla.org/en-US/docs/Web/CSS/image-resolution
- `animation-composition`: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-composition
- `clip-rule`: https://developer.mozilla.org/en-US/docs/Web/CSS/clip-rule
- `fill`: https://developer.mozilla.org/en-US/docs/Web/CSS/fill
- `font-optical-sizing`: https://developer.mozilla.org/en-US/docs/Web/CSS/font-optical-sizing
- `scrollbar-color`: https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-color
- `paint-order`: https://developer.mozilla.org/en-US/docs/Web/CSS/paint-order
- `dominant-baseline`: https://developer.mozilla.org/en-US/docs/Web/CSS/dominant-baseline
- `vector-effect`: https://developer.mozilla.org/en-US/docs/Web/CSS/vector-effect
- `speak-as`: https://developer.mozilla.org/en-US/docs/Web/CSS/speak-as

No-page (404) entries, noted as unconfirmed:

- `baseline-shift`: https://developer.mozilla.org/en-US/docs/Web/CSS/baseline-shift
- `column-height`: https://developer.mozilla.org/en-US/docs/Web/CSS/column-height
