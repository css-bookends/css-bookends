import type { MeasurementOf } from '../core';
import { makeUnitHelperFromDefinition } from '../default';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

export const mVw = makeUnitHelperFromDefinition('mVw');
export const mVh = makeUnitHelperFromDefinition('mVh');
export const mVi = makeUnitHelperFromDefinition('mVi');
export const mVb = makeUnitHelperFromDefinition('mVb');
export const mVmin = makeUnitHelperFromDefinition('mVmin');
export const mVmax = makeUnitHelperFromDefinition('mVmax');

export type VwMeasurement = MeasurementOf<typeof mVw>;
export type VhMeasurement = MeasurementOf<typeof mVh>;
export type ViMeasurement = MeasurementOf<typeof mVi>;
export type VbMeasurement = MeasurementOf<typeof mVb>;
export type VminMeasurement = MeasurementOf<typeof mVmin>;
export type VmaxMeasurement = MeasurementOf<typeof mVmax>;

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
