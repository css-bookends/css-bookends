/* eslint-disable no-restricted-syntax, no-restricted-imports -- this whole file
   verifies the EXPORT SURFACE: it imports bound values and calls the /units factories
   from dist to assert they are exported. */
import { expectAssignable } from 'tsd';

import {
  type CqwMeasurement,
  type DegMeasurement,
  type DpiMeasurement,
  type DvwMeasurement,
  type EmMeasurement,
  type ErrorCode,
  type ErrorConfig,
  type FrMeasurement,
  type HzMeasurement,
  type IMeasurement,
  type IRatio,
  isRatio,
  type LvwMeasurement,
  type MeasurementOf,
  type MeasurementString,
  type MeasurementUnitCategory,
  type MeasurementUnitDefinition,
  normalizeRatio,
  parseRatio,
  r,
  type RatioParts,
  ratioToFloat,
  reduceRatio,
  simplifyRatio,
  type SMeasurement,
  type SvwMeasurement,
  type TimeMeasurement,
  toFloat,
  type UnitAssertion,
  type UnitGuard,
  type VwMeasurement,
} from '../../dist/index';
import * as Units from '../../dist/units';
import {
  assertCondition,
  assertPercentMeasurement,
  getErrorConfig,
  hasCssMethod,
  isMeasurement,
  isPercentMeasurement,
  m,
  makeUnitAssert,
  makeUnitGuard,
  mCqw,
  mDeg,
  mDpi,
  mDvw,
  measurementMax,
  measurementMin,
  measurementUnitMetadata,
  mEm,
  mFr,
  mHz,
  mLvw,
  mMs,
  mPercent,
  mPx,
  mS,
  mSvw,
  mVw,
  setErrorConfig,
} from '../support/calipers_tests.dist';

// Default unit (no explicit unit argument) is accepted from the public entry
const apiImplicitMeasurement = m(10);
expectAssignable<IMeasurement<string>>(apiImplicitMeasurement);

const apiMeasurementPx = m(10, 'px');
expectAssignable<IMeasurement<'px'>>(apiMeasurementPx);

expectAssignable<IMeasurement<'px'>>(mPx(4));
expectAssignable<IMeasurement<'%'>>(mPercent(50));

const apiMeasurementPercent = m(10, '%');
expectAssignable<IMeasurement<'%'>>(apiMeasurementPercent);

const errorConfig: ErrorConfig = getErrorConfig();
setErrorConfig(errorConfig);
const errorCode: ErrorCode = 'CALIPERS_E_NONFINITE';
void errorCode;

// Guards and assertions are exported with the expected shapes
declare const unknownValue: unknown;

if (isMeasurement(unknownValue)) {
  expectAssignable<IMeasurement<string>>(unknownValue);
}

if (isPercentMeasurement(unknownValue)) {
  expectAssignable<IMeasurement<'%'>>(unknownValue);
}

declare let maybePercentValue: unknown;

const useApiAssertPercent = () => {
  assertPercentMeasurement(maybePercentValue);
  expectAssignable<IMeasurement<'%'>>(maybePercentValue);
};
void useApiAssertPercent;

// MeasurementString and unit metadata types are exported and coherent
declare const pxCss: MeasurementString<'px'>;
expectAssignable<string>(pxCss);

const percentMeta = measurementUnitMetadata.mPercent;
expectAssignable<MeasurementUnitDefinition>(percentMeta);

declare const category: MeasurementUnitCategory;
void category;

// A spot-check per unit family, from the bundle's bound helpers
expectAssignable<IMeasurement<'em'>>(mEm(1));
expectAssignable<IMeasurement<'vw'>>(mVw(10));
expectAssignable<IMeasurement<'svw'>>(mSvw(10));
expectAssignable<IMeasurement<'lvw'>>(mLvw(10));
expectAssignable<IMeasurement<'dvw'>>(mDvw(10));
expectAssignable<IMeasurement<'cqw'>>(mCqw(10));
expectAssignable<IMeasurement<'deg'>>(mDeg(90));
expectAssignable<IMeasurement<'s'>>(mS(1));
expectAssignable<IMeasurement<'ms'>>(mMs(250));
expectAssignable<IMeasurement<'hz'>>(mHz(60));
expectAssignable<IMeasurement<'dpi'>>(mDpi(96));
expectAssignable<IMeasurement<'fr'>>(mFr(1));

