import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipersFactory,
} from '../factory';

/** Factory for the resolution helpers, bound through `createCalipersFactory`. */
export const createResolutionUnitsFactory = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipersFactory(config);
  return {
    mDpi: core.makeUnitHelperFromDefinition('mDpi'),
    mDpcm: core.makeUnitHelperFromDefinition('mDpcm'),
    mDppx: core.makeUnitHelperFromDefinition('mDppx'),
  };
};

type ResolutionHelpers = ReturnType<
  typeof createResolutionUnitsFactory
>;
export type DpiMeasurement = MeasurementOf<ResolutionHelpers['mDpi']>;
export type DpcmMeasurement = MeasurementOf<
  ResolutionHelpers['mDpcm']
>;
export type DppxMeasurement = MeasurementOf<
  ResolutionHelpers['mDppx']
>;
