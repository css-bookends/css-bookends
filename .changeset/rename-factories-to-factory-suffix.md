---
"@css-bookends/css-calipers": major
"@css-bookends/compendium": major
---

**Breaking:** every calipers factory is renamed `create*` -> `create*Factory`, so the
name reads as "make a configured factory" instead of "make one value". Renamed:
`createInteger`, `createFloat`, `createRatio`, `createColor`, `createCalipers`,
`createCalipersBundle`, `createScalarBundle`, and every unit-group factory
(`createAbsoluteUnits`, `createViewportUnits`, ... -> `create*UnitsFactory`).

Kept as-is (none reads as "make a value"): internal `createCoreApi` / `createUnitHelper`
plumbing, and the value BUILDER `createMeasurement`.

Migration: rename every import and call site, e.g.

    - import { createInteger } from '@css-bookends/css-calipers';
    + import { createIntegerFactory } from '@css-bookends/css-calipers';

    - const { i } = createInteger({ min: 0, max: 1 });
    + const { i } = createIntegerFactory({ min: 0, max: 1 });

The bound helpers (`m` / `i` / `f` / `r` / `color`) and every value API are unchanged;
only the factory entry points gain the `Factory` suffix.
