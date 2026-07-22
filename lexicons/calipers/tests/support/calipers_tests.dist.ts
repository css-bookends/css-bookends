/* eslint-disable no-restricted-syntax -- this file IS the dist binder: it binds the
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
// DIST tier: binds ONCE from the BUILT `../../dist/codex`, so it proves the thing we
// actually PUBLISH is correct (built runtime + built `.d.ts`). Values AND types both
// come from `dist` here, so the branded `unique symbol` types line up with tsd type
// imports from `../../dist/*`. The source tier lives in `calipers_tests.src.ts`; see
// `two-tier-testing`. `bundle` is exported ONLY for whole-object needs.
import {
  createCalipersBundleFactory,
  type UnitAssertion,
} from '../../dist/codex';

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
// built surface for the type + runtime tests.
export {
  inRangeFloat,
  inRangeInteger,
  makeFloatRefinement,
  makeIntegerRefinement,
  nonNegativeFloat,
  nonNegativeInteger,
  nonPositiveFloat,
  nonPositiveInteger,
} from '../../dist/codex';
