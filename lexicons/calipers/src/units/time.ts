import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

/** Factory for the time helpers, bound through `createCalipers`. */
export const createTimeUnits = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipers(config);
  return {
    mS: core.makeUnitHelperFromDefinition('mS'),
    mMs: core.makeUnitHelperFromDefinition('mMs'),
  };
};

type TimeHelpers = ReturnType<typeof createTimeUnits>;
export type SMeasurement = MeasurementOf<TimeHelpers['mS']>;
export type MsMeasurement = MeasurementOf<TimeHelpers['mMs']>;

export type TimeMeasurement = SMeasurement | MsMeasurement;
