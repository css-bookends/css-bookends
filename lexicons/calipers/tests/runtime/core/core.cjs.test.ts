// Core tests against the built CommonJS artifact (dist, cjs output).
import type { CoreApi } from './core.shared';
import { runCoreTests } from './core.shared';

// Dynamic import works with CommonJS output and will fail fast if the
// artifact does not exist or exports are incorrect.
const cjsModule = await import('../../../dist/index.js');

const {
  assertMatchingUnits,
  assertUnit,
  assertCondition,
  isMeasurement,
  m,
  mPercent,
  mPx,
  mCm,
  mEm,
  mVh,
  mSvw,
  mLvw,
  mDvw,
  mCqh,
  mDeg,
  mMs,
  mKhz,
  mDpi,
  mFr,
  mCqw,
  isPercentMeasurement,
  assertPercentMeasurement,
  makeUnitHelper,
  makeUnitHelperFromDefinition,
  measurementUnitMetadata,
  makeUnitAssert,
  makeUnitGuard,
  hasCssMethod,
  measurementMax,
  measurementMin,
  setErrorConfig,
  getErrorConfig,
} = cjsModule;

const api = {
  m,
  mPercent,
  mPx,
  mCm,
  mEm,
  mVh,
  mSvw,
  mLvw,
  mDvw,
  mCqh,
  mDeg,
  mMs,
  mKhz,
  mDpi,
  mFr,
  mCqw,
  assertMatchingUnits,
  assertUnit,
  assertCondition,
  isMeasurement,
  isPercentMeasurement,
  assertPercentMeasurement,
  makeUnitHelper,
  makeUnitHelperFromDefinition,
  measurementUnitMetadata,
  makeUnitAssert,
  makeUnitGuard,
  hasCssMethod,
  measurementMin,
  measurementMax,
  setErrorConfig,
  getErrorConfig,
};

// The built dist now carries real types (tsup); the harness type is loose
// (MeasurementLike), so bridge it the same way core.src.test.ts does.
runCoreTests('cjs', api as unknown as CoreApi);
