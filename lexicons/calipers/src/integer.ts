import {
  DEFAULT_HARDENING,
  type Hardening,
  type HardeningConfig,
  mergeCloneConstraints,
  reactToBreach,
  resolveSealFlags,
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
  type ErrorConfigStore,
} from './internal/errors';
import {
  makeRefinement,
  type Refinement,
  type RefinementAdapters,
  type RefinementSpec,
} from './internal/refinement';
import { toPlainDecimal } from './internal/toPlainDecimal';
import { type Scalar, toNumber } from './scalar';

export type IntegerConstraints = {
  min?: number;
  max?: number;
};

export type IntegerOptions = IntegerConstraints & {
  context?: string;
  /**
   * Reaction when a bound is breached (at construction or through arithmetic):
   * the shared `'ignore' | 'warn' | 'fail'` config (default `'fail'` = throw,
   * the historical behaviour). A bundle `global` can relax it.
   */
  hardening?: Hardening;
  /**
   * The per-instance error store this value throws through (carries the
   * resolved `stackHints` config). Threaded by `createInteger`; the free `i()`
   * export leaves it undefined and falls back to a default store.
   */
  errorStore?: ErrorConfigStore;
  /**
   * Whether the min / max edge is SEALED (locked against `clone`). Defaults to true for any edge
   * that has a bound (safety by default); pass false to make that edge editable.
   */
  sealedMin?: boolean;
  sealedMax?: boolean;
};

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
  clamp: (min: number, max: number) => IInteger;
  /** An independent copy. A `patch` merges over the bound and re-validates; changing a SEALED
   *  edge throws (mint a fresh value instead). */
  clone: (patch?: IntegerConstraints) => IInteger;
  /** A copy with the min / max / both edge sealed (additive; you never unseal in place). */
  sealMin: () => IInteger;
  sealMax: () => IInteger;
  sealRange: () => IInteger;
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

const suffix = (context?: string): string =>
  context ? ` [${context}]` : '';

const coerce = (value: Scalar): number => toNumber(value);

class IntegerImpl implements IInteger {
  #value: number;
  #min?: number;
  #max?: number;
  #context?: string;
  #hardening: Hardening;
  #errorStore?: ErrorConfigStore;
  #sealedMin: boolean;
  #sealedMax: boolean;

