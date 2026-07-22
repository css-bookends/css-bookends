import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipersFactory,
} from '../factory';

/** Factory for the frequency helpers, bound through `createCalipersFactory`. */
export const createFrequencyUnitsFactory = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipersFactory(config);
  return {
    mHz: core.makeUnitHelperFromDefinition('mHz'),
    mKhz: core.makeUnitHelperFromDefinition('mKhz'),
  };
};

type FrequencyHelpers = ReturnType<
  typeof createFrequencyUnitsFactory
>;
export type HzMeasurement = MeasurementOf<FrequencyHelpers['mHz']>;
export type KhzMeasurement = MeasurementOf<FrequencyHelpers['mKhz']>;
