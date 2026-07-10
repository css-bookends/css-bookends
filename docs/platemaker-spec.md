# Platemaker spec: onion-wrap style-dictionary

Status: no code yet. **Approach DECIDED (2026-07-10): rebuild the platemaker as a thin onion wrapper
around [style-dictionary](https://styledictionary.com)** (the swappable `core`), per the repo's
onion-framework rule (the same shape `gilding` uses for Lightning CSS). style-dictionary owns
parse / resolve references / transform; the platemaker owns the calipers `$type` mapping + emit. The
bespoke `platemaker` package was deleted and is rebuilt on this shape. Still open before building:
the §6 detail decisions and the §7 package/org placement.

## 1. What it is: a source-agnostic, flexible adapter into the typed system

The job, in one line: take design tokens from ANY source, however quirky or company-specific, and
convert them into the typed calipers system (`m` / `color` / `i` / `f`). The SOURCE is not the
platemaker's concern; the typed OUTPUT is. It is a build-time step (run when the design updates), not
a runtime helper, so it does not render `.css()` itself; the calipers values it emits do.

The flexibility lives in CONFIG SEAMS on the style-dictionary core, so updates / quirks /
company-specific specs are absorbed in config, never hardcoded into the converter:

- **Source-agnostic** — a style-dictionary PARSER ingests whatever format you have (DTCG, Tokens
  Studio export, a company's bespoke JSON) into a normalised dictionary. A new source means a new or
  added parser; nothing downstream changes.
- **Quirks / updates / company spec** — PREPROCESSORS + TRANSFORMS normalise and fix the parsed
  tokens before mapping (rename oddities, coerce units, drop junk, resolve references). A company's
  weirdness lives in a transform, not in the converter.
- **Into your typed system** — the platemaker's mapping turns the normalised, resolved tokens into
  calipers values by `$type` (the table in §4).

```
any source (DTCG / Tokens Studio / bespoke JSON)
   -> parser            (source-agnostic)
   -> preprocess/transform  (absorb updates / quirks / company spec)
   -> map by $type      (the platemaker's calipers seam)
   -> typed calipers values (m / color / i / f)  ->  books / .css()
```
Every arrow is a config seam; the whole thing is `createPlate`'s onion wrapping style-dictionary.

## 2. Style-dictionary primer (the core we wrap)

Style-dictionary is a build system: it reads token files, resolves references, runs transforms, and
emits platform outputs via formats. The pieces, in pipeline order:

- **Parsers** turn token files into a JS object (`registerParser`). DTCG JSON is supported natively
  in v4 (`$value` / `$type` / `$description`); you pick DTCG **or** legacy per instance, not both.
- **Preprocessors** mutate the parsed dictionary before transforms (`registerPreprocessor`).
- **Transforms** normalise token values/names/attributes (`registerTransform`, grouped by
  `registerTransformGroup`). Transforms also RESOLVE references between tokens.
- **Formats** turn the transformed dictionary into an output string (`registerFormat`).

Programmatic API (v4) we would use:

```ts
import StyleDictionary from 'style-dictionary';
const sd = new StyleDictionary(config);            // config = object or file path; auto-inits
// in-memory (no files written) — what a library wants:
const tokens = await sd.getPlatformTokens('calipers'); // resolved tokens, post-transform
// or, if we emit via a custom format:
const files = await sd.formatPlatform('calipers');     // [{ output, destination }], no fs write
```

A custom **format** function receives `{ dictionary, platform, options, file }` and returns a string
(non-string allowed via `formatPlatform`/`formatAllPlatforms`). `dictionary.allTokens` is the flat
resolved array; each token has `value` (transformed/resolved), `original.value`, `name`, `path`,
`type`. (`registerFormat({ name, format })`.)

## 3. The onion wrapper (`createPlate`)

Mirror `createGilding` (`packages/gilding`): a factory returning a function, with a swappable core
and pass-through core options. The wrapper owns the calipers mapping + emit; style-dictionary owns
parse + resolve + transform.

**Why onionize (the rationale).** We WRAP style-dictionary, we do not reinvent it or claim it as our
own (the same stance `gilding` takes toward Lightning CSS, "we wrap, we don't reinvent or take
credit"). The onion buys two things:
- **Swappable, not a lock-in.** style-dictionary sits behind our `core` seam, so if a better token
  engine appears, or a consumer needs a different one, we swap the core with zero change at the
  consumer's call sites.
- **Our customizations on top.** The wrapper layers OUR behaviour AROUND the core, onion-style: our
  calipers mapping, our emit, our defaults/config, plus any parsers/preprocessors/transforms we add
  for source quirks, all without forking style-dictionary. Their engine does the heavy lifting; our
  value-add lives on the outside.

- **Evergreen config** (the only surface most consumers learn): the token source + how token
  `$type`s map to calipers + the emit shape.
- **Swap seam** `core`: defaults to a style-dictionary adapter; replaceable (the onion's centre), so
  the parser/resolver is not a lock-in.
- **Pass-through** `coreOptions`: forwarded verbatim to the active core (e.g. the raw
  style-dictionary `config`: extra `transforms`, `preprocessors`, etc.). Opaque to the platemaker.

```ts
const plate = createPlate({ /* evergreen config */ });
const output = plate.convert(tokenOrDoc);   // -> emitted TS source (or an in-memory map; see §5)
```

## 4. The calipers seam (the real design choice)

Two ways to turn resolved tokens into calipers values:

- **A. Map in the wrapper (recommended).** Use the core to get RESOLVED tokens
  (`getPlatformTokens()`), then the platemaker maps each token to a calipers primitive by `$type`,
  and emits. The calipers knowledge lives in the platemaker; style-dictionary stays a generic
  parse+resolve core (truly swappable). This is the old `convert.ts` mapping logic, but fed by
  style-dictionary instead of a bespoke parser.
- **B. Custom style-dictionary format.** Register a format that walks `dictionary.allTokens` and
  emits TS using calipers calls. Fewer moving parts, but it welds the calipers mapping to
  style-dictionary's format API, so the core is no longer cleanly swappable. Not recommended for the
  onion shape.

`$type` -> calipers mapping, grounded in the full DTCG type list. It splits exactly like
`lexicons/calipers/docs/input-coverage.md`: **primitive** `$type`s map to a lexicon (the platemaker's
core job); **composite** `$type`s decompose into those same lexicon values but assemble through a
BOOK, so they are book-level and a primitives-only v1 is a clean, complete first cut (§6 Q3).

**Primitive `$type` -> a lexicon (the platemaker core):**

| DTCG `$type` | `$value` shape | calipers | note |
| --- | --- | --- | --- |
| `dimension` | `{ value, unit: 'px' \| 'rem' }` | `m(value, unit)` | direct; `m` takes any unit string |
| `duration` | `{ value, unit: 'ms' \| 's' }` | `m(value, unit)` | a time-unit measurement |
| `number` | a JSON number | `i()` if integer else `f()` | unitless scalar |
| `fontWeight` | number `[1,1000]` or keyword | `i()` hardened `[1,1000]`, or keyword string | numeric -> `i`; keyword passes through |
| `color` | `{ colorSpace, components, alpha?, hex? }` | `color(...)` | needs a small adapter: DTCG color object -> calipers `ColorObject` / CSS string |
| `fontFamily` | string or `string[]` | `string[]` passthrough (INTERIM) | TODO, see below. Not a lexicon (the `<string>` case from input-coverage) |
| `cubicBezier` | `[x1,y1,x2,y2]` numbers | `f()` per number | the four numbers are `f()`; the `cubic-bezier()` function itself is composite (book) |

**`fontFamily` (TODO).** For v1, emit it as a plain array of strings, unchanged (a single string is
normalized to a one-element array). A richer typed font-family surface is deferred: a heavy typed
font system was tried before (in the author's portfolio) and proved too much overhead to work with
for too little payoff, so the interim is a deliberate "keep it a string list" until a lighter design
earns its place.

**Composite `$type` -> a BOOK input (decomposes into lexicon values):**

| DTCG `$type` | decomposes into | book |
| --- | --- | --- |
| `border` | `color` + `width` (dimension) + `style` (strokeStyle) | `borders` |
| `shadow` | `color` + `offsetX/offsetY/blur/spread` (dimensions) | `shadows` |
| `strokeStyle` | keyword, or `{ dashArray: [dimension], lineCap }` | borders / stroke |
| `transition` | `duration` + `delay` (durations) + `timingFunction` (cubicBezier) | transitions (TBD) |
| `gradient` | `stops: [{ color, position }]` | gradient / background (TBD) |
| `typography` | `fontFamily` + `fontSize` (dimension) + `fontWeight` + `lineHeight` | typography (TBD) |

**Takeaway:** the calipers seam covers EVERY primitive DTCG type via a lexicon
(`dimension` / `duration` / `number` / `fontWeight` / `color`), with `fontFamily` as the string
exception. Composites decompose into those same lexicon values, so v1 = primitives-only is total over
the part the platemaker owns, and composites arrive when their books do.

## 5. Output shape (open)

Two emit modes (could support both, config-driven, per the everything-is-config-driven rule):
- **TS source** (what the bespoke one did): `export const` declarations whose values are calipers
  factory calls, written to a file. Build-time codegen.
- **In-memory object**: return `{ tokenName: <calipers value> }` for programmatic use without a file.

## 6. Open questions to decide (the point of this doc)

1. **Seam A vs B** (map-in-wrapper vs custom SD format). Recommendation: A, for a swappable core.
2. **Emit**: TS-source codegen, in-memory map, or both (config-driven).
3. **Composite token types** (`shadow`, `typography`, `cubicBezier`, `border`): these map to BOOK
   inputs, not a single calipers primitive. Does the platemaker handle them (needs the books), or
   only primitive `$type`s (dimension/color/number/duration/fontWeight) for v1?
4. **Reference resolution**: lean on style-dictionary's resolution entirely (yes), or preserve token
   aliases as references in the output? (Probably resolve fully for v1.)
5. **DTCG-only**: support only the DTCG `$`-prefixed format (v1), or also legacy? (Lean DTCG-only.)
6. **Package shape**: `createPlate` factory + a thin CLI script (the dev runs it), library-only
   like gilding (no CLI), or both?

## 7. Naming + placement

**DECIDED (2026-07-10): the platemaker belongs to the `css-calipers` ORG, not `css-bookends`.** It is
calipers input tooling (it depends on calipers and emits calipers values; nothing lower depends on
it), not a book. `createPlate`, default core = a style-dictionary adapter; `style-dictionary` is
a dependency of the DEFAULT CORE ONLY (so a consumer who swaps the core does not pay for it),
mirroring how `gilding` isolates `lightningcss`.

**DECIDED (2026-07-10): the platemaker is its OWN INDEPENDENT repo, not a monorepo package.** It is
developed on its own (NOT mirrored out of css-bookends the way calipers is) and lives in the
`css-calipers` org / family. The test-first scaffold already exists as an independent package at
`~/GitHub/platemaker` (name `css-platemaker`, unscoped, matching the standalone `css-calipers`
identity), with the RED spec in `tests/convert.test.ts`. Follow-ons still to settle (none block the
mapping in §4): (a) stand up the `css-calipers` GitHub org + create `css-calipers/platemaker` and push
(user-run, git); (b) the npm publish identity (unscoped `css-platemaker` vs a scope); (c) the calipers
dependency for the GREEN phase (published `css-calipers@beta` vs a local link during dev). NOTE: this
independence supersedes the "platemaker = Layer 2 bookends" framing that was already reframed in
`foundations.md` / `AGENTS.md` / `.claude/CLAUDE.md`; and this doc (the design spec) should shrink to a
pointer once the design travels to the independent repo.

## Sources

- DTCG Design Tokens Format Module (the canonical `$type` list, §4 mapping): https://www.designtokens.org/TR/drafts/format/
- Style Dictionary DTCG / token representation: https://styledictionary.com/info/tokens/
- Style Dictionary API: https://styledictionary.com/reference/api/
- Custom formats: https://styledictionary.com/reference/hooks/formats/
- DTCG / W3C support: https://styledictionary.com/info/tokens/ and
  https://v4.styledictionary.com/reference/utils/dtcg/
- Config: https://styledictionary.com/reference/config/
