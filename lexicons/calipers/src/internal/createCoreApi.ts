import type {
  GreaterOrEqualToZeroBrand,
  IMeasurement,
  InRangeBrand,
  InscribedMeasurement,
  MeasurementRefinement,
  SmallerOrEqualToZeroBrand,
  UnitAssertion,
  UnitGuard,
  UnitHelper,
} from '../core';
import {
  UNIT_DEFINITIONS,
  type UnitDefinitionRecord,
  type UnitHelperName,
} from '../unitDefinitions';
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

  const { buildMeasurement, isMeasurement, m } = makeConstruct(
    ctx,
    Measurement,
  );

  type UnitHelperFactory<Unit extends string> = ((
    value: number,
    context?: string,
  ) => InscribedMeasurement<Unit>) & {
    unit: Unit;
  };

  // Unit helpers are CONFIG-FREE, exactly like `m`: they attach a preset unit and nothing else. A
  // bound / modifier rides on the `i` / `f` you hand `m(value, unit)`, never on the helper.
  const createUnitHelper = <Unit extends string>(
    unit: Unit,
  ): UnitHelperFactory<Unit> => {
    const normalizedUnit = unit.toLowerCase() as Unit;
    const factory = (value: number, context?: string) =>
      buildMeasurement(value, normalizedUnit, context);
    return Object.assign(factory, {
      unit: normalizedUnit,
    });
  };

  const makeUnitHelper = <Unit extends string>(
    unit: Unit,
  ): UnitHelper<Unit> => createUnitHelper(unit);

  const makeUnitHelperFromDefinition = <Name extends UnitHelperName>(
    name: Name,
  ): UnitHelper<UnitDefinitionRecord[Name]['unit']> =>
    createUnitHelper(UNIT_DEFINITIONS[name].unit);

  const measurementUnitMetadata = UNIT_DEFINITIONS;
  type MeasurementOfHelper<T extends UnitHelper> = ReturnType<T>;

  const makeUnitGuard = <T extends UnitHelper>(
    helper: T,
  ): UnitGuard<T> => {
    return (value: unknown): value is MeasurementOfHelper<T> =>
      isMeasurement(value) && value.isUnit(helper.unit);
  };

  const makeUnitAssert = <T extends UnitHelper>(
    helper: T,
  ): UnitAssertion<T> => {
    const guard = makeUnitGuard(helper);
    return (
      value: unknown,
      context?: string,
    ): asserts value is MeasurementOfHelper<T> => {
      if (!guard(value)) {
        throwHelperError({
          operation: 'css-calipers.makeUnitAssert',
          params: isMeasurement(value)
            ? [
                value,
              ]
            : [],
          message: `Expected unit "${helper.unit}".`,
          context,
          details: { code: 'CALIPERS_E_ASSERT_UNIT' },
        });
      }
    };
  };

  const measurementMin = <Unit extends string>(
    a: IMeasurement<Unit>,
    b: IMeasurement<NoInfer<Unit>>,
  ): IMeasurement<Unit> => {
    assertMatchingUnits(a, b, 'measurementMin');
    return a.value() <= b.value() ? a : b;
  };

  const measurementMax = <Unit extends string>(
    a: IMeasurement<Unit>,
    b: IMeasurement<NoInfer<Unit>>,
  ): IMeasurement<Unit> => {
    assertMatchingUnits(a, b, 'measurementMax');
    return a.value() >= b.value() ? a : b;
  };

  const assertUnit = <Unit extends string>(
    measurement: IMeasurement<Unit>,
    expectedUnit: string,
    context?: string,
  ) => measurement.assertUnit(expectedUnit, context);

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
