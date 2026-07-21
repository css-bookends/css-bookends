import type {
  IMeasurement,
  NonNegativeMeasurement,
} from '../../core';
import { f } from '../../float';
import { type Constraints } from '../../hardening';
import { i } from '../../integer';
import { type Scalar, toNumber } from '../../scalar';
import {
  UNIT_CATEGORY_BY_UNIT,
  type UnitCategory,
} from '../../unitDefinitions';
import { type IUnspecified } from '../unspecified';
import {
  type AssertMatchingUnits,
  type DeltaToNumber,
  type MeasurementContext,
} from './context';

/**
 * The `Measurement` class factory. Closes over the context (for the method-error thrower) plus the
 * two unit helpers it needs (`assertMatchingUnits`, `deltaToNumber`), so the class body is identical
 * to its former in-closure form, only relocated. `createCoreApi` calls this once and hands the
 * resulting constructor to the construction module.
 */
export const makeMeasurementClass = (
  ctx: MeasurementContext,
  assertMatchingUnits: AssertMatchingUnits,
  deltaToNumber: DeltaToNumber,
) => {
  const { throwMeasurementMethodError } = ctx;

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

  return Measurement;
};

/** The constructed `Measurement` class type, so a downstream module can type it as a dependency. */
export type MeasurementClass = ReturnType<
  typeof makeMeasurementClass
>;
