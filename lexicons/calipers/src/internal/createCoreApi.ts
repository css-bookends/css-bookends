import type {
  GreaterOrEqualToZeroBrand,
  IMeasurement,
  InRangeBrand,
  InscribedMeasurement,
  MeasurementRefinement,
  NonNegativeMeasurement,
  SmallerOrEqualToZeroBrand,
  UnitAssertion,
  UnitGuard,
  UnitHelper,
} from '../core';
import { f } from '../float';
import { type Constraints } from '../hardening';
import { i } from '../integer';
import { type Scalar, toNumber } from '../scalar';
import {
  UNIT_CATEGORY_BY_UNIT,
  UNIT_DEFINITIONS,
  type UnitCategory,
  type UnitDefinitionRecord,
  type UnitHelperName,
} from '../unitDefinitions';
import { type ErrorConfigStore } from './errors';
import {
  createMeasurementContext,
  hasCssMethod,
  makeAssertCondition,
  makeAssertMatchingUnits,
  makeDeltaToNumber,
} from './measurement/context';
import { makeRefinement } from './refinement';
import { ScalarBase } from './scalarBase';
import { type IUnspecified, u } from './unspecified';

// `m` is a PURE CONTAINER: it carries NO numeric config. A bound / modifier / hardening belong on the
// `i` / `f` you hand it (`m(i(700, { min: 1, max: 900 }), 'px')`), never on `m` itself. So its options
// are only the unit + an error context.
type MeasurementCreateOptions<Unit extends string> = {
  unit?: Unit;
  context?: string;
};

