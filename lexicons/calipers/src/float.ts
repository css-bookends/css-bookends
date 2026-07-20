import {
  DEFAULT_HARDENING,
  type Hardening,
  type HardeningConfig,
} from './hardening';
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

export type FloatOptions<
  Min extends number = number,
  Max extends number = number,
  H extends Hardening = Hardening,
> = ScalarOptions<Min, Max, H>;

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
  /** An independent, config-preserving copy (same value, bound, and config). Returns `this`, so a
   *  branded receiver keeps its brand (the copy holds the same value + bound, so the proof still
   *  holds); arithmetic still drops the brand. To change a bound, mint a fresh value. */
  clone(): this;
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

/**
 * The float type a bounded builder returns, resolved from the captured bound and hardening.
 * A range brand is emitted ONLY when BOTH bounds are known literals AND the reaction is
 * `'fail'` (the only reaction that keeps the value in range; `'warn'` drops a breached edge, so
 * the brand would be a lie). `never` bounds (unbounded) and any non-`'fail'` reaction fall back
 * to a plain `IFloat`. Mirrors `ResolveIntegerBrand`.
 */
export type ResolveFloatBrand<
  Min extends number,
  Max extends number,
  H extends Hardening,
> = [
  Min,
] extends [
  never,
]
  ? IFloat
  : [
        Max,
      ] extends [
        never,
      ]
    ? IFloat
    : [
          H,
        ] extends [
          'fail',
        ]
      ? InRangeFloat<Min, Max>
      : IFloat;

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

  // clamp forces the value in-range, so the InRange brand is always honest regardless of the
  // hardening reaction (System A follows System B here). Defined per-subclass, returning the
  // concrete `InRangeFloat`, so `clone` can preserve the brand (see `ScalarImpl.clampToRange`).
  clamp<Min extends number, Max extends number>(
    min: Min,
    max: Max,
  ): InRangeFloat<Min, Max> {
    return this.clampToRange(min, max) as unknown as InRangeFloat<
      Min,
      Max
    >;
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
export function f(value: number): IFloat;
// `= never` (not `= number`, cf. `ScalarConstraints`): here the default is the "no bound
// supplied, so DON'T brand" sentinel that `ResolveFloatBrand` detects with `[Min] extends
// [never]`. A real literal still gets captured from `options` via `extends number`.
export function f<
  Min extends number = never,
  Max extends number = never,
  H extends Hardening = 'fail',
>(
  value: number,
  options: FloatOptions<Min, Max, H>,
): ResolveFloatBrand<Min, Max, H>;
export function f<
  Min extends number = never,
  Max extends number = never,
  H extends Hardening = 'fail',
>(
  value: number,
  options: FloatOptions<Min, Max, H> = {},
): ResolveFloatBrand<Min, Max, H> {
  return new FloatImpl(
    value,
    options,
  ) as unknown as ResolveFloatBrand<Min, Max, H>;
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
export type FloatFactoryConfig<
  Min extends number = number,
  Max extends number = number,
  H extends Hardening = Hardening,
> = HardeningConfig<H> & {
  errorConfig?: ErrorConfig;
  /**
   * A bound baked into every value this factory builds (the named-domain pattern,
   * e.g. `createFloat({ min: 0, max: 1 })` for opacity). Set once here; a per-value
   * bound on top throws. Unit-local (no bundle `global`). The literal `Min`/`Max`
   * (and `H`) are captured so `f` can brand its output.
   */
  min?: Min;
  max?: Max;
};

/**
 * The bound float surface a `createFloat` instance exposes. `FactoryMin`/`FactoryMax`/`FactoryH`
 * are the factory's captured bound and reaction; `f` brands its output with the RESOLVED bound
 * (a per-call bound, else the factory's) under the resolved hardening (a per-call `hardening`
 * overrides the factory's). Set-once makes the per-call and factory bounds mutually exclusive, so
 * the resolved bound is simply whichever one is present. Mirrors `IntegerApi`.
 */
export interface FloatApi<
  FactoryMin extends number = never,
  FactoryMax extends number = never,
  FactoryH extends Hardening = 'fail',
> {
  // Two call signatures: with no options the return is fixed to the factory's own resolved
  // brand (no free type params, so a call site's contextual type cannot back-infer a foreign
  // brand); with options the per-call bound / hardening drive the brand.
  f: {
    (
      value: number,
    ): ResolveFloatBrand<FactoryMin, FactoryMax, FactoryH>;
    <
      CallMin extends number = never,
      CallMax extends number = never,
      CallH extends Hardening = FactoryH,
    >(
      value: number,
      options: FloatOptions<CallMin, CallMax, CallH>,
    ): ResolveFloatBrand<
      [
        CallMin,
      ] extends [
        never,
      ]
        ? FactoryMin
        : CallMin,
      [
        CallMax,
      ] extends [
        never,
      ]
        ? FactoryMax
        : CallMax,
      CallH
    >;
  };
  isFloat: (value: unknown) => value is IFloat;
}

/**
 * The float FACTORY: bind a config once (the `hardening` reaction and an optional bound) and get
 * the float surface with that config baked in. Mirrors `createCalipers` (measurements) and
 * `createInteger` (integers) so `m` / `i` / `f` are identical. A per-call `options.hardening`
 * still overrides the baked default.
 */
export const createFloat = <
  Min extends number = never,
  Max extends number = never,
  H extends Hardening = 'fail',
>(
  config: FloatFactoryConfig<Min, Max, H> = {},
): FloatApi<Min, Max, H> => {
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
  const boundF = <
    CallMin extends number = never,
    CallMax extends number = never,
    CallH extends Hardening = H,
  >(
    value: number,
    options: FloatOptions<CallMin, CallMax, CallH> = {},
  ): ResolveFloatBrand<
    [
      CallMin,
    ] extends [
      never,
    ]
      ? Min
      : CallMin,
    [
      CallMax,
    ] extends [
      never,
    ]
      ? Max
      : CallMax,
    CallH
  > => {
    guardBound(options);
    return f(value, {
      hardening,
      errorStore,
      min,
      max,
      ...options,
    }) as unknown as ResolveFloatBrand<
      [
        CallMin,
      ] extends [
        never,
      ]
        ? Min
        : CallMin,
      [
        CallMax,
      ] extends [
        never,
      ]
        ? Max
        : CallMax,
      CallH
    >;
  };
  return {
    // `boundF` is one generic arrow that satisfies both public call signatures.
    f: boundF,
    isFloat,
  };
};
