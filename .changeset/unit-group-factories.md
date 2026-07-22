---
"@css-bookends/css-calipers": minor
---

Add a factory for each unit group: `createAbsoluteUnitsFactory`, `createAngleUnitsFactory`,
`createContainerUnitsFactory`, `createFontRelativeUnitsFactory`, `createFrequencyUnitsFactory`,
`createGridUnitsFactory`, `createPercentUnitsFactory`, `createResolutionUnitsFactory`,
`createTimeUnitsFactory`, `createViewportUnitsFactory`, `createViewportDynamicUnitsFactory`,
`createViewportLargeUnitsFactory`, and `createViewportSmallUnitsFactory`. Each returns its
group's helpers bound through `createCalipersFactory`.
