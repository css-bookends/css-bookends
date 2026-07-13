import type { MeasurementOf } from '../core';
import { makeUnitHelperFromDefinition } from '../default';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

export const mEm = makeUnitHelperFromDefinition('mEm');
export const mRem = makeUnitHelperFromDefinition('mRem');
export const mEx = makeUnitHelperFromDefinition('mEx');
export const mRex = makeUnitHelperFromDefinition('mRex');
export const mCh = makeUnitHelperFromDefinition('mCh');
export const mRch = makeUnitHelperFromDefinition('mRch');
export const mCap = makeUnitHelperFromDefinition('mCap');
export const mRcap = makeUnitHelperFromDefinition('mRcap');
export const mIc = makeUnitHelperFromDefinition('mIc');
export const mRic = makeUnitHelperFromDefinition('mRic');
export const mLh = makeUnitHelperFromDefinition('mLh');
export const mRlh = makeUnitHelperFromDefinition('mRlh');

export type EmMeasurement = MeasurementOf<typeof mEm>;
export type RemMeasurement = MeasurementOf<typeof mRem>;
export type ExMeasurement = MeasurementOf<typeof mEx>;
export type RexMeasurement = MeasurementOf<typeof mRex>;
export type ChMeasurement = MeasurementOf<typeof mCh>;
export type RchMeasurement = MeasurementOf<typeof mRch>;
export type CapMeasurement = MeasurementOf<typeof mCap>;
export type RcapMeasurement = MeasurementOf<typeof mRcap>;
export type IcMeasurement = MeasurementOf<typeof mIc>;
export type RicMeasurement = MeasurementOf<typeof mRic>;
export type LhMeasurement = MeasurementOf<typeof mLh>;
export type RlhMeasurement = MeasurementOf<typeof mRlh>;

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
