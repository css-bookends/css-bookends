import type { MeasurementOf } from '../core';
import {
  type CalipersFactoryConfig,
  createCalipersFactory,
} from '../factory';

/** Factory for the container-query helpers, bound through `createCalipersFactory`. */
export const createContainerUnitsFactory = (
  config: CalipersFactoryConfig = {},
) => {
  const core = createCalipersFactory(config);
  return {
    mCqw: core.makeUnitHelperFromDefinition('mCqw'),
    mCqh: core.makeUnitHelperFromDefinition('mCqh'),
    mCqi: core.makeUnitHelperFromDefinition('mCqi'),
    mCqb: core.makeUnitHelperFromDefinition('mCqb'),
    mCqmin: core.makeUnitHelperFromDefinition('mCqmin'),
    mCqmax: core.makeUnitHelperFromDefinition('mCqmax'),
  };
};

type ContainerHelpers = ReturnType<
  typeof createContainerUnitsFactory
>;
export type CqwMeasurement = MeasurementOf<ContainerHelpers['mCqw']>;
export type CqhMeasurement = MeasurementOf<ContainerHelpers['mCqh']>;
export type CqiMeasurement = MeasurementOf<ContainerHelpers['mCqi']>;
export type CqbMeasurement = MeasurementOf<ContainerHelpers['mCqb']>;
export type CqminMeasurement = MeasurementOf<
  ContainerHelpers['mCqmin']
>;
export type CqmaxMeasurement = MeasurementOf<
  ContainerHelpers['mCqmax']
>;
