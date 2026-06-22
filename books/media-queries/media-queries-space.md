# media queries value surface

The valid CSS value surface for **media queries** (the `@media` rule and the media query
syntax shared by the HTML `media` attribute) per the CSS Media Queries specifications.
Implementation-agnostic: this maps what CSS *allows*, not what any engine ships or what any
book covers. Coverage decisions are tracked elsewhere.

Two spec levels are in play and both are cited throughout:

- **Media Queries Level 4** (W3C Candidate Recommendation) — the stable core: grammar,
  range syntax, media types, the dimensional / color / interaction features.
- **Media Queries Level 5** (W3C Working Draft, **not yet stable**) — user-preference
  features, HDR/gamut, viewport segments, custom media, etc. Every Level 5 item below is
  flagged; treat them as draft-level and subject to change.

Container queries (`@container`) are a *separate* mechanism (CSS Containment Module Level 3)
and are out of scope here, even though they reuse the `<media-feature>`-style range and
boolean grammar for size queries.

---

## 1. Grammar

### The `@media` rule

```
@media <media-query-list> {
  <rule-list>
}
```

The same `<media-query-list>` production is also the value of the HTML `media` attribute on
`<link>`, `<style>`, `<source>`, etc., and of the `@import` rule's media condition. The
grammar below is identical in all of those contexts.

### Media query list / query / condition (Level 4)

```
<media-query-list> = <media-query>#

<media-query> = <media-condition>
              | [ not | only ]? <media-type> [ and <media-condition-without-or> ]?

<media-type> = <ident>     /* one of the media-type keywords in §2 */

<media-condition> = <media-not> | <media-in-parens> [ <media-and>* | <media-or>* ]

<media-condition-without-or> = <media-not> | <media-in-parens> <media-and>*

<media-not> = not <media-in-parens>
<media-and> = and <media-in-parens>
<media-or>  = or  <media-in-parens>

<media-in-parens> = ( <media-condition> ) | ( <media-feature> ) | <general-enclosed>

<general-enclosed> = [ <function-token> <any-value>? ) ] | [ ( <any-value>? ) ]
```

Key structural facts:

- `#` means a **comma-separated list** (`<media-query>#`). A trailing/standalone comma is a
  list with an empty (invalid) query, which becomes `not all`.
- A `<media-query>` is **either** a bare `<media-condition>` (no media type) **or** a media
  type optionally prefixed by `not`/`only` and optionally followed by `and <condition>`.
- `<media-condition-without-or>` exists because after a media type you may only chain with
  `and` (you cannot write `screen or (…)`); the `or` form is reachable only inside an
  explicit parenthesized `<media-condition>`.
- `<general-enclosed>` is the forward-compatibility hatch: any unrecognized
  `( … )` / `function( … )` block parses as `<general-enclosed>` and evaluates to
  **unknown** rather than being a syntax error.

### Media feature (Level 4)

```
<media-feature> = ( [ <mf-plain> | <mf-boolean> | <mf-range> ] )

<mf-plain>   = <mf-name> : <mf-value>
<mf-boolean> = <mf-name>
<mf-range>   = <mf-name> <mf-comparison> <mf-value>
             | <mf-value> <mf-comparison> <mf-name>
             | <mf-value> <mf-lt> <mf-name> <mf-lt> <mf-value>
             | <mf-value> <mf-gt> <mf-name> <mf-gt> <mf-value>

<mf-name>  = <ident>
<mf-value> = <number> | <dimension> | <ident> | <ratio>

<mf-lt> = '<' '='?
<mf-gt> = '>' '='?
<mf-eq> = '='
<mf-comparison> = <mf-lt> | <mf-gt> | <mf-eq>
```

A media feature is **always parenthesized** in use: `(width: 600px)`, `(hover)`,
`(400px <= width <= 700px)`.

### Logical operators

| Operator | Form | Meaning |
| --- | --- | --- |
| `and` | `A and B` | conjunction — both must be true |
| `or` | `A or B` | disjunction — either may be true (inside a `<media-condition>` only) |
| `not` | `not A` | negation — inverts the result (`unknown` stays `unknown`) |
| `only` | `only screen …` | **no effect on evaluation**; a legacy hack so old UAs that don't grok media queries skip the rule. Requires a media type. |
| `,` (comma) | `A, B` | list separator = logical **or** across whole queries. The list matches if *any* query matches. |

`not` and `only` may appear only at the **start of a `<media-query>`** before a media type
(`not screen`, `only print`). Negating a condition mid-expression uses the
`<media-not>` form inside parens (`(not (hover))`). You cannot mix `and` and `or` at the
same level without parentheses (e.g. `(a) and (b) or (c)` is invalid; parenthesize).

