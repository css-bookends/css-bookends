import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipersFactory,
} from '../factory';

/** Factory for the absolute-length helpers, bound through `createCalipersFactory`. */
export const createAbsoluteUnitsFactory = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipersFactory(config);
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

type AbsoluteHelpers = ReturnType<typeof createAbsoluteUnitsFactory>;
export type PxMeasurement = MeasurementOf<AbsoluteHelpers['mPx']>;
export type CmMeasurement = MeasurementOf<AbsoluteHelpers['mCm']>;
export type MmMeasurement = MeasurementOf<AbsoluteHelpers['mMm']>;
export type QMeasurement = MeasurementOf<AbsoluteHelpers['mQ']>;
export type InMeasurement = MeasurementOf<AbsoluteHelpers['mIn']>;
export type PcMeasurement = MeasurementOf<AbsoluteHelpers['mPc']>;
export type PtMeasurement = MeasurementOf<AbsoluteHelpers['mPt']>;
