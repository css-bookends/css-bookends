import type {
  IMeasurement,
  InscribedMeasurement,
  UnitAssertion,
  UnitGuard,
  UnitHelper,
} from '../../core';
import {
  UNIT_DEFINITIONS,
  type UnitDefinitionRecord,
  type UnitHelperName,
} from '../../unitDefinitions';
import { type Construct } from './construct';
import {
  type AssertMatchingUnits,
  type MeasurementContext,
} from './context';

/**
 * The unit-helper module: the per-unit helper factories (`mPx` / `mDeg` / ...), their guards and
 * asserts, the unit metadata, and the min / max / assert-unit helpers. Takes the context (for the
 * helper-error thrower), `assertMatchingUnits`, and the construction module (`buildMeasurement` /
 * `isMeasurement`).
 */
export const makeHelpers = (
  ctx: MeasurementContext,
  assertMatchingUnits: AssertMatchingUnits,
  construct: Construct,
) => {
  const { throwHelperError } = ctx;
  const { buildMeasurement, isMeasurement } = construct;

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

  return {
    makeUnitHelper,
    makeUnitHelperFromDefinition,
    makeUnitGuard,
    makeUnitAssert,
    measurementUnitMetadata,
    measurementMin,
    measurementMax,
    assertUnit,
  };
};
