import { DEFAULT_HARDENING, type HardeningConfig } from './hardening';
import type {
  GreaterOrEqualToZeroBrand,
  InRangeBrand,
  SmallerOrEqualToZeroBrand,
} from './internal/brands';
import {
  createErrorConfigStore,
  createErrorHelpers,
  type ErrorConfig,
} from './internal/errors';
import {
  makeRefinement,
  type Refinement,
  type RefinementAdapters,
  type RefinementSpec,
} from './internal/refinement';
import {
  type ScalarConstraints,
  ScalarImpl,
  type ScalarOptions,
  suffix,
} from './internal/scalarImpl';
import type { Scalar } from './scalar';

export type IntegerConstraints = ScalarConstraints;

export type IntegerOptions = ScalarOptions;

export interface IInteger {
  css: () => string;
  toString: () => string;
  valueOf: () => number;
  value: () => number;
  /** Always `''` (integers are unitless); present for value-surface uniformity. */
  unit: () => string;
  constraints: () => IntegerConstraints;
  isInt: () => boolean;
  isFloat: () => boolean;
  toTypedValue: () => IInteger;
  withValue: (value: number) => IInteger;
  add: (delta: Scalar) => IInteger;
  subtract: (delta: Scalar) => IInteger;
  multiply: (factor: Scalar) => IInteger;
  divide: (divisor: Scalar) => IInteger;
  clamp: <Min extends number, Max extends number>(
    min: Min,
    max: Max,
  ) => InRangeInteger<Min, Max>;
  /** An independent, config-preserving copy (same value, bound, and config). To change a bound,
   *  mint a fresh value. */
  clone: () => IInteger;
}

/**
 * An integer proven `>= 0` by `nonNegativeInteger`; `NonNegativeInteger` is the conventional
 * alias. The brand REUSES the measurement `GreaterOrEqualToZeroBrand` symbol (a pure phantom),
 * is additive over `IInteger`, and is dropped by arithmetic, so a derived value must be re-checked.
 */
export type GreaterOrEqualToZeroInteger = IInteger &
  GreaterOrEqualToZeroBrand;
export type NonNegativeInteger = GreaterOrEqualToZeroInteger;

/** An integer proven `<= 0` by `nonPositiveInteger`; `NonPositiveInteger` is the alias. */
export type SmallerOrEqualToZeroInteger = IInteger &
  SmallerOrEqualToZeroBrand;
export type NonPositiveInteger = SmallerOrEqualToZeroInteger;

/**
 * An integer proven within an inclusive range by `inRangeInteger(min, max)`. The brand carries
 * the literal bounds (exact-bound, not containment), so `InRangeInteger<0, 10>` is distinct from
 * `InRangeInteger<0, 5>`.
 */
export type InRangeInteger<
  Min extends number = number,
  Max extends number = number,
> = IInteger & InRangeBrand<Min, Max>;

class IntegerImpl extends ScalarImpl implements IInteger {
  protected label(): string {
    return 'i';
  }

  protected validateInput(value: number, context?: string): void {
    if (!Number.isInteger(value)) {
      this.throwScalar(
        `i: expected an integer (got ${value})${suffix(context)}`,
      );
    }
  }

  protected rebuildWith(value: number): this {
    return new IntegerImpl(value, this.options()) as this;
  }

  toTypedValue(): IInteger {
    return i(this.value());
  }
}

/**
 * Create a typed integer (a finite whole number) with optional range
 * constraints. Operations re-validate against the same constraints, so a
 * result that is no longer an integer (or falls out of range) throws. That is
 * how integer-ness survives arithmetic.
 */
export function i(
  value: number,
  options: IntegerOptions = {},
): IInteger {
  return new IntegerImpl(value, options);
}

export const isInteger = (value: unknown): value is IInteger =>
  value instanceof IntegerImpl;

// Integer refinements bind the shared `makeRefinement` factory with integer adapters: read
// `.value()`, throw a scalar error (a fresh default store, like the free `i()` path), and
// rebuild a fallback via `i()`. The brands reuse the measurement brand symbols (pure phantoms).
const integerRefinementAdapters: RefinementAdapters<IInteger> = {
  readValue: (value) => value.value(),
  throwConstraint: (message) =>
    createErrorHelpers(createErrorConfigStore()).throwScalarError(
      message,
    ),
  rebuild: (fallbackValue) => i(fallbackValue),
};

