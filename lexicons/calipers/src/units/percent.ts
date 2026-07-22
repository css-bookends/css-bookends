import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipersFactory,
} from '../factory';

/**
 * Factory for the percent helper plus its guard/assert, bound through
 * `createCalipersFactory`.
 */
export const createPercentUnitsFactory = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipersFactory(config);
  const percent = core.makeUnitHelperFromDefinition('mPercent');
  return {
    mPercent: percent,
    isPercentMeasurement: core.makeUnitGuard(percent),
    assertPercentMeasurement: core.makeUnitAssert(percent),
  };
};

type PercentHelpers = ReturnType<typeof createPercentUnitsFactory>;
export type PercentMeasurement = MeasurementOf<
  PercentHelpers['mPercent']
>;
