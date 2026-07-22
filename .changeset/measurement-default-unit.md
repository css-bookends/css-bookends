---
"@css-bookends/css-calipers": minor
---

Add a `defaultUnit` option to `createCalipersFactory`. `createCalipersFactory({ defaultUnit:
'%' }).m(50)` now yields `50%`; it defaults to `px`, an explicit `m(value,
unit)` still overrides it, and the fixed-unit helpers (`mVh`, `mRem`, ...) are
unaffected.
