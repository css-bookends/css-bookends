import type { MeasurementOf } from '../core';
import { makeUnitHelperFromDefinition } from '../default';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

export const mHz = makeUnitHelperFromDefinition('mHz');
export const mKhz = makeUnitHelperFromDefinition('mKhz');

export type HzMeasurement = MeasurementOf<typeof mHz>;
export type KhzMeasurement = MeasurementOf<typeof mKhz>;

/** Factory for the frequency helpers, bound through `createCalipers`. */
export const createFrequencyUnits = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipers(config);
  return {
    mHz: core.makeUnitHelperFromDefinition('mHz'),
    mKhz: core.makeUnitHelperFromDefinition('mKhz'),
  };
};
