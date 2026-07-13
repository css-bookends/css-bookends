import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

/**
 * Factory for the percent helper plus its guard/assert, bound through
 * `createCalipers`.
 */
export const createPercentUnits = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipers(config);
  const percent = core.makeUnitHelperFromDefinition('mPercent');
  return {
    mPercent: percent,
    isPercentMeasurement: core.makeUnitGuard(percent),
    assertPercentMeasurement: core.makeUnitAssert(percent),
  };
};

type PercentHelpers = ReturnType<typeof createPercentUnits>;
export type PercentMeasurement = MeasurementOf<
  PercentHelpers['mPercent']
>;
