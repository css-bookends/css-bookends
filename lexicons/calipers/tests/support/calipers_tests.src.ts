/* eslint-disable no-restricted-syntax -- this file IS the source binder: it binds the
   codex once and re-exports the bound surface; that single bind is the point. */

// =============================================================================
//  TEST-ONLY FIXTURE. DO NOT IMPORT THIS INTO A PROJECT OR ANY NON-TEST CODE.
//  It exists ONLY to bind the codex once for the test suite (the bind-once pattern,
//  dogfooded). A real consumer binds `createCalipersBundleFactory()` in their OWN module and
//  never touches this file. It lives under `tests/support/` and is named `*_tests.*`
//  precisely so it cannot be mistaken for a public export. It is not part of the
//  published package surface.
// =============================================================================
//
// SOURCE tier: binds from `../../src/codex`, so the runtime `*.src.test.ts` suite runs
// against SOURCE (fast, no build). Re-exports the full named surface so every test
// `import { m, mVh, color }` by name and never destructures a bundle at the use site.
// The DIST tier is `calipers_tests.dist.ts`; see `two-tier-testing`.
//
// Tests whose SUBJECT is a factory or its config (factory.shared, scalar-factories,
// unit-group-factories, codex, hardening) still build their own instances on purpose.
// `bundle` is exported ONLY for the units round-trip map and the CoreApi harness.
import {
  createCalipersBundleFactory,
  type UnitAssertion,
} from '../../src/codex';

export const bundle = createCalipersBundleFactory();

export const {
  // measurement core + builders / guards / refinements / error accessors
  m,
  isMeasurement,
  assertMatchingUnits,
  measurementMin,
  measurementMax,
  measurementUnitMetadata,
  makeUnitHelper,
  makeUnitHelperFromDefinition,
  makeUnitGuard,
  makeUnitAssert,
  hasCssMethod,
  assertUnit,
  assertCondition,
  makeMeasurementRefinement,
  nonNegative,
  nonPositive,
  inRange,
  getErrorConfig,
  setErrorConfig,
  isPercentMeasurement,
  // scalars
  r,
  i,
  f,
  isInteger,
  isFloat,
  isRatio,
  // colour
  color,
  // unit helpers (the families the suite exercises)
  mPx,
  mEm,
  mVw,
  mVh,
  mSvw,
  mLvw,
  mDvw,
  mCqw,
  mDeg,
  mS,
  mMs,
  mHz,
  mDpi,
  mFr,
  mPercent,
} = bundle;

// An assertion function is callable as an assertion only if its binding carries an
// explicit type annotation, so it gets one here (destructured consts do not).
export const assertPercentMeasurement: UnitAssertion<
  typeof mPercent
> = bundle.assertPercentMeasurement;

// Scalar refinements are bare exports (not on the bundle), so re-export them straight from the
// source surface for the type + runtime tests.
export {
  inRangeFloat,
  inRangeInteger,
  makeFloatRefinement,
  makeIntegerRefinement,
  nonNegativeFloat,
  nonNegativeInteger,
  nonPositiveFloat,
  nonPositiveInteger,
} from '../../src/codex';
