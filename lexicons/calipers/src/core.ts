import {
  createFloat,
  f,
  type FloatApi,
  type FloatConstraints,
  type FloatFactoryConfig,
  type FloatOptions,
  type IFloat,
  isFloat,
} from './float';
import { type Constraints } from './hardening';
import {
  createInteger,
  i,
  type IInteger,
  type IntegerApi,
  type IntegerConstraints,
  type IntegerFactoryConfig,
  type IntegerOptions,
  isInteger,
} from './integer';
import type {
  GreaterOrEqualToZeroBrand,
  InRangeBrand,
  SmallerOrEqualToZeroBrand,
} from './internal/brands';
import { type ErrorCode, type ErrorConfig } from './internal/errors';
import {
  createRatio,
  type IRatio,
  isRatio,
  normalizeRatio,
  parseRatio,
  r,
  type RatioApi,
  type RatioFactoryConfig,
  type RatioParts,
  ratioToFloat,
  type RatioValue,
  reduceRatio,
  simplifyRatio,
  toFloat,
} from './ratio';
import { type Scalar } from './scalar';
import {
  type UnitCategory,
  type UnitDefinition,
  type UnitDefinitionRecord,
} from './unitDefinitions';

type UnitSymbol =
  UnitDefinitionRecord[keyof UnitDefinitionRecord]['unit'];

export type MeasurementString<Unit extends string = UnitSymbol> =
  `${number}${Unit}`;

// The unit brand is keyed by a module-private unique symbol, so the tag cannot
// be named (and therefore cannot be forged) from outside this module. The only
// way past the unit guard is a deliberate `as` cast.
declare const unitBrand: unique symbol;
type UnitBrand<Unit extends string> = { readonly [unitBrand]: Unit };

// Value-constraint brands live in the lexicon-neutral `./internal/brands` module (so the scalar
// lexicons can apply them without depending on this measurement file). They are imported above and
// re-exported below for the public API; the measurement branded types below combine them with
// `IMeasurement`.

export interface IMeasurement<Unit extends string = string> {
  css: () => string;
  toString: () => string;
  /** The raw unit string (e.g. `'px'`). The unified accessor across value types. */
  unit: () => Unit;
  /** The raw numeric value. The unified accessor across value types. */
  value: () => number;
  valueOf: () => number;
  /**
   * The range bound this measurement carries (from an ingested hardened
   * `i` / `f`), or `{}` if unhardened. Arithmetic that breaks the bound reacts
   * per the instance's bound; an in-bounds derived value keeps it.
   */
  constraints: () => Constraints;
  /** Whether the raw value is integral / fractional. */
  isInt: () => boolean;
  isFloat: () => boolean;
  /** Recover the matching unitless typed scalar (`i()` if integral, else `f()`). */
  asScalar: () => IInteger | IFloat;
  /** The unit's CSS category (e.g. `'length-absolute'`), or `undefined` for an unknown unit. */
  category: () => UnitCategory | undefined;
  /** True for any length unit (absolute or relative). */
  isLength: () => boolean;
  /** True for an absolute length (px, cm, pt, ...). */
  isAbsolute: () => boolean;
  /** True for a relative length (font-relative, viewport, container). */
  isRelative: () => boolean;
  /** True for the percentage unit. */
  isPercent: () => boolean;
  /** True for an angle unit (deg, rad, grad, turn). */
  isAngle: () => boolean;
  [Symbol.toPrimitive]: (hint: string) => string | number;
  isUnit: (unit: string) => boolean;
  assertUnit: (unit: string, context?: string) => void;
  assert: (
    predicate: (measurement: IMeasurement<Unit>) => boolean,
    message: string,
  ) => void;
  equals(other: IMeasurement<Unit>, strict?: boolean): boolean;
  equals(other: IMeasurement<string>, strict: false): boolean;
  compare(other: IMeasurement<Unit>, strict?: boolean): number;
  compare(other: IMeasurement<string>, strict: false): number;
  add(delta: number | IMeasurement<Unit>): IMeasurement<Unit>;
  subtract(delta: number | IMeasurement<Unit>): IMeasurement<Unit>;
  multiply: (factor: Scalar) => IMeasurement<Unit>;
  divide: (divisor: Scalar) => IMeasurement<Unit>;
  double: () => IMeasurement<Unit>;
  half: () => IMeasurement<Unit>;
  negation: (shouldNegate?: boolean) => IMeasurement<Unit>;
  /** Absolute value; always `>= 0`, so the result is hardened to `NonNegativeMeasurement`. */
  absolute: () => NonNegativeMeasurement<Unit>;
  round: (precision?: number) => IMeasurement<Unit>;
  floor: () => IMeasurement<Unit>;
  ceil: () => IMeasurement<Unit>;
  clamp(
    min: IMeasurement<Unit>,
    max: IMeasurement<Unit>,
  ): IMeasurement<Unit>;
  /** An independent, config-preserving copy (same value, unit, and bound). Returns `this`, so a
   *  branded receiver keeps its brand; to change a bound, mint a fresh value. */
  clone(): this;
}

export type InscribedMeasurement<Unit extends string> =
  IMeasurement<Unit> & UnitBrand<Unit>;

/**
 * @deprecated Renamed to `InscribedMeasurement`. This alias is kept for one
 * release for backwards compatibility and will be removed in a future version.
 */
export type BrandedMeasurement<Unit extends string> =
  InscribedMeasurement<Unit>;

/**
 * A measurement proven `>= 0` by the `nonNegative` refinement. `NonNegativeMeasurement`
 * is the conventional alias for the same constraint. The brand is additive over
 * `IMeasurement` and is dropped by arithmetic, so a derived result must be re-checked.
 */
