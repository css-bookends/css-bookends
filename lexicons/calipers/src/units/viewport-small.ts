import type { MeasurementOf } from '../core';
import { makeUnitHelperFromDefinition } from '../default';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

export const mSvw = makeUnitHelperFromDefinition('mSvw');
export const mSvh = makeUnitHelperFromDefinition('mSvh');
export const mSvi = makeUnitHelperFromDefinition('mSvi');
export const mSvb = makeUnitHelperFromDefinition('mSvb');
export const mSvmin = makeUnitHelperFromDefinition('mSvmin');
export const mSvmax = makeUnitHelperFromDefinition('mSvmax');

export type SvwMeasurement = MeasurementOf<typeof mSvw>;
export type SvhMeasurement = MeasurementOf<typeof mSvh>;
export type SviMeasurement = MeasurementOf<typeof mSvi>;
export type SvbMeasurement = MeasurementOf<typeof mSvb>;
export type SvminMeasurement = MeasurementOf<typeof mSvmin>;
export type SvmaxMeasurement = MeasurementOf<typeof mSvmax>;

/** Factory for the small-viewport helpers, bound through `createCalipers`. */
export const createViewportSmallUnits = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipers(config);
  return {
    mSvw: core.makeUnitHelperFromDefinition('mSvw'),
    mSvh: core.makeUnitHelperFromDefinition('mSvh'),
    mSvi: core.makeUnitHelperFromDefinition('mSvi'),
    mSvb: core.makeUnitHelperFromDefinition('mSvb'),
    mSvmin: core.makeUnitHelperFromDefinition('mSvmin'),
    mSvmax: core.makeUnitHelperFromDefinition('mSvmax'),
  };
};