// The ./units aggregator exposes the group FACTORIES, which return the helpers.
const vpUnits = Units.createViewportUnits();
expectAssignable<IMeasurement<'vw'>>(vpUnits.mVw(5));
const absUnits = Units.createAbsoluteUnits();
expectAssignable<IMeasurement<'px'>>(absUnits.mPx(2));
const timeUnits = Units.createTimeUnits();
expectAssignable<TimeMeasurement>(timeUnits.mS(2));
expectAssignable<TimeMeasurement>(timeUnits.mMs(250));

// Alias types are consistent with their underlying measurement units
expectAssignable<IMeasurement<'em'>>({} as EmMeasurement);
expectAssignable<IMeasurement<'vw'>>({} as VwMeasurement);
expectAssignable<IMeasurement<'svw'>>({} as SvwMeasurement);
expectAssignable<IMeasurement<'lvw'>>({} as LvwMeasurement);
expectAssignable<IMeasurement<'dvw'>>({} as DvwMeasurement);
expectAssignable<IMeasurement<'cqw'>>({} as CqwMeasurement);
expectAssignable<IMeasurement<'deg'>>({} as DegMeasurement);
expectAssignable<IMeasurement<'s'>>({} as SMeasurement);
expectAssignable<IMeasurement<'hz'>>({} as HzMeasurement);
expectAssignable<IMeasurement<'dpi'>>({} as DpiMeasurement);
expectAssignable<IMeasurement<'fr'>>({} as FrMeasurement);

// Generic helpers and types are exported and consistent with concrete helpers
type PercentFromHelper = MeasurementOf<typeof mPercent>;
expectAssignable<IMeasurement<'%'>>({} as PercentFromHelper);

type PercentGuard = UnitGuard<typeof mPercent>;
type PercentAssert = UnitAssertion<typeof mPercent>;

const guardFromFactory = makeUnitGuard(mPercent);
const assertFromFactory = makeUnitAssert(mPercent);

expectAssignable<PercentGuard>(isPercentMeasurement);
expectAssignable<PercentGuard>(guardFromFactory);

expectAssignable<PercentAssert>(assertPercentMeasurement);
expectAssignable<PercentAssert>(assertFromFactory);

// measurementMin and measurementMax preserve unit types
const minPx = measurementMin(m(1, 'px'), m(2, 'px'));
expectAssignable<IMeasurement<'px'>>(minPx);

const maxPercent = measurementMax(mPercent(10), mPercent(20));
expectAssignable<IMeasurement<'%'>>(maxPercent);

expectAssignable<IRatio>(r(16, 9));
expectAssignable<IRatio>(normalizeRatio(r(16, 9)));
expectAssignable<IRatio>(reduceRatio(r(16, 9)));
expectAssignable<IRatio>(simplifyRatio(r(16, 9)));
expectAssignable<RatioParts | null>(parseRatio('16/9'));
expectAssignable<number>(ratioToFloat(r(4, 3)));
expectAssignable<number>(toFloat(r(4, 3)));
expectAssignable<(value: unknown) => value is IRatio>(isRatio);
expectAssignable<IRatio>(r(4, { simplify: true }));

// assertCondition and hasCssMethod are exported with expected shapes
assertCondition(true, 'should accept boolean');
assertCondition(() => true, 'should accept thunk');

declare const maybeHasCss: unknown;
if (hasCssMethod(maybeHasCss)) {
  expectAssignable<() => string>(maybeHasCss.css);
}
