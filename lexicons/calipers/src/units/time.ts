import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipersFactory,
} from '../factory';

/** Factory for the time helpers, bound through `createCalipersFactory`. */
export const createTimeUnitsFactory = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipersFactory(config);
  return {
    mS: core.makeUnitHelperFromDefinition('mS'),
    mMs: core.makeUnitHelperFromDefinition('mMs'),
  };
};

type TimeHelpers = ReturnType<typeof createTimeUnitsFactory>;
export type SMeasurement = MeasurementOf<TimeHelpers['mS']>;
export type MsMeasurement = MeasurementOf<TimeHelpers['mMs']>;

export type TimeMeasurement = SMeasurement | MsMeasurement;