  constructor(value: number, options: IntegerOptions = {}) {
    const { min, max, context } = options;
    const hardening = options.hardening ?? DEFAULT_HARDENING;
    // Set the error store FIRST so every throw below renders through it.
    this.#errorStore = options.errorStore;
    if (min !== undefined && max !== undefined && min > max) {
      this.#throwScalar(
        `i: min (${min}) must be <= max (${max})${suffix(context)}`,
      );
    }
    if (!Number.isFinite(value)) {
      this.#throwScalar(
        `i: expected a finite number (got ${value})${suffix(context)}`,
      );
    }
    if (!Number.isInteger(value)) {
      this.#throwScalar(
        `i: expected an integer (got ${value})${suffix(context)}`,
      );
    }
    // Range breaches go through the shared hardening reaction; the finite /
    // integer invariants above always throw (type invariants, not a bound).
    // On a 'warn' / 'ignore' breach the reaction returns here and the now-violated edge
    // is DROPPED (its guarantee is broken); 'fail' has already thrown above.
    let effectiveMin = min;
    let effectiveMax = max;
    if (min !== undefined && value < min) {
      reactToBreach(
        hardening,
        `i: ${value} is below the minimum ${min}${suffix(context)}`,
        (message) => this.#throwScalar(message),
      );
      effectiveMin = undefined;
    }
    if (max !== undefined && value > max) {
      reactToBreach(
        hardening,
        `i: ${value} is above the maximum ${max}${suffix(context)}`,
        (message) => this.#throwScalar(message),
      );
      effectiveMax = undefined;
    }
    this.#value = value;
    this.#min = effectiveMin;
    this.#max = effectiveMax;
    this.#context = context;
    this.#hardening = hardening;
    const seal = resolveSealFlags(
      { min: effectiveMin, max: effectiveMax },
      options,
    );
    this.#sealedMin = seal.min;
    this.#sealedMax = seal.max;
  }

  // Throw a scalar error through this instance's error store (or a default one
  // for the storeless free `i()` path), so `stackHints` decides the stack block.
  #throwScalar(message: string): never {
    const store = this.#errorStore ?? createErrorConfigStore();
    return createErrorHelpers(store).throwScalarError(message);
  }

  #options(): IntegerOptions {
    return {
      min: this.#min,
      max: this.#max,
      context: this.#context,
      hardening: this.#hardening,
      errorStore: this.#errorStore,
      sealedMin: this.#sealedMin,
      sealedMax: this.#sealedMax,
    };
  }

  value(): number {
    return this.#value;
  }

  unit(): string {
    return '';
  }

  valueOf(): number {
    return this.#value;
  }

  constraints(): IntegerConstraints {
    return { min: this.#min, max: this.#max };
  }

  isInt(): boolean {
    return Number.isInteger(this.#value);
  }

  isFloat(): boolean {
    return !Number.isInteger(this.#value);
  }

  toTypedValue(): IInteger {
    return i(this.#value);
  }

  css(): string {
    return toPlainDecimal(this.#value);
  }

  toString(): string {
    return this.css();
  }

  withValue(value: number): IInteger {
    return new IntegerImpl(value, this.#options());
  }

  add(delta: Scalar): IInteger {
    return this.withValue(this.#value + coerce(delta));
  }

  subtract(delta: Scalar): IInteger {
    return this.withValue(this.#value - coerce(delta));
  }

  multiply(factor: Scalar): IInteger {
    return this.withValue(this.#value * coerce(factor));
  }

  divide(divisor: Scalar): IInteger {
    const numeric = coerce(divisor);
    if (numeric === 0) {
      this.#throwScalar(
        `i: cannot divide ${this.#value} by zero${suffix(this.#context)}`,
      );
    }
    const result = this.#value / numeric;
    if (!Number.isFinite(result)) {
      this.#throwScalar(
        `i: non-finite result dividing ${this.#value} by ${numeric}${suffix(this.#context)}`,
      );
    }
    return this.withValue(result);
  }

  clamp(min: number, max: number): IInteger {
    if (min > max) {
      this.#throwScalar(
        `i.clamp: min (${min}) must be <= max (${max})`,
      );
    }
    return this.withValue(Math.min(max, Math.max(min, this.#value)));
  }

  clone(patch: IntegerConstraints = {}): IInteger {
    const merged = mergeCloneConstraints(
      { min: this.#min, max: this.#max },
      { min: this.#sealedMin, max: this.#sealedMax },
      patch,
      (message) => this.#throwScalar(message),
    );
    return new IntegerImpl(this.#value, {
      ...merged,
      context: this.#context,
      hardening: this.#hardening,
      errorStore: this.#errorStore,
      sealedMin: this.#sealedMin,
      sealedMax: this.#sealedMax,
    });
  }

  sealMin(): IInteger {
    return new IntegerImpl(this.#value, {
      ...this.#options(),
      sealedMin: true,
    });
  }

  sealMax(): IInteger {
    return new IntegerImpl(this.#value, {
      ...this.#options(),
      sealedMax: true,
    });
  }

  sealRange(): IInteger {
    return new IntegerImpl(this.#value, {
      ...this.#options(),
      sealedMin: true,
      sealedMax: true,
    });
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

/**
 * Bind a set of integer constraints once and reuse the bound factory, the
 * scalar analogue of `makeUnitHelper`. For example, a font-weight value is
 * `hardenInteger({ min: 1, max: 1000 })`.
 */
export const hardenInteger =
  (constraints: IntegerConstraints = {}) =>
  (value: number, context?: string): IInteger =>
    new IntegerImpl(value, { ...constraints, context });

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
   * Default seal state for this instance's bounded values, resolving per-value option ->
   * this factory config -> built-in default (`true`). `sealed` is unit-local (no bundle
   * `global`), like `min` / `max`.
   */
  sealedMin?: boolean;
  sealedMax?: boolean;
};

/** The bound integer surface a `createInteger` instance exposes. */
export interface IntegerApi {
  i: (value: number, options?: IntegerOptions) => IInteger;
  hardenInteger: (
    constraints?: IntegerConstraints,
  ) => (value: number, context?: string) => IInteger;
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
  const { sealedMin, sealedMax } = config;
  // One per-instance error store, shared by every value this factory binds, so
  // the resolved `stackHints` config reaches both `i` and `hardenInteger`.
  const errorStore = createErrorConfigStore(config.errorConfig ?? {});
  return {
    i: (value, options = {}) =>
      i(value, {
        hardening,
        errorStore,
        sealedMin,
        sealedMax,
        ...options,
      }),
    hardenInteger:
      (constraints = {}) =>
      (value, context) =>
        i(value, {
          hardening,
          errorStore,
          sealedMin,
          sealedMax,
          ...constraints,
          context,
        }),
    isInteger,
  };
};
