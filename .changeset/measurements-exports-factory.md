---
"@css-bookends/css-calipers": minor
---

The `/measurements` subpath now exports `createCalipersFactory`, so the measurement
lexicon can be constructed through its factory without importing from `/codex`
or `/factory`. The `@css-bookends/measurement` slice re-exports it and stays
colour-free. (Integer, float, and ratio already exported their factories.)
