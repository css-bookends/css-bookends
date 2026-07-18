import { DEFAULT_HARDENING, type HardeningConfig } from './hardening';
import { i, type IInteger } from './integer';
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
} from './internal/scalarImpl';
import type { Scalar } from './scalar';

export type FloatConstraints = ScalarConstraints;

export type FloatOptions = ScalarOptions;

export interface IFloat {
  css: () => string;
  toString: () => string;
  valueOf: () => number;
  value: () => number;
  /** Always `''` (floats are unitless); present for value-surface uniformity. */
  unit: () => string;
  constraints: () => FloatConstraints;
  isInt: () => boolean;
  isFloat: () => boolean;
  toTypedValue: () => IInteger | IFloat;
  withValue: (value: number) => IFloat;
  add: (delta: Scalar) => IFloat;
  subtract: (delta: Scalar) => IFloat;
  multiply: (factor: Scalar) => IFloat;
  divide: (divisor: Scalar) => IFloat;
  clamp: <Min extends number, Max extends number>(
    min: Min,
    max: Max,
  ) => InRangeFloat<Min, Max>;
  /** An independent, config-preserving copy (same value, bound, and config). To change a bound,
   *  mint a fresh value. */
  clone: () => IFloat;
}

/**
 * A float proven `>= 0` by `nonNegativeFloat`; `NonNegativeFloat` is the conventional alias. The
 * brand REUSES the measurement `GreaterOrEqualToZeroBrand` symbol (a pure phantom), is additive
 * over `IFloat`, and is dropped by arithmetic, so a derived value must be re-checked.
 */
export type GreaterOrEqualToZeroFloat = IFloat &
  GreaterOrEqualToZeroBrand;
export type NonNegativeFloat = GreaterOrEqualToZeroFloat;

/** A float proven `<= 0` by `nonPositiveFloat`; `NonPositiveFloat` is the alias. */
export type SmallerOrEqualToZeroFloat = IFloat &
  SmallerOrEqualToZeroBrand;
export type NonPositiveFloat = SmallerOrEqualToZeroFloat;

/**
 * A float proven within an inclusive range by `inRangeFloat(min, max)`. The brand carries the
 * literal bounds (exact-bound, not containment), so `InRangeFloat<0, 1>` is distinct from
 * `InRangeFloat<0, 2>`.
 */
export type InRangeFloat<
  Min extends number = number,
  Max extends number = number,
> = IFloat & InRangeBrand<Min, Max>;

class FloatImpl extends ScalarImpl implements IFloat {
  protected label(): string {
    return 'f';
  }

  protected validateInput(): void {
    // Floats accept any finite value; the base's finiteness check is enough.
  }

  protected rebuildWith(value: number): this {
    return new FloatImpl(value, this.options()) as this;
  }

  toTypedValue(): IInteger | IFloat {
    return Number.isInteger(this.value())
      ? i(this.value())
      : f(this.value());
  }
}

/**
 * Create a typed float (a finite, unitless real number) with optional range
 * constraints. Operations re-validate against the same constraints, so a
 * hardened float stays hardened (or throws) through arithmetic.
 */
export function f(value: number, options: FloatOptions = {}): IFloat {
  return new FloatImpl(value, options);
}

export const isFloat = (value: unknown): value is IFloat =>
  value instanceof FloatImpl;

// Float refinements bind the shared `makeRefinement` factory with float adapters, mirroring the
// integer refinements: read `.value()`, throw a scalar error, rebuild a fallback via `f()`.
const floatRefinementAdapters: RefinementAdapters<IFloat> = {
  readValue: (value) => value.value(),
  throwConstraint: (message) =>
    createErrorHelpers(createErrorConfigStore()).throwScalarError(
      message,
    ),
  rebuild: (fallbackValue) => f(fallbackValue),
};

/**
 * Build a custom float refinement (the quartet is / ensure / check / hardenWith over an arbitrary
 * brand), the scalar analogue of `makeMeasurementRefinement`. `nonNegativeFloat` /
 * `nonPositiveFloat` / `inRangeFloat(...)` are the built-ins.
 */
export const makeFloatRefinement = <B>(
  spec: RefinementSpec<IFloat>,
): Refinement<IFloat, B> =>
  makeRefinement<IFloat, B>(floatRefinementAdapters, spec);

export const nonNegativeFloat =
  makeFloatRefinement<GreaterOrEqualToZeroBrand>({
    predicate: (value) => value >= 0,
    message: (value) => `expected a float >= 0 (got ${value.css()})`,
    defaultFallback: 0,
  });

export const nonPositiveFloat =
  makeFloatRefinement<SmallerOrEqualToZeroBrand>({
    predicate: (value) => value <= 0,
    message: (value) => `expected a float <= 0 (got ${value.css()})`,
    defaultFallback: 0,
  });

export const inRangeFloat = <Min extends number, Max extends number>(
  min: Min,
  max: Max,
): Refinement<IFloat, InRangeBrand<Min, Max>> => {
  if (min > max) {
    createErrorHelpers(createErrorConfigStore()).throwScalarError(
      `inRangeFloat: min (${min}) must be <= max (${max})`,
    );
  }
  return makeFloatRefinement<InRangeBrand<Min, Max>>({
    predicate: (value) => value >= min && value <= max,
    message: (value) =>
      `expected a float in [${min}, ${max}] (got ${value.css()})`,
    defaultFallback: min,
  });
};

/**
 * The float factory config: the shared hardening slice (identical to m / i)
 * plus the shared `errorConfig` (stack-hint rendering), so a `createFloat`
 * instance builds its own per-instance error store like `createCalipers`.
 */
export type FloatFactoryConfig = HardeningConfig & {
  errorConfig?: ErrorConfig;
  /**
   * A bound baked into every value this factory builds (the named-domain pattern,
   * e.g. `createFloat({ min: 0, max: 1 })` for opacity). Set once here; a per-value
   * bound on top throws. Unit-local (no bundle `global`).
   */
  min?: number;
  max?: number;
};

/** The bound float surface a `createFloat` instance exposes. */
export interface FloatApi {
  f: (value: number, options?: FloatOptions) => IFloat;
  isFloat: (value: unknown) => value is IFloat;
}

/**
 * The float FACTORY: bind a config once (today the `hardening` reaction) and
 * get the float surface with that config baked in. Mirrors `createCalipers`
 * (measurements) and `createInteger` (integers) so `m` / `i` / `f` are
 * identical. A per-call `options.hardening` still overrides the baked default.
 */
export const createFloat = (
  config: FloatFactoryConfig = {},
): FloatApi => {
  const hardening = config.hardening ?? DEFAULT_HARDENING;
  const { min, max } = config;
  const factoryBounded = min !== undefined || max !== undefined;
  // One per-instance error store, shared by every value this factory binds, so
  // the resolved `stackHints` config reaches `f`.
  const errorStore = createErrorConfigStore(config.errorConfig ?? {});
  // A bound is set ONCE, from one source: if the factory bakes a bound, a value
  // may not also carry its own. To change it, mint a fresh value.
  const guardBound = (constraints: FloatConstraints): void => {
    if (
      factoryBounded &&
      (constraints.min !== undefined || constraints.max !== undefined)
    ) {
      createErrorHelpers(errorStore).throwScalarError(
        'f: a factory bound is already set; a value cannot take a second bound (a bound is set once, from one source). Mint a fresh value with the new bound instead.',
      );
    }
  };
  return {
    f: (value, options = {}) => {
      guardBound(options);
      return f(value, {
        hardening,
        errorStore,
        min,
        max,
        ...options,
      });
    },
    isFloat,
  };
};
