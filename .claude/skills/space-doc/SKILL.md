---
name: space-doc
description: How to write a `<name>-space.md` doc - the full range of valid CSS values for a property, property family, or value type, straight from the spec, implementation-agnostic. Use when documenting the value surface a book must cover (e.g. padding-space.md, margin-space.md) before designing input, or when reviewing such a doc.
---

# space-doc

A `*-space.md` is the **value-surface contract from the CSS spec**: the full range of
values that are *valid* for a property (or tight family, or value type), independent of
what any book implements. It is the map of the territory. Coverage decisions - what a book
accepts, rejects, or defers - are a separate concern tracked elsewhere.

**North star: document what CSS allows, not what we build.**

## Rules

- **Spec, not implementation.** No backing-library names, no test grids, no config knobs,
  no "we accept / reject / defer / normalize". Those belong in the book's coverage doc and
  tests. A single pointer line to where coverage is tracked is allowed; nothing more.
- **Exhaustive on the value surface, organized for reading.** Every value type, keyword,
  functional notation, and CSS-wide keyword the thing accepts per spec. ("Comprehensive,
  not exhaustive" is a coverage-doc stance; a space doc aims for the whole valid surface.)
- **Authoritative sources only.** W3C TR specs first, MDN second. Cite every source with a
  URL at the bottom; note the spec module / level where it matters, and flag anything not
  yet at a stable level.
- **Name `<thing>-space.md`** - one per property, tight family (e.g. `padding` + its
  longhands), or value type. Examples: `padding-space.md`, `margin-space.md`,
  `color-space.md`.
- **Value surface, not layout behavior.** Document values; exclude behavior that does not
  change which values are valid (e.g. margin collapsing). Mention behavior only when it
  constrains valid values (e.g. what a `<percentage>` resolves against).

## Anatomy (adapt to property vs value type)

1. **Identity & grammar.** What it is; the formal value-definition syntax from the spec
   (e.g. `padding-top = <length-percentage [0,∞]>`). For a property, the shorthand ↔
   longhand set, **physical and logical**.
2. **Value types.** Each `<data-type>` accepted (`<length>`, `<percentage>` + its basis,
   `<number>`, `<length-percentage>`, …) with ranges / constraints (e.g. non-negative).
3. **Keywords.** Property-specific keywords (e.g. `auto`) and the CSS-wide keywords
   (`inherit` / `initial` / `unset` / `revert` / `revert-layer`).
4. **Functional notations.** Which are valid: `calc()` / `min()` / `max()` / `clamp()`,
   `var()`, `env()`, and any specific to the thing (e.g. `anchor-size()`, `color-mix()`).
5. **Canonical facts** (properties only): initial value, inherited?, computed value,
   animation type. Skip for a pure value-type doc.
6. **Spec notes / edge cases** that bear on which values are valid.
7. **Sources.**

## Template

```md
# <name> value surface

The valid CSS value surface for `<name>` per the spec. Implementation-agnostic; what our
book covers is tracked in <coverage doc / tests>.

## Grammar
...
## Value types
...
## Keywords
...
## Functional notations
...
## Canonical facts            (properties only)
| initial | inherited | computed value | animation type |
| --- | --- | --- | --- |
...
## Notes
...
## Sources
- <W3C module>: <url>
- MDN <page>: <url>
```

## Gate

Done when the doc enumerates the full valid surface from cited spec sources, makes no
implementation or coverage claims, and a reader could design a spec-complete input contract
from it alone.
