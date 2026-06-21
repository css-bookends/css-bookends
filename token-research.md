# DTCG token parser/ingestion landscape

Research on libraries that read W3C Design Tokens (DTCG) JSON, to decide what
CSS-Bookends should reuse for ingesting tokens (the "typesetter"). See
`design-tokens.md` for why DTCG is our input boundary.

Sources (researched 2026-06-20):

- DTCG community group: https://github.com/design-tokens/community-group
- DTCG "tools that support the format": https://github.com/design-tokens/community-group/discussions/312
- Style Dictionary: https://github.com/style-dictionary/style-dictionary
- Style Dictionary DTCG utils: https://styledictionary.com/reference/utils/dtcg/
- Terrazzo: https://github.com/terrazzoapp/terrazzo
- `@terrazzo/parser` JS API: https://terrazzo.app/docs/reference/js-api/
- Terrazzo plugin API: https://terrazzo.app/docs/reference/plugin-api/
- nclsndr tools: https://github.com/nclsndr/design-tokens-tools
- nclsndr format-module: https://github.com/nclsndr/design-tokens-format-module
- Universal Design Tokens (UDT): https://github.com/universal-design-tokens/udt
- standard-schema validation: https://github.com/universse/w3c-design-tokens-standard-schema
- TschesDev types/schema: https://github.com/TschesDev/w3c-design-tokens

## The framing

The parse/walk of a DTCG file (tree traversal, `$type` inheritance, alias
resolution, validation) is a solved, undifferentiated problem. We should reuse it,
not rebuild it. Our differentiated value is converting tokens into this project's
typed lexicon vars (`m()`, `color()`), which nothing else does.

Axes that matter to us: control (a library we call vs a framework we live inside),
reuse (not from scratch), and buy-in / longevity (adoption, maintenance, dependency
weight).

## The landscape

| Tool | What it is | Control | Buy-in / longevity |
| --- | --- | --- | --- |
| Style Dictionary | Build framework (CLI + config + transforms) | Low: you host inside it | Highest. ~4.7k stars, v5.4.4 (Jun 2026), institutional, Apache-2.0 |
| Terrazzo | DTCG codegen tool whose parser is a standalone lib (`@terrazzo/parser`) | High if you use just the parser | Solid. ~409 stars, very active (Jun 2026), MIT, minimal deps |
| `@nclsndr/w3c-design-tokens-parser` | Focused parser library (`parseJSONTokenTree`) | Highest: pure library | Low/risky. ~11 stars, v0.2.0 (~1yr old), solo maintainer, pulls in the heavy `Effect` runtime |
| UDT `@udt/dtcg-parser` | Parser by a DTCG spec editor (James Nash) | High: library | Authoritative lineage, but pre-release hobby, no release yet, slow |
| `w3c-design-tokens-standard-schema` / TschesDev | Validation + types (Zod / JSON Schema) | Library | Smaller; they validate and type, they do not fully resolve (aliases/inheritance) |

## What the standard tooling does

Style Dictionary v4+ and Terrazzo are the two mainstream DTCG codegen tools. Both
parse DTCG and generate platform output (CSS, JS/TS, Tailwind, iOS, Android). What
none of them do is emit *our* typed lexicon vars; that is the part we own.

Notably, `@terrazzo/parser` is published separately from the Terrazzo CLI and is
usable on its own. Its `parse()` returns a fully-resolved token graph (per token:
`id`, `$type`, resolved `$value`, `aliasOf`, `originalValue`, `group`, source), so
we can reuse the hard parsing while keeping our own emit and config.

## Recommendation

**Reuse `@terrazzo/parser` as a library only.** Call its `parse()` for the resolved
token graph; do not adopt the Terrazzo CLI, plugin system, or config. We keep our
own emit and our own configuration. This balances the three axes best: mature,
well-maintained, spec-tracking parsing without adopting a framework.

It supersedes the more focused `@nclsndr/w3c-design-tokens-parser`, which the
adoption, longevity, and dependency signals argue against (solo maintainer, ~11
stars, stale, heavy `Effect` dependency).

Alternatives, if priorities shift: host inside Style Dictionary (maximum buy-in,
least control, config bends to Style Dictionary), or write a Terrazzo plugin (least
code, config bends to Terrazzo). Both trade away the bespoke config we want.

## Delivery shape (decided)

An agnostic Node CLI, summoned via scripts. No coupling to any consumer's
framework, bundler, or build tool, so any project can run it regardless of stack.
Run on demand (a `package.json` script, a git hook, whatever the dev wires up), not
a watcher.
