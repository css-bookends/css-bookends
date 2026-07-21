import { type ErrorConfigStore } from './errors';
import { makeMeasurementClass } from './measurement/class';
import { makeConstruct } from './measurement/construct';
import {
  createMeasurementContext,
  hasCssMethod,
  makeAssertCondition,
  makeAssertMatchingUnits,
  makeDeltaToNumber,
} from './measurement/context';
import { makeHelpers } from './measurement/helpers';
import { makeRefinements } from './measurement/refinements';

export const createCoreApi = (
  errorStore: ErrorConfigStore,
  defaultUnit: string = 'px',
) => {
  const ctx = createMeasurementContext(errorStore, defaultUnit);
  const assertMatchingUnits = makeAssertMatchingUnits(ctx);
  const deltaToNumber = makeDeltaToNumber(assertMatchingUnits);

  const Measurement = makeMeasurementClass(
    ctx,
    assertMatchingUnits,
    deltaToNumber,
  );

  const construct = makeConstruct(ctx, Measurement);
  const { buildMeasurement, isMeasurement, m } = construct;

  const {
    makeUnitHelper,
    makeUnitHelperFromDefinition,
    makeUnitGuard,
    makeUnitAssert,
    measurementUnitMetadata,
    measurementMin,
    measurementMax,
    assertUnit,
  } = makeHelpers(ctx, assertMatchingUnits, construct);

  const assertCondition = makeAssertCondition(ctx);

  const {
    makeMeasurementRefinement,
    nonNegative,
    nonPositive,
    inRange,
  } = makeRefinements(ctx, buildMeasurement, assertCondition);

  return {
    m,
    isMeasurement,
    assertMatchingUnits,
    measurementMin,
    measurementMax,
    measurementUnitMetadata,
    makeUnitHelper,
    makeUnitHelperFromDefinition,
    makeUnitGuard,
    makeUnitAssert,
    hasCssMethod,
    assertUnit,
    assertCondition,
    makeMeasurementRefinement,
    nonNegative,
    nonPositive,
    inRange,
    getErrorConfig: errorStore.getErrorConfig,
    setErrorConfig: errorStore.setErrorConfig,
  } as const;
};

export type CoreApi = ReturnType<typeof createCoreApi>;
