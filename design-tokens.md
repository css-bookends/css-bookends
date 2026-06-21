# Design tokens: the source-agnostic input boundary

Where design tokens fit in CSS-Bookends, and why the boundary is drawn where it
is. This is a scope decision plus background research on the format we standardize
on at the input edge.

Sources (researched 2026-06-19):

- Design Tokens Community Group (W3C): https://github.com/design-tokens/community-group
- DTCG Format Module, draft 2025.10: https://www.designtokens.org/tr/drafts/format/
- DTCG technical reports index: https://www.designtokens.org/

## The decision

CSS-Bookends already has its own typed format. That internal format is the input
page of each book (typed tokens built on the lexicons, normalized into each book's
canonical store). None of that changes.

What we are adding is a single, source-agnostic ingestion boundary in front of
that format:

- **We are agnostic about the source.** Figma, Sketch, Style Dictionary, a
  hand-authored file, whatever. The project does not care where tokens originate.
- **DTCG is the one standard interface we accept.** The
  [Design Tokens Community Group](https://github.com/design-tokens/community-group)
  format is the contract at the boundary. A source provides DTCG; CSS-Bookends
  ingests DTCG and maps it into its own format.
- **Getting a tool to DTCG is the source's problem, not ours.** We do not directly
  support Figma. If you want Figma tokens in, you figure out how to export Figma to
  DTCG (a plugin, an exporter, whatever the ecosystem provides), and then we ingest
  that DTCG. The same rule holds for any other tool.

So the flow is:

```
any source  ->  DTCG  ->  typesetter  ->  typed lexicon vars  ->  books  ->  plain CSS
(out of      (the         (converts       (m(), color(), ...)     (existing
 scope)       interface)   tokens to                               input/output
                           lexicon vars)                           pages)
```

The **typesetter** is the construct that does the DTCG-to-lexicon conversion. It is
a new kind of construct, neither a lexicon nor a book: it sets the external token
document into typed lexicon vars (`m()`, `color()`), the way a typesetter sets a
manuscript into type before it reaches the press.

### Why draw the line at DTCG rather than at each tool

- **The tool-specific space is unstable right now.** Figma's token/variable story
  and the various exporters keep shifting. Binding directly to any one tool means
  re-chasing its changes. Pinning to a single neutral standard isolates the project
  from that churn.
- **One interface instead of N.** Supporting tools directly is an open-ended set of
  adapters we would own forever. Supporting DTCG is one adapter, and the ecosystem
  is converging on DTCG as the shared interchange.
- **It matches the project's own thesis.** CSS-Bookends is loose at the edges and
  standardized in the middle. DTCG is exactly that pattern applied one layer up: a
  standardized external interchange that normalizes into our canonical store.

### What is out of scope (explicitly)

- Figma-to-tokens conversion, and any other tool-to-DTCG conversion. That is the
  source's responsibility.
- Owning or tracking individual tool plugins/exporters.

### What is in scope (later, not built yet)

- The **typesetter**: an on-demand, configurable construct that reads a DTCG
  document and converts it into typed lexicon vars (`m()`, `color()`, ...) that feed
  the books. This document records the decision and the format; the typesetter code
  is future work, not part of this change.

## What DTCG is

The Design Tokens Community Group is the official W3C community group defining a
standard, vendor-neutral way to share design tokens (color, spacing, typography,
and so on) across tools and platforms. Over 40 organizations participate, including
Adobe, Figma, Google, Microsoft, Salesforce, Sketch, and Shopify.

- **Status:** the latest stable Format Module is **2025.10** (released 28 October
  2025). The group versions the spec by date for compliance signaling. It is still
  a community-group draft, not a finished W3C Recommendation, but it is the
  consolidation point the ecosystem is moving toward.
- **Stated principles:** inclusivity, focused extensibility, and stability.

## The format, in brief

This section is reference material for the typesetter. All of it comes from the
Format Module draft 2025.10 (link above).

### File format

- Design token files are JSON.
- Recommended MIME type: `application/design-tokens+json` (or `application/json`).
- File extensions: `.tokens` or `.tokens.json`.

### A token object

A token is any object with a `$value` property.

```json
{
  "token-name": {
    "$value": "some-value",
    "$type": "color",
    "$description": "Optional explanation",
    "$extensions": {},
    "$deprecated": false
  }
}
```

| Property       | Required    | Purpose                                                   |
| -------------- | ----------- | -------------------------------------------------------- |
| `$value`       | Yes         | The token's actual value.                                 |
| `$type`        | Conditional | Categorizes the token; inherited from a parent group if omitted. |
| `$description` | No          | Plain-text explanation for tools and docs.               |
| `$extensions`  | No          | Vendor-specific metadata, keyed by reverse-domain name.  |
| `$deprecated`  | No          | Boolean, or a string explaining the deprecation.         |

### Groups and nesting

An object **without** `$value` is a group. Groups nest, hold child tokens, and can
set shared properties (`$type`, `$description`, `$deprecated`, `$extensions`) that
children inherit.

```json
{
  "color": {
    "$type": "color",
    "primary": {
      "$value": { "colorSpace": "srgb", "components": [0, 0.4, 0.8] }
    },
    "semantic": {
      "success": {
        "$value": { "colorSpace": "srgb", "components": [0, 0.8, 0.4] }
      }
    }
  }
}
```

A reserved `$root` token can sit alongside a group's children to give the group
itself a value.

### Aliases and references

Curly-brace syntax references another token and resolves to its complete `$value`:

```json
{
  "colors": {
    "blue": {
      "$value": { "colorSpace": "srgb", "components": [0, 0.4, 0.8] },
      "$type": "color"
    }
  },
  "semantic": {
    "primary": { "$value": "{colors.blue}", "$type": "color" }
  }
}
```

Path form is `{group.token}` or `{group.nested.token}`. For property-level access
inside a value, there is a JSON Pointer form using `$ref` (for example
`{ "$ref": "#/base/blue/$value/components/0" }`). Circular references are invalid.

### Primitive types

- **color** — uses the separate DTCG Color module; values are objects like
  `{ "colorSpace": "srgb", "components": [r, g, b], "alpha": a }`.
- **dimension** — a distance as value plus unit, units `px` or `rem`:
  ```json
  { "$value": { "value": 16, "unit": "px" }, "$type": "dimension" }
  ```
- **fontFamily** — a name or an array of names (fallback stack).
- **fontWeight** — a number `1`–`1000`, or a named alias (`thin`/`hairline` 100,
  `light` 300, `normal`/`regular` 400, `medium` 500, `semi-bold` 600, `bold` 700,
  `extra-bold` 800, `black` 900, `extra-black` 950).
- **duration** — value plus unit, units `ms` or `s`.
- **cubicBezier** — a four-number array `[P1x, P1y, P2x, P2y]`.
- **number** — a unitless number (line height, gradient stop positions, and so on).

### Composite types

Composite tokens hold structured sub-values, each of a predefined type, and any
sub-value may itself be a reference.

- **strokeStyle** — a keyword string (`solid`, `dashed`, `dotted`, `double`,
  `groove`, `ridge`, `outset`, `inset`) or an object with `dashArray` (dimensions)
  and `lineCap`.
- **border** — `{ color, width (dimension), style (strokeStyle) }`.
- **transition** — `{ duration, delay (durations), timingFunction (cubicBezier) }`.
- **shadow** — one shadow object or an array; each is
  `{ color, offsetX, offsetY, blur, spread }` with dimension offsets.
- **gradient** — `{ angle, stops: [{ color, position (number) }, ...] }`.
- **typography** —
  `{ fontFamily, fontSize (dimension), fontWeight, lineHeight (number), letterSpacing (dimension) }`.

### How dimensions encode value plus unit

This is the part most relevant to the calipers lexicon. DTCG does not use a string
like `"16px"`. It splits the magnitude from the unit:

```json
{ "$value": { "value": 16, "unit": "px" }, "$type": "dimension" }
```

That is a clean match for an `m(16, "px")` style measurement: the typesetter reads
`value` and `unit` and builds the measurement. Real token files also use the
CSS-string form (`"16px"`), so the typesetter accepts both and resolves each to the
same `m(16, "px")`. The same value-plus-unit shape recurs in `duration`, in every
dimension inside the composite types, and in `dashArray`.

### Constraints worth noting for the typesetter

- Token and group names cannot start with `$`, and cannot contain `{`, `}`, or `.`.
- `$type` must be one of the predefined types; tools must not infer type from the
  value shape.
- Every token must have a resolvable type, via its own `$type`, an inherited group
  `$type`, or the type of a referenced token.