### Boolean context

`<mf-boolean>` is a feature name with **no value**: `(color)`, `(hover)`, `(grid)`,
`(update)`. It evaluates **false** when the feature's value would be `0`, a zero `<dimension>`,
or the feature's "none"-like keyword (`none`, `no-preference`, etc.); otherwise **true**.
So `(color)` ≡ "this device has any color", `(hover)` ≡ `(hover: hover)`.

### Three-valued (Kleene) logic & error handling

Evaluation is **true / false / unknown**. Unrecognized features, values, or
`<general-enclosed>` blocks evaluate to **unknown**, which collapses to **false** in a
boolean (apply-or-not) context but propagates correctly through `not`/`and`/`or`. A query
that **fails to parse** is replaced by `not all` (never matches) — this is how a typo
degrades gracefully instead of breaking the stylesheet.

---

## 2. Media types

A `<media-type>` is an `<ident>`. The grammar forbids the keywords `only`, `not`, `and`,
`or`, `layer` as media types.

| Type | Status | Meaning |
| --- | --- | --- |
| `all` | **current** | matches every device (the default when no type is given) |
| `screen` | **current** | screens (anything not `print`) |
| `print` | **current** | paged material / print preview |
| `tty` | deprecated | — |
| `tv` | deprecated | — |
| `projection` | deprecated | — |
| `handheld` | deprecated | — |
| `braille` | deprecated | — |
| `embossed` | deprecated | — |
| `aural` | deprecated | (superseded by `speech`) |
| `speech` | deprecated | speech synthesizers |

**Deprecation note:** Level 4 retains only `all`, `print`, `screen` as "real" types. All
others (`tty`, `tv`, `projection`, `handheld`, `braille`, `embossed`, `aural`, `speech`) are
**deprecated**: they are still recognized by the parser (so `@media speech { … }` is valid
syntax and does not poison the rule) but they **never match** anything. Authors should not
use them.

---

## 3. Media features (exhaustive)

Each feature is **range** or **discrete**:

- **range** features describe a quantity on a continuum. They accept the `min-`/`max-`
  prefixed `<mf-plain>` form *and* the `<mf-range>` comparison syntax (`<`, `>`, `=`, `<=`,
  `>=`). See §4.
- **discrete** features take a fixed keyword set (or a boolean). They accept only the
  `<mf-plain>` (`name: value`) and `<mf-boolean>` forms. They **never** accept `min-`/`max-`
  or comparison operators.

### 3.1 Dimensional

| Feature | Value | Type | Level | Notes |
| --- | --- | --- | --- | --- |
| `width` | `<length>` | range | 4 | viewport width (incl. scrollbar). False for any negative query. |
| `height` | `<length>` | range | 4 | viewport height. |
| `aspect-ratio` | `<ratio>` | range | 4 | width-to-height ratio of the viewport. `<ratio> = <number [0,∞]> [ / <number [0,∞]> ]?` |
| `orientation` | `portrait \| landscape` | discrete | 4 | `portrait` when height ≥ width, else `landscape`. |
| `device-width` | `<length>` | range | **deprecated** (4) | output-device (screen) width. |
| `device-height` | `<length>` | range | **deprecated** (4) | output-device height. |
| `device-aspect-ratio` | `<ratio>` | range | **deprecated** (4) | output-device aspect ratio. |

The three `device-*` features are deprecated in Level 4 — kept for compatibility, authors
should query the viewport (`width`/`height`/`aspect-ratio`) instead.

### 3.2 Display quality

| Feature | Value | Type | Level | Notes |
| --- | --- | --- | --- | --- |
| `resolution` | `<resolution> \| infinite` | range | 4 | pixel density (`dpi`, `dpcm`, `dppx`/`x`). `infinite` matches vector devices. |
| `scan` | `interlace \| progressive` | discrete | 4 | scanning process of the output device. |
| `grid` | `<mq-boolean>` (`0` \| `1`) | discrete | 4 | `1` = grid/character device (e.g. tty), `0` = bitmap. |
| `update` | `none \| slow \| fast` | discrete | 4/5 | how fast the device can modify rendered content. |
| `overflow-block` | `none \| scroll \| optional-paged \| paged` | discrete | 4 | how block-axis overflow is handled. |
| `overflow-inline` | `none \| scroll` | discrete | 4 | how inline-axis overflow is handled. |
| `environment-blending` | `opaque \| additive \| subtractive` | discrete | **5** | how the display blends with the surrounding environment (AR/HUD). |

