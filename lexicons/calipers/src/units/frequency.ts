import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

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

type FrequencyHelpers = ReturnType<typeof createFrequencyUnits>;
export type HzMeasurement = MeasurementOf<FrequencyHelpers['mHz']>;
export type KhzMeasurement = MeasurementOf<FrequencyHelpers['mKhz']>;
