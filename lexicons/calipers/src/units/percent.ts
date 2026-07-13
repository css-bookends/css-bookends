import type { MeasurementOf } from '../core';
import {
  makeUnitAssert,
  makeUnitGuard,
  makeUnitHelperFromDefinition,
} from '../default';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

export const mPercent = makeUnitHelperFromDefinition('mPercent');

export type PercentMeasurement = MeasurementOf<typeof mPercent>;

export const isPercentMeasurement = makeUnitGuard(mPercent);
export const assertPercentMeasurement = makeUnitAssert(mPercent);

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
