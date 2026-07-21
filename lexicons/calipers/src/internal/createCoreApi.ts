import type {
  GreaterOrEqualToZeroBrand,
  IMeasurement,
  InRangeBrand,
  MeasurementRefinement,
  SmallerOrEqualToZeroBrand,
} from '../core';
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
import { makeRefinement } from './refinement';

export const createCoreApi = (
  errorStore: ErrorConfigStore,
  defaultUnit: string = 'px',
) => {
  const ctx = createMeasurementContext(errorStore, defaultUnit);
  const { throwHelperError } = ctx;
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

  // Value-constraint refinements. One factory builds the quartet (is / ensure / check /
  // hardenWith) from a numeric predicate and narrows to a constraint brand. The brand is
  // additive over `IMeasurement` and is dropped by arithmetic (which can cross a bound),
  // so a derived result must be re-checked. `nonNegative` / `nonPositive` / `inRange(...)`
  // are the built-ins.
  // Measurements bind the shared `makeRefinement` factory (`internal/refinement.ts`) with
  // measurement adapters: read `.value()`, throw the coded helper error, and rebuild a
  // fallback via `createMeasurement`. The scalar lexicons (`makeIntegerRefinement` /
  // `makeFloatRefinement`) wrap the same factory with their own adapters.
  const makeMeasurementRefinement = <B>(spec: {
    predicate: (value: number) => boolean;
    message: (measurement: IMeasurement) => string;
    defaultFallback?: number;
  }): MeasurementRefinement<B> =>
    makeRefinement<IMeasurement, B>(
      {
        readValue: (measurement) => measurement.value(),
        throwConstraint: (message, measurement, context) =>
          throwHelperError({
            operation: 'css-calipers.refinement.ensure',
            params: [
              measurement,
            ],
            message,
            context,
            details: { code: 'CALIPERS_E_CONSTRAINT' },
          }),
        rebuild: (fallbackValue, measurement) =>
          buildMeasurement(
            fallbackValue,
            measurement.unit(),
            undefined,
          ),
      },
      spec,
    );

  const nonNegative =
    makeMeasurementRefinement<GreaterOrEqualToZeroBrand>({
      predicate: (value) => value >= 0,
      message: (measurement) =>
        `expected a measurement >= 0 (got ${measurement.css()})`,
      defaultFallback: 0,
    });

  const nonPositive =
    makeMeasurementRefinement<SmallerOrEqualToZeroBrand>({
      predicate: (value) => value <= 0,
      message: (measurement) =>
        `expected a measurement <= 0 (got ${measurement.css()})`,
      defaultFallback: 0,
    });

  const inRange = <Min extends number, Max extends number>(
    min: Min,
    max: Max,
  ): MeasurementRefinement<InRangeBrand<Min, Max>> => {
    assertCondition(
      min <= max,
      `inRange: min (${min}) must be <= max (${max})`,
    );
    return makeMeasurementRefinement<InRangeBrand<Min, Max>>({
      predicate: (value) => value >= min && value <= max,
      message: (measurement) =>
        `expected a measurement in [${min}, ${max}] (got ${measurement.css()})`,
      defaultFallback: min,
    });
  };

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
