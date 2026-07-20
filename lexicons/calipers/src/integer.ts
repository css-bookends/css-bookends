import {
  DEFAULT_HARDENING,
  type Hardening,
  type HardeningConfig,
} from './hardening';
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
  ScalarImpl,
  type ScalarOptions,
  suffix,
} from './internal/scalarImpl';
import type { Scalar } from './scalar';

export type IntegerConstraints = ScalarConstraints;

export type IntegerOptions<
  Min extends number = number,
  Max extends number = number,
  H extends Hardening = Hardening,
> = ScalarOptions<Min, Max, H>;

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
  /** An independent, config-preserving copy (same value, bound, and config). Returns `this`, so a
   *  branded receiver keeps its brand (the copy holds the same value + bound, so the proof still
   *  holds); arithmetic still drops the brand. To change a bound, mint a fresh value. */
  clone(): this;
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

/**
 * The integer type a bounded builder returns, resolved from the captured bound and
 * hardening. A range brand is emitted ONLY when BOTH bounds are known literals AND the
 * reaction is `'fail'` (the only reaction that guarantees the value stays in range; `'warn'`
 * drops a breached edge, so the brand would be a lie). `never` bounds (unbounded) and any
 * non-`'fail'` reaction fall back to a plain `IInteger`.
 */
export type ResolveIntegerBrand<
  Min extends number,
  Max extends number,
  H extends Hardening,
> = [
  Min,
] extends [
  never,
]
  ? IInteger
  : [
        Max,
      ] extends [
        never,
      ]
    ? IInteger
    : [
          H,
        ] extends [
          'fail',
        ]
      ? InRangeInteger<Min, Max>
      : IInteger;

class IntegerImpl extends ScalarImpl implements IInteger {
  protected label(): string {
    return 'i';
  }

  protected validateInput(value: number, context?: string): void {
    // Runs on the MODIFIED value: a modifier (e.g. `'floor'`) can recover a non-integer, but with
    // no modifier a non-integer fails loudly here.
    if (!Number.isInteger(value)) {
      this.throwScalar(
        `i: expected an integer (got ${value})${suffix(context)}`,
      );
    }
  }

  protected warnOnRawInput(
    value: number,
    options: ScalarOptions,
    context?: string,
  ): void {
    // Fires on the RAW value, before the modifier: surface a messy non-integer input that a
    // modifier would otherwise clean up silently. Opt-in; the default stays fail-loud.
    if (options.warnOnNonIntegerInput && !Number.isInteger(value)) {
      console.warn(
        `css-calipers: i received a non-integer input (${value})${suffix(context)}`,
      );
    }
  }

  protected rebuildWith(value: number): this {
    return new IntegerImpl(value, this.options()) as this;
  }

  // clamp forces the value in-range, so the InRange brand is always honest regardless of the
  // hardening reaction (System A follows System B here). Defined per-subclass, returning the
  // concrete `InRangeInteger`, so `clone` can preserve the brand (see `ScalarImpl.clampToRange`).
  clamp<Min extends number, Max extends number>(
    min: Min,
    max: Max,
  ): InRangeInteger<Min, Max> {
    return this.clampToRange(min, max) as unknown as InRangeInteger<
      Min,
      Max
    >;
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
export function i(value: number): IInteger;
// `= never` (not `= number`, cf. `ScalarConstraints`): here the default is the "no bound
// supplied, so DON'T brand" sentinel that `ResolveIntegerBrand` detects with `[Min] extends
// [never]`. A real literal still gets captured from `options` via `extends number`.
export function i<
  Min extends number = never,
  Max extends number = never,
  H extends Hardening = 'fail',
>(
  value: number,
  options: IntegerOptions<Min, Max, H>,
): ResolveIntegerBrand<Min, Max, H>;
export function i<
  Min extends number = never,
  Max extends number = never,
  H extends Hardening = 'fail',
>(
  value: number,
  options: IntegerOptions<Min, Max, H> = {},
): ResolveIntegerBrand<Min, Max, H> {
  return new IntegerImpl(
    value,
    options,
  ) as unknown as ResolveIntegerBrand<Min, Max, H>;
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
export type IntegerFactoryConfig<
  Min extends number = number,
  Max extends number = number,
  H extends Hardening = Hardening,
> = HardeningConfig<H> & {
  errorConfig?: ErrorConfig;
  /**
   * A bound baked into every value this factory builds (the named-domain pattern,
   * e.g. `createInteger({ min: 100, max: 900 })` for font-weight). Set once here; a
   * per-value bound on top throws. Unit-local (no bundle `global`). The literal
   * `Min`/`Max` (and `H`) are captured so `i` can brand its output.
   */
  min?: Min;
  max?: Max;
  /**
   * The value modifier baked into every value this factory builds, e.g. a font-weight domain
   * snapped to multiples of 100. Per-call `options.modifier` overrides it.
   */
  modifier?: Modifier;
  /** Warn when a non-integer input reaches this factory's values (default: silent). */
  warnOnNonIntegerInput?: boolean;
};

/**
 * The bound integer surface a `createInteger` instance exposes. `FactoryMin`/`FactoryMax`/
 * `FactoryH` are the factory's captured bound and reaction; `i` brands its output with the
 * RESOLVED bound (a per-call bound, else the factory's) under the resolved hardening (a per-call
 * `hardening` overrides the factory's). Set-once makes the per-call and factory bounds mutually
 * exclusive, so the resolved bound is simply whichever one is present.
 */
export interface IntegerApi<
  FactoryMin extends number = never,
  FactoryMax extends number = never,
  FactoryH extends Hardening = 'fail',
> {
  // Two call signatures: with no options the return is fixed to the factory's own resolved
  // brand (no free type params, so a call site's contextual type cannot back-infer a foreign
  // brand); with options the per-call bound / hardening drive the brand.
  i: {
    (
      value: number,
    ): ResolveIntegerBrand<FactoryMin, FactoryMax, FactoryH>;
    <
      CallMin extends number = never,
      CallMax extends number = never,
      CallH extends Hardening = FactoryH,
    >(
      value: number,
      options: IntegerOptions<CallMin, CallMax, CallH>,
    ): ResolveIntegerBrand<
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
  isInteger: (value: unknown) => value is IInteger;
}

/**
 * The integer FACTORY: bind a config once (the `hardening` reaction and an optional bound) and
 * get the integer surface with that config baked in. Mirrors `createCalipers` (measurements) and
 * `createFloat` (floats) so `m` / `i` / `f` are identical. A per-call `options.hardening` still
 * overrides the baked default.
 */
export const createInteger = <
  Min extends number = never,
  Max extends number = never,
  H extends Hardening = 'fail',
>(
  config: IntegerFactoryConfig<Min, Max, H> = {},
): IntegerApi<Min, Max, H> => {
  const hardening = config.hardening ?? DEFAULT_HARDENING;
  const { min, max, modifier, warnOnNonIntegerInput } = config;
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
  const boundI = <
    CallMin extends number = never,
    CallMax extends number = never,
    CallH extends Hardening = H,
  >(
    value: number,
    options: IntegerOptions<CallMin, CallMax, CallH> = {},
  ): ResolveIntegerBrand<
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
    return i(value, {
      hardening,
      errorStore,
      min,
      max,
      modifier,
      warnOnNonIntegerInput,
      ...options,
    }) as unknown as ResolveIntegerBrand<
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
    // `boundI` is one generic arrow that satisfies both public call signatures.
    i: boundI,
    isInteger,
  };
};
