---
"@css-bookends/css-calipers": minor
---

Add `createRatio`, the ratio lexicon's factory. It matches `createInteger`,
`createFloat`, and `createColor`: call the factory and use the `{ r, isRatio }`
surface it returns. Ratio is config-free today, so `createRatio` accepts an
empty config, leaving room to add options later without changing call sites.