`<mq-boolean>` is the integer `0` or `1`; any other integer is invalid for `grid`. In boolean
context `(grid)` ≡ `(grid: 1)`.

### 3.3 Color

| Feature | Value | Type | Level | Notes |
| --- | --- | --- | --- | --- |
| `color` | `<integer>` | range | 4 | bits per color component (`0` = not color). `(color)` ≡ "has color". |
| `color-index` | `<integer>` | range | 4 | number of entries in the color lookup table (`0` = none). |
| `monochrome` | `<integer>` | range | 4 | bits per pixel in a monochrome frame buffer (`0` = not monochrome). |
| `color-gamut` | `srgb \| p3 \| rec2020` | discrete | 4 | approximate gamut the UA + device can show. Nested: `rec2020` ⊃ `p3` ⊃ `srgb`. |
| `dynamic-range` | `standard \| high` | discrete | **5** | combination of brightness, contrast ratio, color depth. `high` also matches `standard`. |
| `video-color-gamut` | `srgb \| p3 \| rec2020` | discrete | **5** | gamut of the **video plane** (bi-plane devices like TVs). |
| `video-dynamic-range` | `standard \| high` | discrete | **5** | dynamic range of the **video plane**. |

The negative range is always false for the integer color features (e.g. `(min-color: -1)`
never matches). `color-gamut` keywords are cumulative (a `rec2020` device also matches `p3`
and `srgb`).

### 3.4 Interaction

| Feature | Value | Type | Level | Notes |
| --- | --- | --- | --- | --- |
| `pointer` | `none \| coarse \| fine` | discrete | 4 | accuracy of the **primary** pointing device. |
| `any-pointer` | `none \| coarse \| fine` | discrete | 4 | accuracy of **any available** pointing device. |
| `hover` | `none \| hover` | discrete | 4 | whether the **primary** pointing device can hover. |
| `any-hover` | `none \| hover` | discrete | 4 | whether **any available** pointing device can hover. |

`any-pointer` / `any-hover` may match multiple values across multiple devices (they are a
union over inputs), whereas `pointer` / `hover` describe only the primary input.

### 3.5 User preferences (Level 5)

All discrete; all Level 5 (Working Draft). In boolean context, the `no-preference` /
`none` value evaluates **false**, the active value evaluates **true** (e.g.
`(prefers-reduced-motion)` ≡ `(prefers-reduced-motion: reduce)`).

| Feature | Value | Notes |
| --- | --- | --- |
| `prefers-reduced-motion` | `no-preference \| reduce` | user wants minimal animation/motion. |
| `prefers-reduced-transparency` | `no-preference \| reduce` | user wants fewer transparent/translucent effects. |
| `prefers-contrast` | `no-preference \| less \| more \| custom` | desired contrast level. `custom` matches a user-specified palette (e.g. under forced colors). |
| `prefers-color-scheme` | `light \| dark` | preferred light/dark theme. (No `no-preference`; `light` is the fallback.) |
| `prefers-reduced-data` | `no-preference \| reduce` | user prefers lighter, lower-data content. |
| `forced-colors` | `none \| active` | whether the UA enforces a limited user-chosen color palette (e.g. high-contrast mode). |
| `inverted-colors` | `none \| inverted` | whether the UA/OS inverts all displayed colors. |
| `light-level` | `dim \| normal \| washed` | ambient light: `dim` (dark room), `normal` (ideal), `washed` (bright daylight). |
| `scripting` | `none \| initial-only \| enabled` | scripting availability: off / only during initial load / fully on. |

### 3.6 Application / device posture (Level 5)

| Feature | Value | Type | Level | Notes |
| --- | --- | --- | --- | --- |
| `display-mode` | `fullscreen \| standalone \| minimal-ui \| browser \| picture-in-picture \| window-controls-overlay` | discrete | 5 | the PWA / web-app manifest display mode. (Defined together with the Web App Manifest spec.) |
| `nav-controls` | `none \| back` | discrete | 5 | whether the UA exposes navigation controls (a visible back button). |
| `horizontal-viewport-segments` | `<integer>` | **range** | 5 | number of horizontal viewport segments (foldable / dual-screen). Negative range is false. |
| `vertical-viewport-segments` | `<integer>` | **range** | 5 | number of vertical viewport segments. Negative range is false. |

`horizontal-viewport-segments` / `vertical-viewport-segments` replaced the earlier
`device-posture` / `screen-spanning` proposals; they are the segment-count features in the
current Level 5 draft. (`device-posture` itself is specified in the separate Device Posture
spec, not Media Queries.)

---

## 4. Range syntax

