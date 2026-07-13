import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

/** Factory for the absolute-length helpers, bound through `createCalipers`. */
export const createAbsoluteUnits = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipers(config);
  return {
    mPx: core.makeUnitHelperFromDefinition('mPx'),
    mCm: core.makeUnitHelperFromDefinition('mCm'),
    mMm: core.makeUnitHelperFromDefinition('mMm'),
    mQ: core.makeUnitHelperFromDefinition('mQ'),
    mIn: core.makeUnitHelperFromDefinition('mIn'),
    mPc: core.makeUnitHelperFromDefinition('mPc'),
    mPt: core.makeUnitHelperFromDefinition('mPt'),
  };
};

type AbsoluteHelpers = ReturnType<typeof createAbsoluteUnits>;
export type PxMeasurement = MeasurementOf<AbsoluteHelpers['mPx']>;
export type CmMeasurement = MeasurementOf<AbsoluteHelpers['mCm']>;
export type MmMeasurement = MeasurementOf<AbsoluteHelpers['mMm']>;
export type QMeasurement = MeasurementOf<AbsoluteHelpers['mQ']>;
export type InMeasurement = MeasurementOf<AbsoluteHelpers['mIn']>;
export type PcMeasurement = MeasurementOf<AbsoluteHelpers['mPc']>;
export type PtMeasurement = MeasurementOf<AbsoluteHelpers['mPt']>;
