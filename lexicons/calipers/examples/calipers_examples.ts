/* eslint-disable no-restricted-syntax, no-restricted-imports -- this file IS the
   examples binder: it binds the codex once and re-exports the bound helpers AND the
   calipers types, so every consumer imports from HERE, not the package. */
// The single binding module for the examples (the RECOMMENDED pattern). Call the
// codex bundle ONCE here with NO config (everything at its defaults), export the
// bound helpers, and import from THIS file in every default example. Reach for a
// factory inline only when a custom config or a second instance IS the point of the
// example (those are the allowlisted exceptions in eslint.config.js). Mirrors
// `examples/bind-once/calipers.ts`; see that mini-project + the factory-first
// pattern doc for the full rationale.
import { createCalipersBundle } from '@css-bookends/css-calipers';

export const {
  assertMatchingUnits,
  color,
  f,
  hardenFloat,
  hardenInteger,
  i,
  inRange,
  isMeasurement,
  m,
  makeMeasurementRefinement,
  mDeg,
  nonNegative,
  nonPositive,
  r,
} = createCalipersBundle();

// Calipers TYPES re-exported so consumers import them from the binder too (a package
// or path move is then a one-file edit). Types are erased at build, so this is a
// pure compile-time convenience.
export type {
  ColorConfig,
  ColorFormatPlugin,
  ColorObject,
  ColorString,
  InRangeMeasurement,
  NonNegativeMeasurement,
} from '@css-bookends/css-calipers';

// Module-level statics with no factory home (ratio math), re-exported so consumers
// import them from the binder too, same path-safety reason as the bound helpers.
export {
  normalizeRatio,
  parseRatio,
  ratioToFloat,
  reduceRatio,
  simplifyRatio,
  toFloat,
} from '@css-bookends/css-calipers';

