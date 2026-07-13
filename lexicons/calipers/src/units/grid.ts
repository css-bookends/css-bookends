import type { MeasurementOf } from '../core';
import { makeUnitHelperFromDefinition } from '../default';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

export const mFr = makeUnitHelperFromDefinition('mFr');

export type FrMeasurement = MeasurementOf<typeof mFr>;

/** Factory for the grid helpers, bound through `createCalipers`. */
export const createGridUnits = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipers(config);
  return {
    mFr: core.makeUnitHelperFromDefinition('mFr'),
  };
};
