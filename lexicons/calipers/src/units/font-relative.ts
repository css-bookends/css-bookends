import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

/** Factory for the font-relative helpers, bound through `createCalipers`. */
export const createFontRelativeUnits = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipers(config);
  return {
    mEm: core.makeUnitHelperFromDefinition('mEm'),
    mRem: core.makeUnitHelperFromDefinition('mRem'),
    mEx: core.makeUnitHelperFromDefinition('mEx'),
    mRex: core.makeUnitHelperFromDefinition('mRex'),
    mCh: core.makeUnitHelperFromDefinition('mCh'),
    mRch: core.makeUnitHelperFromDefinition('mRch'),
    mCap: core.makeUnitHelperFromDefinition('mCap'),
    mRcap: core.makeUnitHelperFromDefinition('mRcap'),
    mIc: core.makeUnitHelperFromDefinition('mIc'),
    mRic: core.makeUnitHelperFromDefinition('mRic'),
    mLh: core.makeUnitHelperFromDefinition('mLh'),
    mRlh: core.makeUnitHelperFromDefinition('mRlh'),
  };
};

type FontRelativeHelpers = ReturnType<typeof createFontRelativeUnits>;
export type EmMeasurement = MeasurementOf<FontRelativeHelpers['mEm']>;
export type RemMeasurement = MeasurementOf<
  FontRelativeHelpers['mRem']
>;
export type ExMeasurement = MeasurementOf<FontRelativeHelpers['mEx']>;
export type RexMeasurement = MeasurementOf<
  FontRelativeHelpers['mRex']
>;
export type ChMeasurement = MeasurementOf<FontRelativeHelpers['mCh']>;
export type RchMeasurement = MeasurementOf<
  FontRelativeHelpers['mRch']
>;
export type CapMeasurement = MeasurementOf<
  FontRelativeHelpers['mCap']
>;
export type RcapMeasurement = MeasurementOf<
  FontRelativeHelpers['mRcap']
>;
export type IcMeasurement = MeasurementOf<FontRelativeHelpers['mIc']>;
export type RicMeasurement = MeasurementOf<
  FontRelativeHelpers['mRic']
>;
export type LhMeasurement = MeasurementOf<FontRelativeHelpers['mLh']>;
export type RlhMeasurement = MeasurementOf<
  FontRelativeHelpers['mRlh']
>;
