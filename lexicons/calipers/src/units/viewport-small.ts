import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

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

type ViewportSmallHelpers = ReturnType<
  typeof createViewportSmallUnits
>;
export type SvwMeasurement = MeasurementOf<
  ViewportSmallHelpers['mSvw']
>;
export type SvhMeasurement = MeasurementOf<
  ViewportSmallHelpers['mSvh']
>;
export type SviMeasurement = MeasurementOf<
  ViewportSmallHelpers['mSvi']
>;
export type SvbMeasurement = MeasurementOf<
  ViewportSmallHelpers['mSvb']
>;
export type SvminMeasurement = MeasurementOf<
  ViewportSmallHelpers['mSvmin']
>;
export type SvmaxMeasurement = MeasurementOf<
  ViewportSmallHelpers['mSvmax']
>;
