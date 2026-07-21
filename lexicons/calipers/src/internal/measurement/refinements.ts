import type {
  GreaterOrEqualToZeroBrand,
  IMeasurement,
  InRangeBrand,
  MeasurementRefinement,
  SmallerOrEqualToZeroBrand,
} from '../../core';
import { makeRefinement } from '../refinement';
import { type Construct } from './construct';
import {
  type AssertCondition,
  type MeasurementContext,
} from './context';

/**
 * The value-constraint refinements module. `makeMeasurementRefinement` builds the quartet
 * (is / ensure / check / hardenWith) from a numeric predicate and narrows to a constraint brand;
 * `nonNegative` / `nonPositive` / `inRange` are the built-ins. Takes the context (for the coded
 * helper thrower), `buildMeasurement` (the fallback rebuild), and `assertCondition` (inRange's bound
 * check).
 */
export const makeRefinements = (
  ctx: MeasurementContext,
  buildMeasurement: Construct['buildMeasurement'],
  assertCondition: AssertCondition,
) => {
  const { throwHelperError } = ctx;

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
    makeMeasurementRefinement,
    nonNegative,
    nonPositive,
    inRange,
  };
};
