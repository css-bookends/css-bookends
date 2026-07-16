import {
  DEFAULT_HARDENING,
  type Hardening,
  type HardeningConfig,
  reactToBreach,
} from './hardening';
import {
  createErrorConfigStore,
  createErrorHelpers,
  type ErrorConfig,
  type ErrorConfigStore,
} from './internal/errors';
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
}

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
    if (min !== undefined && value < min) {
      reactToBreach(
        hardening,
        `i: ${value} is below the minimum ${min}${suffix(context)}`,
        (message) => this.#throwScalar(message),
      );
    }
    if (max !== undefined && value > max) {
      reactToBreach(
        hardening,
        `i: ${value} is above the maximum ${max}${suffix(context)}`,
        (message) => this.#throwScalar(message),
      );
    }
    this.#value = value;
    this.#min = min;
    this.#max = max;
    this.#context = context;
    this.#hardening = hardening;
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

/**
 * The integer factory config: the shared hardening slice (identical to m / f)
 * plus the shared `errorConfig` (stack-hint rendering), so a `createInteger`
 * instance builds its own per-instance error store like `createCalipers`.
 */
export type IntegerFactoryConfig = HardeningConfig & {
  errorConfig?: ErrorConfig;
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
  // One per-instance error store, shared by every value this factory binds, so
  // the resolved `stackHints` config reaches both `i` and `hardenInteger`.
  const errorStore = createErrorConfigStore(config.errorConfig ?? {});
  return {
    i: (value, options = {}) =>
      i(value, { hardening, errorStore, ...options }),
    hardenInteger:
      (constraints = {}) =>
      (value, context) =>
        i(value, { hardening, errorStore, ...constraints, context }),
    isInteger,
  };
};
