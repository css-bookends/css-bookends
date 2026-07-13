import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

/** Factory for the angle helpers, bound through `createCalipers`. */
export const createAngleUnits = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipers(config);
  return {
    mDeg: core.makeUnitHelperFromDefinition('mDeg'),
    mRad: core.makeUnitHelperFromDefinition('mRad'),
    mGrad: core.makeUnitHelperFromDefinition('mGrad'),
    mTurn: core.makeUnitHelperFromDefinition('mTurn'),
  };
};

type AngleHelpers = ReturnType<typeof createAngleUnits>;
export type DegMeasurement = MeasurementOf<AngleHelpers['mDeg']>;
export type RadMeasurement = MeasurementOf<AngleHelpers['mRad']>;
export type GradMeasurement = MeasurementOf<AngleHelpers['mGrad']>;
export type TurnMeasurement = MeasurementOf<AngleHelpers['mTurn']>;
