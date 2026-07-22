import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipersFactory,
} from '../factory';

/** Factory for the viewport helpers, bound through `createCalipersFactory`. */
export const createViewportUnitsFactory = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipersFactory(config);
  return {
    mVw: core.makeUnitHelperFromDefinition('mVw'),
    mVh: core.makeUnitHelperFromDefinition('mVh'),
    mVi: core.makeUnitHelperFromDefinition('mVi'),
    mVb: core.makeUnitHelperFromDefinition('mVb'),
    mVmin: core.makeUnitHelperFromDefinition('mVmin'),
    mVmax: core.makeUnitHelperFromDefinition('mVmax'),
  };
};

type ViewportHelpers = ReturnType<typeof createViewportUnitsFactory>;
export type VwMeasurement = MeasurementOf<ViewportHelpers['mVw']>;
export type VhMeasurement = MeasurementOf<ViewportHelpers['mVh']>;
export type ViMeasurement = MeasurementOf<ViewportHelpers['mVi']>;
export type VbMeasurement = MeasurementOf<ViewportHelpers['mVb']>;
export type VminMeasurement = MeasurementOf<ViewportHelpers['mVmin']>;
export type VmaxMeasurement = MeasurementOf<ViewportHelpers['mVmax']>;
