---
"@css-bookends/css-calipers": minor
---

`createCalipersBundleFactory` (the codex) now aggregates every sub-factory: the ratio
lexicon and all 13 unit-group factories, alongside measurements, integer, float,
and colour. Each has an optional config key (`ratio`, `viewport`, `fontRelative`,
...) that cascades from its own key to the shared `global` to the factory
default. `createCalipersBundleFactory()` with no config returns the whole bound surface
at defaults, ready to bind once and re-export.