/**
 * Build a custom integer refinement (the quartet is / ensure / check / hardenWith over an
 * arbitrary brand), the scalar analogue of `makeMeasurementRefinement`. `nonNegativeInteger` /
 * `nonPositiveInteger` / `inRangeInteger(...)` are the built-ins.
 */
export const makeIntegerRefinement = <B>(
  spec: RefinementSpec<IInteger>,
): Refinement<IInteger, B> =>
  makeRefinement<IInteger, B>(integerRefinementAdapters, spec);

export const nonNegativeInteger =
  makeIntegerRefinement<GreaterOrEqualToZeroBrand>({
    predicate: (value) => value >= 0,
    message: (value) =>
      `expected an integer >= 0 (got ${value.css()})`,
    defaultFallback: 0,
  });

export const nonPositiveInteger =
  makeIntegerRefinement<SmallerOrEqualToZeroBrand>({
    predicate: (value) => value <= 0,
    message: (value) =>
      `expected an integer <= 0 (got ${value.css()})`,
    defaultFallback: 0,
  });

export const inRangeInteger = <
  Min extends number,
  Max extends number,
>(
  min: Min,
  max: Max,
): Refinement<IInteger, InRangeBrand<Min, Max>> => {
  if (min > max) {
    createErrorHelpers(createErrorConfigStore()).throwScalarError(
      `inRangeInteger: min (${min}) must be <= max (${max})`,
    );
  }
  return makeIntegerRefinement<InRangeBrand<Min, Max>>({
    predicate: (value) => value >= min && value <= max,
    message: (value) =>
      `expected an integer in [${min}, ${max}] (got ${value.css()})`,
    defaultFallback: min,
  });
};

/**
 * The integer factory config: the shared hardening slice (identical to m / f)
 * plus the shared `errorConfig` (stack-hint rendering), so a `createInteger`
 * instance builds its own per-instance error store like `createCalipers`.
 */
export type IntegerFactoryConfig = HardeningConfig & {
  errorConfig?: ErrorConfig;
  /**
   * A bound baked into every value this factory builds (the named-domain pattern,
   * e.g. `createInteger({ min: 100, max: 900 })` for font-weight). Set once here; a
   * per-value bound on top throws. Unit-local (no bundle `global`).
   */
  min?: number;
  max?: number;
};

/** The bound integer surface a `createInteger` instance exposes. */
export interface IntegerApi {
  i: (value: number, options?: IntegerOptions) => IInteger;
  isInteger: (value: unknown) => value is IInteger;
}

/**
 * The integer FACTORY: bind a config once (today the `hardening` reaction) and
 * get the integer surface with that config baked in. Mirrors `createCalipers`
 * (measurements) and `createFloat` (floats) so `m` / `i` / `f` are identical.
 * A per-call `options.hardening` still overrides the baked default.
 */
export const createInteger = (
  config: IntegerFactoryConfig = {},
): IntegerApi => {
  const hardening = config.hardening ?? DEFAULT_HARDENING;
  const { min, max } = config;
  const factoryBounded = min !== undefined || max !== undefined;
  // One per-instance error store, shared by every value this factory binds, so
  // the resolved `stackHints` config reaches `i`.
  const errorStore = createErrorConfigStore(config.errorConfig ?? {});
  // A bound is set ONCE, from one source: if the factory bakes a bound, a value
  // may not also carry its own. To change it, mint a fresh value.
  const guardBound = (constraints: IntegerConstraints): void => {
    if (
      factoryBounded &&
      (constraints.min !== undefined || constraints.max !== undefined)
    ) {
      createErrorHelpers(errorStore).throwScalarError(
        'i: a factory bound is already set; a value cannot take a second bound (a bound is set once, from one source). Mint a fresh value with the new bound instead.',
      );
    }
  };
  return {
    i: (value, options = {}) => {
      guardBound(options);
      return i(value, {
        hardening,
        errorStore,
        min,
        max,
        ...options,
      });
    },
    isInteger,
  };
};
