import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipersFactory,
} from '../factory';

/** Factory for the dynamic-viewport helpers, bound through `createCalipersFactory`. */
export const createViewportDynamicUnitsFactory = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipersFactory(config);
  return {
    mDvw: core.makeUnitHelperFromDefinition('mDvw'),
    mDvh: core.makeUnitHelperFromDefinition('mDvh'),
    mDvi: core.makeUnitHelperFromDefinition('mDvi'),
    mDvb: core.makeUnitHelperFromDefinition('mDvb'),
    mDvmin: core.makeUnitHelperFromDefinition('mDvmin'),
    mDvmax: core.makeUnitHelperFromDefinition('mDvmax'),
  };
};

type ViewportDynamicHelpers = ReturnType<
  typeof createViewportDynamicUnitsFactory
>;
export type DvwMeasurement = MeasurementOf<
  ViewportDynamicHelpers['mDvw']
>;
export type DvhMeasurement = MeasurementOf<
  ViewportDynamicHelpers['mDvh']
>;
export type DviMeasurement = MeasurementOf<
  ViewportDynamicHelpers['mDvi']
>;
export type DvbMeasurement = MeasurementOf<
  ViewportDynamicHelpers['mDvb']
>;
export type DvminMeasurement = MeasurementOf<
  ViewportDynamicHelpers['mDvmin']
>;
export type DvmaxMeasurement = MeasurementOf<
  ViewportDynamicHelpers['mDvmax']
>;
