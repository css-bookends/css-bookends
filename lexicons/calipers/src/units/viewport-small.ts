import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipersFactory,
} from '../factory';

/** Factory for the small-viewport helpers, bound through `createCalipersFactory`. */
export const createViewportSmallUnitsFactory = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipersFactory(config);
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
  typeof createViewportSmallUnitsFactory
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
