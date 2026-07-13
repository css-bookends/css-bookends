import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

/** Factory for the viewport helpers, bound through `createCalipers`. */
export const createViewportUnits = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipers(config);
  return {
    mVw: core.makeUnitHelperFromDefinition('mVw'),
    mVh: core.makeUnitHelperFromDefinition('mVh'),
    mVi: core.makeUnitHelperFromDefinition('mVi'),
    mVb: core.makeUnitHelperFromDefinition('mVb'),
    mVmin: core.makeUnitHelperFromDefinition('mVmin'),
    mVmax: core.makeUnitHelperFromDefinition('mVmax'),
  };
};

type ViewportHelpers = ReturnType<typeof createViewportUnits>;
export type VwMeasurement = MeasurementOf<ViewportHelpers['mVw']>;
export type VhMeasurement = MeasurementOf<ViewportHelpers['mVh']>;
export type ViMeasurement = MeasurementOf<ViewportHelpers['mVi']>;
export type VbMeasurement = MeasurementOf<ViewportHelpers['mVb']>;
export type VminMeasurement = MeasurementOf<ViewportHelpers['mVmin']>;
export type VmaxMeasurement = MeasurementOf<ViewportHelpers['mVmax']>;
