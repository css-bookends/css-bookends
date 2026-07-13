import type { MeasurementOf } from '../core';
import { makeUnitHelperFromDefinition } from '../default';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

export const mS = makeUnitHelperFromDefinition('mS');
export const mMs = makeUnitHelperFromDefinition('mMs');

export type SMeasurement = MeasurementOf<typeof mS>;
export type MsMeasurement = MeasurementOf<typeof mMs>;

export type TimeMeasurement = SMeasurement | MsMeasurement;

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
