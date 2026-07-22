import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipersFactory,
} from '../factory';

/** Factory for the angle helpers, bound through `createCalipersFactory`. */
export const createAngleUnitsFactory = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipersFactory(config);
  return {
    mDeg: core.makeUnitHelperFromDefinition('mDeg'),
    mRad: core.makeUnitHelperFromDefinition('mRad'),
    mGrad: core.makeUnitHelperFromDefinition('mGrad'),
    mTurn: core.makeUnitHelperFromDefinition('mTurn'),
  };
};

type AngleHelpers = ReturnType<typeof createAngleUnitsFactory>;
export type DegMeasurement = MeasurementOf<AngleHelpers['mDeg']>;
export type RadMeasurement = MeasurementOf<AngleHelpers['mRad']>;
export type GradMeasurement = MeasurementOf<AngleHelpers['mGrad']>;
export type TurnMeasurement = MeasurementOf<AngleHelpers['mTurn']>;
