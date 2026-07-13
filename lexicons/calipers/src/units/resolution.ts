import type { MeasurementOf } from '../core';
import { makeUnitHelperFromDefinition } from '../default';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

export const mDpi = makeUnitHelperFromDefinition('mDpi');
export const mDpcm = makeUnitHelperFromDefinition('mDpcm');
export const mDppx = makeUnitHelperFromDefinition('mDppx');

export type DpiMeasurement = MeasurementOf<typeof mDpi>;
export type DpcmMeasurement = MeasurementOf<typeof mDpcm>;
export type DppxMeasurement = MeasurementOf<typeof mDppx>;

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
