/* eslint-disable no-restricted-syntax -- this file IS the examples binder: it binds
   the codex once and re-exports the bound helpers; that single bind is the point. */
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
