import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

/** Factory for the grid helpers, bound through `createCalipers`. */
export const createGridUnits = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipers(config);
  return {
    mFr: core.makeUnitHelperFromDefinition('mFr'),
  };
};

type GridHelpers = ReturnType<typeof createGridUnits>;
export type FrMeasurement = MeasurementOf<GridHelpers['mFr']>;
