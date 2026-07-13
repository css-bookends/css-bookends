import type { MeasurementOf } from '../core';
import { makeUnitHelperFromDefinition } from '../default';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

export const mPx = makeUnitHelperFromDefinition('mPx');
export const mCm = makeUnitHelperFromDefinition('mCm');
export const mMm = makeUnitHelperFromDefinition('mMm');
export const mQ = makeUnitHelperFromDefinition('mQ');
export const mIn = makeUnitHelperFromDefinition('mIn');
export const mPc = makeUnitHelperFromDefinition('mPc');
export const mPt = makeUnitHelperFromDefinition('mPt');

export type PxMeasurement = MeasurementOf<typeof mPx>;
export type CmMeasurement = MeasurementOf<typeof mCm>;
export type MmMeasurement = MeasurementOf<typeof mMm>;
export type QMeasurement = MeasurementOf<typeof mQ>;
export type InMeasurement = MeasurementOf<typeof mIn>;
export type PcMeasurement = MeasurementOf<typeof mPc>;
export type PtMeasurement = MeasurementOf<typeof mPt>;

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
