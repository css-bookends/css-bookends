---
"@css-bookends/css-calipers": major
---

**Breaking:** `createCalipers()` now returns the measurement CORE only: `m` plus
the builders, guards, refinements, and error-config accessors. It no longer
carries the bound unit helpers (`mPx`, `mVh`, ...), the `units` namespace, or
`isPercentMeasurement` / `assertPercentMeasurement`.

Migration: get the unit helpers from their per-group factory
(`createViewportUnits()`, `createAbsoluteUnits()`, ...) or from the codex bundle
`createCalipersBundle()`, which still returns the whole bound surface. The percent
guard and assert now come from `createPercentUnits()`.
