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
  type Modifier,
  type ScalarConstraints,
  type ScalarOptions,
  type SnapBound,
} from './internal/scalarBase';
import { ScalarRestricted } from './internal/scalarRestricted';
import type { Scalar } from './scalar';

export type FloatConstraints = ScalarConstraints;

export type FloatOptions<
  Min extends number = number,
  Max extends number = number,
> = SnapBound<Min, Max> &
  Omit<ScalarOptions<Min, Max>, 'min' | 'max' | 'snap'>;

export interface IFloat {
  css: () => string;
  toString: () => string;
  valueOf: () => number;
  value: () => number;
  /** The scalar's kind label (`'f'`). Distinct from the value-based `isFloat()`. */
  kind: () => string;
  /** Always `''` (floats are unitless); present for value-surface uniformity. */
  unit: () => string;
  constraints: () => FloatConstraints;
  isInt: () => boolean;
  isFloat: () => boolean;
  asScalar: () => IInteger | IFloat;
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
 * The float type a bounded builder returns, resolved from the captured bound. A range brand is
 * emitted when BOTH bounds are known literals; `never` bounds (unbounded) fall back to a plain
 * `IFloat`. (A bounded value is always in range or it throws, so the brand is always honest.)
 * Mirrors `ResolveIntegerBrand`.
 */
export type ResolveFloatBrand<
  Min extends number,
  Max extends number,
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
    : InRangeFloat<Min, Max>;

class FloatImpl extends ScalarRestricted implements IFloat {
  protected label(): string {
    return 'f';
  }

  protected validateInput(): void {
    // Floats accept any finite value; the base's finiteness check is enough.
  }

  protected rebuildWith(
    value: number,
    options: ScalarOptions = this.options(),
  ): this {
    return new FloatImpl(value, options) as this;
  }

  // clamp forces the value in-range, so the InRange brand is always honest (System A follows
  // System B here). Defined per-subclass, returning the
  // concrete `InRangeFloat`, so `clone` can preserve the brand (see `ScalarBase.clampToRange`).
  clamp<Min extends number, Max extends number>(
    min: Min,
    max: Max,
  ): InRangeFloat<Min, Max> {
    return this.clampToRange(min, max) as unknown as InRangeFloat<
      Min,
      Max
    >;
  }

  asScalar(): IInteger | IFloat {
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
>(
  value: number,
  options: FloatOptions<Min, Max>,
): ResolveFloatBrand<Min, Max>;
export function f<
  Min extends number = never,
  Max extends number = never,
>(
  value: number,
  options: FloatOptions<Min, Max> = {},
): ResolveFloatBrand<Min, Max> {
  return new FloatImpl(
    value,
    options,
  ) as unknown as ResolveFloatBrand<Min, Max>;
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
 * The float factory config: the shared `errorConfig` (stack-hint rendering) plus an
 * optional baked bound, so a `createFloatFactory` instance builds its own per-instance error
 * store like `createCalipersFactory`.
 */
export type FloatFactoryConfig<
  Min extends number = number,
  Max extends number = number,
> = SnapBound<Min, Max> & {
  errorConfig?: ErrorConfig;
  /**
   * The value modifier baked into every value this factory builds. Per-call `options.modifier`
   * overrides it. Floats accept whatever the modifier returns (no integer check).
   */
  modifier?: Modifier;
};

/**
 * The bound float surface a `createFloatFactory` instance exposes. `FactoryMin`/`FactoryMax` are the
 * factory's captured bound; `f` brands its output with the RESOLVED bound (a per-call bound, else
 * the factory's). Set-once makes the per-call and factory bounds mutually exclusive, so the
 * resolved bound is simply whichever one is present. Mirrors `IntegerApi`.
 */
export interface FloatApi<
  FactoryMin extends number = never,
  FactoryMax extends number = never,
> {
  // Two call signatures: with no options the return is fixed to the factory's own resolved
  // brand (no free type params, so a call site's contextual type cannot back-infer a foreign
  // brand); with options the per-call bound drives the brand.
  f: {
    (value: number): ResolveFloatBrand<FactoryMin, FactoryMax>;
    <CallMin extends number = never, CallMax extends number = never>(
      value: number,
      options: FloatOptions<CallMin, CallMax>,
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
        : CallMax
    >;
  };
  isFloat: (value: unknown) => value is IFloat;
}

/**
 * The float FACTORY: bind a config once (an optional baked bound + errorConfig) and get the float
 * surface with that config baked in. Mirrors `createCalipersFactory` (measurements) and `createIntegerFactory`
 * (integers) so `m` / `i` / `f` are identical.
 */
export const createFloatFactory = <
  Min extends number = never,
  Max extends number = never,
>(
  config: FloatFactoryConfig<Min, Max> = {},
): FloatApi<Min, Max> => {
  const { min, max, snap, modifier } = config;
  const factoryBounded = min !== undefined || max !== undefined;
  // One per-instance error store, shared by every value this factory binds, so
  // the resolved `stackHints` config reaches `f`.
  const errorStore = createErrorConfigStore(config.errorConfig ?? {});
  // A bound is set ONCE, from one source: if the factory bakes a bound, a value
  // may not also carry its own. To change it, mint a fresh value.
  const guardBound = (constraints: FloatOptions): void => {
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
  >(
    value: number,
    options: FloatOptions<CallMin, CallMax> = {},
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
      : CallMax
  > => {
    guardBound(options);
    return f(value, {
      errorStore,
      min,
      max,
      snap,
      modifier,
      ...options,
      // Internal composition of an already-validated factory bound + per-value options; the strict
      // `SnapBound` union guards USER input, so cast past it here.
    } as unknown as FloatOptions<
      CallMin,
      CallMax
    >) as unknown as ResolveFloatBrand<
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
        : CallMax
    >;
  };
  return {
    // `boundF` is one generic arrow that satisfies both public call signatures.
    f: boundF,
    isFloat,
  };
};
