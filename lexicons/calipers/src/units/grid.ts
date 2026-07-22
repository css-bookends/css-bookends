import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipersFactory,
} from '../factory';

/** Factory for the grid helpers, bound through `createCalipersFactory`. */
export const createGridUnitsFactory = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipersFactory(config);
  return {
    mFr: core.makeUnitHelperFromDefinition('mFr'),
  };
};

type GridHelpers = ReturnType<typeof createGridUnitsFactory>;
export type FrMeasurement = MeasurementOf<GridHelpers['mFr']>;