export const createCoreApi = (
  errorStore: ErrorConfigStore,
  defaultUnit: string = 'px',
) => {
  const ctx = createMeasurementContext(errorStore, defaultUnit);
  const { throwHelperError, throwMeasurementMethodError } = ctx;
  const assertMatchingUnits = makeAssertMatchingUnits(ctx);
  const deltaToNumber = makeDeltaToNumber(assertMatchingUnits);

  class Measurement<
    Unit extends string,
  > implements IMeasurement<Unit> {
    // A measurement IS "a scalar + a unit". The embedded scalar (`i` / `f` / `u`) owns the ENTIRE
    // numeric side: the value, the bound, the hardening reaction, the modifier, and integer-ness. It
    // validated its value at its own construction, so the measurement re-checks nothing here; every
    // numeric method DELEGATES to the scalar and re-pairs the result with the unit. `IUnspecified` is
    // the loosest scalar interface (an `i` / `f` is assignable to it), so one field type carries any
    // embedded kind; runtime polymorphism keeps the real behaviour (an embedded `i` still rejects a
    // non-integer result).
    #scalar: IUnspecified;
    #unit: Unit;

    constructor(scalar: IUnspecified, unit: Unit) {
      this.#scalar = scalar;
      this.#unit = unit.toLowerCase() as Unit;
    }

    // Re-pair a derived scalar with this measurement's unit. The scalar has already validated the
    // derived value (bound + hardening + modifier + integer-ness), so this only wraps it. Replaces
    // the old bespoke `#clone` bound logic, which now lives entirely in the scalar.
    #withScalar(scalar: IUnspecified): Measurement<Unit> {
      return new Measurement(scalar, this.#unit);
    }

    css(): string {
      return `${this.#scalar.css()}${this.#unit}`;
    }

    toString(): string {
      return this.css();
    }

    unit(): Unit {
      return this.#unit;
    }

    value(): number {
      return this.#scalar.value();
    }

    constraints(): Constraints {
      return this.#scalar.constraints();
    }

    isInt(): boolean {
      return this.#scalar.isInt();
    }

    isFloat(): boolean {
      return this.#scalar.isFloat();
    }

    toTypedValue() {
      const value = this.#scalar.value();
      return this.#scalar.isInt() ? i(value) : f(value);
    }

    category(): UnitCategory | undefined {
      return UNIT_CATEGORY_BY_UNIT[this.#unit];
    }

    isLength(): boolean {
      const category = this.category();
      return category !== undefined && category.startsWith('length-');
    }

    isAbsolute(): boolean {
      return this.category() === 'length-absolute';
    }

    isRelative(): boolean {
      return this.isLength() && !this.isAbsolute();
    }

    isPercent(): boolean {
      return this.category() === 'percent';
    }

    isAngle(): boolean {
      return this.category() === 'angle';
    }

    valueOf(): number {
      return this.#scalar.value();
    }

    [Symbol.toPrimitive](hint: string): string | number {
      if (hint === 'number') return this.#scalar.value();
      return this.css();
    }

    isUnit(expected: string): boolean {
      return this.#unit === expected.toLowerCase();
    }

    assertUnit(expected: string, context?: string): void {
      if (!this.isUnit(expected)) {
        throwMeasurementMethodError({
          operation: 'css-calipers.Measurement.assertUnit',
          caller: this,
          params: [],
          message: `Expected unit "${expected}", received "${this.#unit}".`,
          context,
          details: { code: 'CALIPERS_E_ASSERT_UNIT' },
        });
      }
    }

    assert(
      predicate: (measurement: IMeasurement<Unit>) => boolean,
      message: string,
    ): void {
      if (!predicate(this)) {
        throwMeasurementMethodError({
          operation: 'css-calipers.Measurement.assert',
          caller: this,
          params: [],
          message,
          details: { code: 'CALIPERS_E_ASSERT_PREDICATE' },
        });
      }
    }

    equals(other: IMeasurement<string>, strict = true): boolean {
      const otherUnit = other.unit();
      if (this.#unit !== otherUnit) {
        if (strict) {
          assertMatchingUnits(
            this,
            other as IMeasurement<Unit>,
            'equals(strict)',
          );
        }
        return false;
      }
      return this.#scalar.value() === other.value();
    }

    compare(other: IMeasurement<string>, strict = true): number {
      if (strict) {
        assertMatchingUnits(
          this,
          other as IMeasurement<Unit>,
          'compare(strict)',
        );
      } else if (this.#unit !== other.unit()) {
        return this.#unit < other.unit() ? -1 : 1;
      }
      const diff = this.#scalar.value() - other.value();
      if (diff === 0) return 0;
      return diff < 0 ? -1 : 1;
    }

    add(delta: number | IMeasurement<Unit>): Measurement<Unit> {
      return this.#withScalar(
        this.#scalar.add(deltaToNumber(this, delta)),
      );
    }

    subtract(delta: number | IMeasurement<Unit>): Measurement<Unit> {
      return this.#withScalar(
        this.#scalar.subtract(deltaToNumber(this, delta)),
      );
    }

    multiply(factor: Scalar): Measurement<Unit> {
      return this.#withScalar(
        this.#scalar.multiply(toNumber(factor)),
      );
    }

    divide(divisor: Scalar): Measurement<Unit> {
      return this.#withScalar(this.#scalar.divide(toNumber(divisor)));
    }

    double(): Measurement<Unit> {
      return this.#withScalar(this.#scalar.multiply(2));
    }

    half(): Measurement<Unit> {
      return this.#withScalar(this.#scalar.divide(2));
    }

    negation(shouldNegate = true): Measurement<Unit> {
      return shouldNegate
        ? this.#withScalar(this.#scalar.multiply(-1))
        : this;
    }

    absolute(): NonNegativeMeasurement<Unit> {
      // Math.abs is always >= 0, so the result is hardened to NonNegativeMeasurement
      // (the governing rule: a runtime restriction must also harden the type).
      return this.#withScalar(
        this.#scalar.withValue(Math.abs(this.#scalar.value())),
      ) as unknown as NonNegativeMeasurement<Unit>;
    }

    round(precision = 0): Measurement<Unit> {
      const value = this.#scalar.value();
      const next =
        precision === 0
          ? Math.round(value)
          : Number(value.toFixed(precision));
      return this.#withScalar(this.#scalar.withValue(next));
    }

    floor(): Measurement<Unit> {
      return this.#withScalar(
        this.#scalar.withValue(Math.floor(this.#scalar.value())),
      );
    }

    ceil(): Measurement<Unit> {
      return this.#withScalar(
        this.#scalar.withValue(Math.ceil(this.#scalar.value())),
      );
    }

    clamp(
      min: IMeasurement<Unit>,
      max: IMeasurement<Unit>,
    ): Measurement<Unit> {
      assertMatchingUnits(this, min, 'clamp(min)');
      assertMatchingUnits(this, max, 'clamp(max)');

      const minValue = min.value();
      const maxValue = max.value();

      if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
        throwMeasurementMethodError({
          operation: 'css-calipers.Measurement.clamp',
          caller: this,
          params: [
            min,
            max,
          ],
          message: 'clamp: expected finite bounds',
          details: { code: 'CALIPERS_E_CLAMP_NONFINITE_BOUNDS' },
        });
      }
      if (minValue > maxValue) {
        throwMeasurementMethodError({
          operation: 'css-calipers.Measurement.clamp',
          caller: this,
          params: [
            min,
            max,
          ],
          message: `clamp: min (${min.css()}) must be <= max (${max.css()})`,
          details: { code: 'CALIPERS_E_CLAMP_INVALID_RANGE' },
        });
      }

      // Unit safety and the clamp bounds are the measurement's concern; the actual clamp + any
      // re-validation of the scalar's OWN bound is delegated to the embedded scalar.
      return this.#withScalar(this.#scalar.clamp(minValue, maxValue));
    }

    clone(): this {
      // Delegate to the scalar's config-preserving clone, then re-pair with the unit. The scalar
      // carries all numeric config, so the copy is faithful with no bespoke logic here.
      return this.#withScalar(this.#scalar.clone()) as this;
    }
  }

  // Single controlled point where the unit brand is asserted onto a freshly created measurement
  // (the brand is a compile-time-only phantom). The scalar has already validated its value.
  const createMeasurement = <Unit extends string>(
    scalar: IUnspecified,
    unit: Unit,
  ): InscribedMeasurement<Unit> =>
    new Measurement(
      scalar,
      unit,
    ) as unknown as InscribedMeasurement<Unit>;

  // Build a measurement from a PLAIN numeric value: embed a `u` carrying ONLY error plumbing (no
  // bound, modifier, or hardening — `m` is a pure container). The `u` validates finiteness at its own
  // construction, so a non-finite value throws there, through this instance's error store. Used by
  // `m()` for a plain number and by every unit helper.
  const buildMeasurement = <Unit extends string>(
    value: number,
    normalizedUnit: Unit,
    contextLabel: string | undefined,
  ): InscribedMeasurement<Unit> =>
    createMeasurement(
      u(value, {
        errorStore,
        context: contextLabel,
        // The embedded scalar names the measurement in its errors: `m(u): ...`.
        wrapperLabel: 'm',
      }),
      normalizedUnit,
    );

  const isMeasurement = (x: unknown): x is IMeasurement<string> =>
    x instanceof Measurement;

  function m(value: Scalar): InscribedMeasurement<'px'>;
  function m(
    value: Scalar,
    options: { context?: string },
  ): InscribedMeasurement<'px'>;
  function m<Unit extends string>(
    value: Scalar,
    unit: Unit,
    context?: string,
  ): InscribedMeasurement<Lowercase<Unit>>;
  function m<Unit extends string>(
    value: Scalar,
    options: MeasurementCreateOptions<Unit>,
  ): InscribedMeasurement<Lowercase<Unit>>;
  function m<Unit extends string>(
    value: Scalar,
    unitOrOptions:
      | Unit
      | MeasurementCreateOptions<Unit> = defaultUnit as Unit,
    context?: string,
  ): InscribedMeasurement<Lowercase<Unit>> {
    const options: MeasurementCreateOptions<Unit> =
      unitOrOptions && typeof unitOrOptions === 'object'
        ? unitOrOptions
        : { unit: unitOrOptions, context };
    const unit = (options.unit ?? defaultUnit) as Unit;
    const contextLabel = options.context;
    const normalizedUnit = unit.toLowerCase() as Lowercase<Unit>;

    // A typed scalar (i / f) is INGESTED as-is: it already owns its numeric config (value, bound,
    // hardening, modifier, integer-ness), so the measurement embeds it directly and delegates. `m`
    // adds NO numeric config of its own (it is a pure container), so there is nothing to reconcile: a
    // bound / modifier rides on the scalar you pass in, or you mint a fresh value.
    if (typeof value === 'object' && value !== null) {
      // Embed the ingested scalar under the `m` wrapper so its errors name the measurement AND the
      // subtype (`m(i): ...`), preserving its full config. Every scalar is a `ScalarBase` (that is
      // where `embedUnder` lives); the guard is a defensive narrow.
      const embedded =
        value instanceof ScalarBase
          ? value.embedUnder('m')
          : (value as unknown as IUnspecified);
      return createMeasurement(embedded, normalizedUnit);
    }

    // A plain number embeds a `u` carrying only m's error store (no bound / modifier / hardening).
    // The `u` validates finiteness at construction.
    return buildMeasurement(value, normalizedUnit, contextLabel);
  }

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
