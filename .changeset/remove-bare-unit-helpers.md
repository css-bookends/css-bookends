---
"@css-bookends/css-calipers": major
---

**Breaking:** the bare unit helpers (`mPx`, `mVh`, `mRem`, `mPercent`, and the
~70 others) and the bare `isPercentMeasurement` / `assertPercentMeasurement` are
no longer exported from the package root, the `/measurements` subpath, or the
`/units` subpaths. Each `/units/<group>` subpath (and the `/units` aggregator)
now exposes the per-group FACTORY instead.

Migration: get unit helpers by calling a group factory, e.g.
`const { mPx } = createAbsoluteUnits()`, `const { mVh } = createViewportUnits()`,
or the whole surface at once with `const { mPx, mVh, ... } = createCalipersBundle()`.
The percent guard and assert come from `createPercentUnits()` (or the bundle). The
per-unit measurement TYPES (`PxMeasurement`, `DegMeasurement`, ...) are unchanged.
