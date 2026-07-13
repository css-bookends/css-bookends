import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

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

type ViewportLargeHelpers = ReturnType<
  typeof createViewportLargeUnits
>;
export type LvwMeasurement = MeasurementOf<
  ViewportLargeHelpers['mLvw']
>;
export type LvhMeasurement = MeasurementOf<
  ViewportLargeHelpers['mLvh']
>;
export type LviMeasurement = MeasurementOf<
  ViewportLargeHelpers['mLvi']
>;
export type LvbMeasurement = MeasurementOf<
  ViewportLargeHelpers['mLvb']
>;
export type LvminMeasurement = MeasurementOf<
  ViewportLargeHelpers['mLvmin']
>;
export type LvmaxMeasurement = MeasurementOf<
  ViewportLargeHelpers['mLvmax']
>;