export type GreaterOrEqualToZeroMeasurement<
  Unit extends string = string,
> = IMeasurement<Unit> & GreaterOrEqualToZeroBrand;
/** Non-negative (`>= 0`); alias of {@link GreaterOrEqualToZeroMeasurement}. */
export type NonNegativeMeasurement<Unit extends string = string> =
  GreaterOrEqualToZeroMeasurement<Unit>;

/**
 * A measurement proven `<= 0` by the `nonPositive` refinement. `NonPositiveMeasurement`
 * is the conventional alias for the same constraint. The brand is additive over
 * `IMeasurement` and is dropped by arithmetic, so a derived result must be re-checked.
 */
export type SmallerOrEqualToZeroMeasurement<
  Unit extends string = string,
> = IMeasurement<Unit> & SmallerOrEqualToZeroBrand;
/** Non-positive (`<= 0`); alias of {@link SmallerOrEqualToZeroMeasurement}. */
export type NonPositiveMeasurement<Unit extends string = string> =
  SmallerOrEqualToZeroMeasurement<Unit>;

/**
 * A measurement proven within an inclusive numeric range by an `inRange(min, max)`
 * refinement. The brand carries the literal bounds, so `InRangeMeasurement<'px', 0, 10>`
 * is distinct from `InRangeMeasurement<'px', 0, 5>`. Assignability is by exact bounds, not
 * range containment (TypeScript cannot compare numeric literals).
 */
export type InRangeMeasurement<
  Unit extends string = string,
  Min extends number = number,
  Max extends number = number,
> = IMeasurement<Unit> & InRangeBrand<Min, Max>;

/** Result of a non-throwing refinement check (`refinement.check`). */
export type MeasurementRefinementResult<M extends IMeasurement, B> =
  | { ok: true; value: M & B }
  | { ok: false; value: M; error: string };

/**
 * The quartet a value-constraint refinement exposes, built by
 * `makeMeasurementRefinement`. `nonNegative` / `nonPositive` / `inRange(...)` are
 * instances. `B` is the constraint brand the refinement applies.
 */
export interface MeasurementRefinement<B> {
  /** Non-throwing guard; narrows to the brand on success. */
  is: <M extends IMeasurement>(
    measurement: M,
  ) => measurement is M & B;
  /** Throws if the constraint fails; otherwise returns the branded measurement. */
  ensure: <M extends IMeasurement>(
    measurement: M,
    context?: string,
  ) => M & B;
  /** Non-throwing; returns an ok/error result. */
  check: <M extends IMeasurement>(
    measurement: M,
  ) => MeasurementRefinementResult<M, B>;
  /** Returns the measurement if valid, else the fallback (default: a known-good value). */
  hardenWith: <M extends IMeasurement>(
    measurement: M,
    fallback?: M & B,
  ) => M & B;
}

export type UnitHelper<Unit extends string = string> = ((
  value: number,
  context?: string,
) => InscribedMeasurement<Unit>) & {
  unit: Unit;
};

export type MeasurementOf<T extends UnitHelper> = ReturnType<T>;

export type UnitGuard<T extends UnitHelper> = (
  value: unknown,
) => value is MeasurementOf<T>;

export type UnitAssertion<T extends UnitHelper> = (
  value: unknown,
  context?: string,
) => asserts value is MeasurementOf<T>;

// The package's bare, default-instance helpers (`m`, the refinements, the
// unit-helper builders, the error-config accessors, ...) are NOT assembled here.
// They live in `./default`, which builds them via the public `createCalipers()`
// factory at its defaults, so there is a single construction path and the default
// cannot drift from a custom instance. This module owns only the class/types and
// the `createCoreApi`-level type surface; it must stay free of any default-instance
// runtime assembly to keep `core <-> factory` cycle-free.
export type MeasurementUnitDefinition = UnitDefinition;
export type MeasurementUnitCategory = UnitCategory;
export { type ErrorCode, type ErrorConfig };
export type {
  GreaterOrEqualToZeroBrand,
  InRangeBrand,
  SmallerOrEqualToZeroBrand,
};
export type { Constraints } from './hardening';
export {
  createRatio,
  isRatio,
  normalizeRatio,
  parseRatio,
  r,
  ratioToFloat,
  reduceRatio,
  simplifyRatio,
  toFloat,
};
export type {
  IRatio,
  RatioApi,
  RatioFactoryConfig,
  RatioParts,
  RatioValue,
};
export { createFloat, createInteger, f, i, isFloat, isInteger };
export type {
  FloatApi,
  FloatConstraints,
  FloatFactoryConfig,
  FloatOptions,
  IFloat,
  IInteger,
  IntegerApi,
  IntegerConstraints,
  IntegerFactoryConfig,
  IntegerOptions,
};
// Scalar refinements + brands (System A for i / f), mirroring the measurement quartet.
export type {
  GreaterOrEqualToZeroFloat,
  InRangeFloat,
  NonNegativeFloat,
  NonPositiveFloat,
  SmallerOrEqualToZeroFloat,
} from './float';
export {
  inRangeFloat,
  makeFloatRefinement,
  nonNegativeFloat,
  nonPositiveFloat,
} from './float';
export type {
  GreaterOrEqualToZeroInteger,
  InRangeInteger,
  NonNegativeInteger,
  NonPositiveInteger,
  SmallerOrEqualToZeroInteger,
} from './integer';
export {
  inRangeInteger,
  makeIntegerRefinement,
  nonNegativeInteger,
  nonPositiveInteger,
} from './integer';
// The shared refinement quartet type (the return type of every make*Refinement).
export type {
  Refinement,
  RefinementResult,
} from './internal/refinement';
