import type { MeasurementOf } from '../core';
import { makeUnitHelperFromDefinition } from '../default';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

export const mLvw = makeUnitHelperFromDefinition('mLvw');
export const mLvh = makeUnitHelperFromDefinition('mLvh');
export const mLvi = makeUnitHelperFromDefinition('mLvi');
export const mLvb = makeUnitHelperFromDefinition('mLvb');
export const mLvmin = makeUnitHelperFromDefinition('mLvmin');
export const mLvmax = makeUnitHelperFromDefinition('mLvmax');

export type LvwMeasurement = MeasurementOf<typeof mLvw>;
export type LvhMeasurement = MeasurementOf<typeof mLvh>;
export type LviMeasurement = MeasurementOf<typeof mLvi>;
export type LvbMeasurement = MeasurementOf<typeof mLvb>;
export type LvminMeasurement = MeasurementOf<typeof mLvmin>;
export type LvmaxMeasurement = MeasurementOf<typeof mLvmax>;

/** Factory for the large-viewport helpers, bound through `createCalipers`. */
export const createViewportLargeUnits = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipers(config);
  return {
    mLvw: core.makeUnitHelperFromDefinition('mLvw'),
    mLvh: core.makeUnitHelperFromDefinition('mLvh'),
    mLvi: core.makeUnitHelperFromDefinition('mLvi'),
    mLvb: core.makeUnitHelperFromDefinition('mLvb'),
    mLvmin: core.makeUnitHelperFromDefinition('mLvmin'),
    mLvmax: core.makeUnitHelperFromDefinition('mLvmax'),
  };
};
