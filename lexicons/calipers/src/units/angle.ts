import type { MeasurementOf } from '../core';
import { makeUnitHelperFromDefinition } from '../default';
import {
  type CalipersFactoryConfig,
  createCalipers,
} from '../factory';

export const mDeg = makeUnitHelperFromDefinition('mDeg');
export const mRad = makeUnitHelperFromDefinition('mRad');
export const mGrad = makeUnitHelperFromDefinition('mGrad');
export const mTurn = makeUnitHelperFromDefinition('mTurn');

export type DegMeasurement = MeasurementOf<typeof mDeg>;
export type RadMeasurement = MeasurementOf<typeof mRad>;
export type GradMeasurement = MeasurementOf<typeof mGrad>;
export type TurnMeasurement = MeasurementOf<typeof mTurn>;

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
