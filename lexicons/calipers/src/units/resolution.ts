import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

/** Factory for the resolution helpers, bound through `createCalipers`. */
export const createResolutionUnits = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipers(config);
  return {
    mDpi: core.makeUnitHelperFromDefinition('mDpi'),
    mDpcm: core.makeUnitHelperFromDefinition('mDpcm'),
    mDppx: core.makeUnitHelperFromDefinition('mDppx'),
  };
};

type ResolutionHelpers = ReturnType<typeof createResolutionUnits>;
export type DpiMeasurement = MeasurementOf<ResolutionHelpers['mDpi']>;
export type DpcmMeasurement = MeasurementOf<
  ResolutionHelpers['mDpcm']
>;
export type DppxMeasurement = MeasurementOf<
  ResolutionHelpers['mDppx']
>;
