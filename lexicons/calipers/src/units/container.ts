import type { MeasurementOf } from '../core';
import { makeUnitHelperFromDefinition } from '../default';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

export const mCqw = makeUnitHelperFromDefinition('mCqw');
export const mCqh = makeUnitHelperFromDefinition('mCqh');
export const mCqi = makeUnitHelperFromDefinition('mCqi');
export const mCqb = makeUnitHelperFromDefinition('mCqb');
export const mCqmin = makeUnitHelperFromDefinition('mCqmin');
export const mCqmax = makeUnitHelperFromDefinition('mCqmax');

export type CqwMeasurement = MeasurementOf<typeof mCqw>;
export type CqhMeasurement = MeasurementOf<typeof mCqh>;
export type CqiMeasurement = MeasurementOf<typeof mCqi>;
export type CqbMeasurement = MeasurementOf<typeof mCqb>;
export type CqminMeasurement = MeasurementOf<typeof mCqmin>;
export type CqmaxMeasurement = MeasurementOf<typeof mCqmax>;

/** Factory for the container-query helpers, bound through `createCalipers`. */
export const createContainerUnits = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipers(config);
  return {
    mCqw: core.makeUnitHelperFromDefinition('mCqw'),
    mCqh: core.makeUnitHelperFromDefinition('mCqh'),
    mCqi: core.makeUnitHelperFromDefinition('mCqi'),
    mCqb: core.makeUnitHelperFromDefinition('mCqb'),
    mCqmin: core.makeUnitHelperFromDefinition('mCqmin'),
    mCqmax: core.makeUnitHelperFromDefinition('mCqmax'),
  };
};
