---
"@css-bookends/css-calipers": minor
---

Add `createRatioFactory`, the ratio lexicon's factory. It matches `createIntegerFactory`,
`createFloatFactory`, and `createColorFactory`: call the factory and use the `{ r, isRatio }`
surface it returns. Ratio is config-free today, so `createRatioFactory` accepts an
empty config, leaving room to add options later without changing call sites.
