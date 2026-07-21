import type { IMeasurement } from '../../core';
import { createErrorHelpers, type ErrorConfigStore } from '../errors';

/**
 * The shared per-instance context every measurement module closes over: the error store, the two
 * throwers derived from it, and the default unit. Built once per `createCoreApi` call and threaded
 * into each `make*(ctx)` module factory, so the single closure that used to hold everything becomes
 * a small explicit dependency each file receives.
 */
export type MeasurementContext = {
  errorStore: ErrorConfigStore;
  throwHelperError: ReturnType<
    typeof createErrorHelpers
  >['throwHelperError'];
  throwMeasurementMethodError: ReturnType<
    typeof createErrorHelpers
  >['throwMeasurementMethodError'];
  defaultUnit: string;
};

export const createMeasurementContext = (
  errorStore: ErrorConfigStore,
  defaultUnit = 'px',
): MeasurementContext => {
  const { throwHelperError, throwMeasurementMethodError } =
    createErrorHelpers(errorStore);
  return {
    errorStore,
    throwHelperError,
    throwMeasurementMethodError,
    defaultUnit,
  };
};

export type DeltaInput = number | IMeasurement<string>;

/** Assert two measurements share a unit, else throw the coded unit-mismatch error. */
export const makeAssertMatchingUnits =
  (ctx: MeasurementContext) =>
  <Unit extends string>(
    left: IMeasurement<Unit>,
    right: IMeasurement<Unit>,
    context: string,
  ): void => {
    const leftUnit = left.unit();
    const rightUnit = right.unit();
    if (leftUnit !== rightUnit) {
      ctx.throwHelperError({
        operation: 'css-calipers.assertMatchingUnits',
        params: [
          left,
          right,
        ],
        message: `measurement unit mismatch: ${leftUnit} vs ${rightUnit}`,
        context,
        details: { code: 'CALIPERS_E_UNIT_MISMATCH' },
      });
    }
  };

export const makeDeltaToNumber =
  (assertMatchingUnits: ReturnType<typeof makeAssertMatchingUnits>) =>
  (base: IMeasurement<string>, delta: DeltaInput): number => {
    if (typeof delta === 'number') return delta;
    assertMatchingUnits(base, delta, 'deltaToNumber');
    return delta.value();
  };

/** The bound helper types, so a module receiving these as deps (e.g. the class) can type them. */
export type AssertMatchingUnits = ReturnType<
  typeof makeAssertMatchingUnits
>;
export type DeltaToNumber = ReturnType<typeof makeDeltaToNumber>;

export const hasCssMethod = (
  x: unknown,
): x is { css: () => string } => {
  return (
    typeof x === 'object' &&
    x !== null &&
    'css' in x &&
    typeof x.css === 'function'
  );
};

export const makeAssertCondition =
  (ctx: MeasurementContext) =>
  (condition: boolean | (() => boolean), message: string): void => {
    const passed =
      typeof condition === 'function' ? condition() : condition;
    if (!passed) {
      ctx.throwHelperError({
        operation: 'css-calipers.assertCondition',
        params: [],
        message,
        details: { code: 'CALIPERS_E_ASSERT_CONDITION' },
      });
    }
  };