Range-type features (§3, every row marked **range**) can be queried two equivalent ways.

### `min-`/`max-` prefix form (`<mf-plain>`)

Legacy form, inherited from Level 3. The prefix is part of the feature name:

```
(min-width: 600px)   ≡  (width >= 600px)
(max-width: 700px)   ≡  (width <= 700px)
```

- `min-<feature>: v` means `<feature> >= v` (inclusive lower bound).
- `max-<feature>: v` means `<feature> <= v` (inclusive upper bound).
- Only **range** features have `min-`/`max-` variants. There is no `min-orientation`, etc.
- The prefixed form cannot express a strict `<` / `>` or a two-sided interval.

### MQ4 comparison form (`<mf-range>`)

Level 4 added inline comparison operators:

```
(width >= 600px)            /* name op value */
(600px <= width)            /* value op name */
(400px <= width <= 700px)   /* two-sided, both <= (or both <)  */
(700px >  width >  400px)   /* two-sided, both >  (or both >=) */
(width = 600px)             /* exact equality */
```

Operators: `<`, `>`, `=`, `<=`, `>=` (`<mf-lt> = '<' '='?`, `<mf-gt> = '>' '='?`,
`<mf-eq> = '='`). In the two-sided form **both** operators must point the **same direction**
(both `<`/`<=` or both `>`/`>=`); you cannot mix `<` with `>` in one interval. The feature
name sits in the middle, a value on each side.

The two forms are interchangeable for range features; the comparison form is the only way to
express strict inequalities and bounded intervals.

---

## 5. CSS-wide notes

- **CSS-wide keywords** (`inherit`, `initial`, `unset`, `revert`, `revert-layer`) do **not**
  apply inside media queries. A media query is not a property value; `<mf-value>` is
  `<number> | <dimension> | <ident> | <ratio>`, and the idents are the feature's own keyword
  set. There is no `var()`/`env()`/`calc()` in the media-feature value position either
  (those are property-value constructs); `<mf-value>` takes literal numbers, dimensions,
  ratios, and keywords only.
- **`@media` vs the `media` attribute.** The same `<media-query-list>` grammar is the value
  of the HTML `media` attribute (`<link media="…">`, `<style media="…">`,
  `<source media="…">`) and of `@import url(...) <media-query-list>;`. So
  `media="screen and (width >= 600px)"` is valid exactly because it is a media query list.
  The attribute gates whether the resource applies; `@media` gates a block of rules. Same
  value surface, different host.
- **Custom media queries (Level 5, draft).** `@custom-media` names a reusable query:

  ```
  @custom-media <extension-name> [ <media-query-list> | true | false ] ;
  ```

  `<extension-name>` is a `--`-prefixed dashed-ident (like a custom property). `true` /
  `false` force the named query to always/never match. The name is then used in a feature
  position: `@media (--narrow) { … }`. This is Working-Draft / not yet broadly stable.
- **Container queries are separate.** `@container` (CSS Containment Module Level 3) reuses
  the range/boolean feature grammar for `width`, `height`, `aspect-ratio`, `orientation`,
  etc., but it is a distinct at-rule querying an element's container, not the viewport/device.
  It is out of scope for this document.
- **Level status.** Everything tagged **Level 5** above (user-preference features,
  `dynamic-range` / `video-*`, `environment-blending`, `nav-controls`, viewport segments,
  `display-mode`, `@custom-media`) is in a **Working Draft** and not yet at a stable
  Recommendation level; treat names and value sets as provisional. The Level 4 core is a
  Candidate Recommendation and stable.

---

## Sources

- W3C, *Media Queries Level 4* (Candidate Recommendation): https://www.w3.org/TR/mediaqueries-4/
- W3C, *Media Queries Level 5* (Working Draft): https://www.w3.org/TR/mediaqueries-5/
- CSS WG Editor's Draft, *Media Queries Level 5*: https://drafts.csswg.org/mediaqueries-5/
- MDN, `@media`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media
- MDN, `@custom-media`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@custom-media
- MDN, `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- MDN, `prefers-reduced-transparency`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency
- MDN, `prefers-contrast`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast
- MDN, `prefers-color-scheme`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- MDN, `prefers-reduced-data`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-data
- MDN, `forced-colors`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors
- MDN, `inverted-colors`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/inverted-colors
- MDN, `scripting`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/scripting
- MDN, `dynamic-range`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/dynamic-range
- MDN, `video-dynamic-range`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/video-dynamic-range
- MDN, `display-mode`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/display-mode
- MDN, `update`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/update
- MDN, `<link>` (media attribute): https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link
