import {
  DEFAULT_HARDENING,
  type Hardening,
  type HardeningConfig,
  reactToBreach,
} from './hardening';
import { i, type IInteger } from './integer';
import {
  createErrorConfigStore,
  createErrorHelpers,
  type ErrorConfig,
  type ErrorConfigStore,
} from './internal/errors';
import { toPlainDecimal } from './internal/toPlainDecimal';
import { type Scalar, toNumber } from './scalar';

export type FloatConstraints = {
  min?: number;
  max?: number;
};

export type FloatOptions = FloatConstraints & {
  context?: string;
  /**
   * Reaction when a bound is breached (at construction or through arithmetic):
   * the shared `'ignore' | 'warn' | 'fail'` config (default `'fail'` = throw,
   * the historical behaviour). A bundle `global` can relax it.
   */
  hardening?: Hardening;
  /**
   * The per-instance error store this value throws through (carries the
   * resolved `stackHints` config). Threaded by `createFloat`; the free `f()`
   * export leaves it undefined and falls back to a default store.
   */
  errorStore?: ErrorConfigStore;
};

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
  clamp: (min: number, max: number) => IFloat;
}

const suffix = (context?: string): string =>
  context ? ` [${context}]` : '';

const coerce = (value: Scalar): number => toNumber(value);

class FloatImpl implements IFloat {
  #value: number;
  #min?: number;
  #max?: number;
  #context?: string;
  #hardening: Hardening;
  #errorStore?: ErrorConfigStore;

  constructor(value: number, options: FloatOptions = {}) {
    const { min, max, context } = options;
    const hardening = options.hardening ?? DEFAULT_HARDENING;
    // Set the error store FIRST so every throw below renders through it.
    this.#errorStore = options.errorStore;
    if (min !== undefined && max !== undefined && min > max) {
      this.#throwScalar(
        `f: min (${min}) must be <= max (${max})${suffix(context)}`,
      );
    }
    if (!Number.isFinite(value)) {
      this.#throwScalar(
        `f: expected a finite number (got ${value})${suffix(context)}`,
      );
    }
    // Range breaches go through the shared hardening reaction; the finite
    // invariant above always throws (a type invariant, not a bound).
    if (min !== undefined && value < min) {
      reactToBreach(
        hardening,
        `f: ${value} is below the minimum ${min}${suffix(context)}`,
        (message) => this.#throwScalar(message),
      );
    }
    if (max !== undefined && value > max) {
      reactToBreach(
        hardening,
        `f: ${value} is above the maximum ${max}${suffix(context)}`,
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
  // for the storeless free `f()` path), so `stackHints` decides the stack block.
  #throwScalar(message: string): never {
    const store = this.#errorStore ?? createErrorConfigStore();
    return createErrorHelpers(store).throwScalarError(message);
  }

  #options(): FloatOptions {
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

  constraints(): FloatConstraints {
    return { min: this.#min, max: this.#max };
  }

  isInt(): boolean {
    return Number.isInteger(this.#value);
  }

  isFloat(): boolean {
    return !Number.isInteger(this.#value);
  }

  toTypedValue(): IInteger | IFloat {
    return Number.isInteger(this.#value)
      ? i(this.#value)
      : f(this.#value);
  }

  css(): string {
    return toPlainDecimal(this.#value);
  }

  toString(): string {
    return this.css();
  }

  withValue(value: number): IFloat {
    return new FloatImpl(value, this.#options());
  }

  add(delta: Scalar): IFloat {
    return this.withValue(this.#value + coerce(delta));
  }

  subtract(delta: Scalar): IFloat {
    return this.withValue(this.#value - coerce(delta));
  }

  multiply(factor: Scalar): IFloat {
    return this.withValue(this.#value * coerce(factor));
  }

  divide(divisor: Scalar): IFloat {
    const numeric = coerce(divisor);
    if (numeric === 0) {
      this.#throwScalar(
        `f: cannot divide ${this.#value} by zero${suffix(this.#context)}`,
      );
    }
    const result = this.#value / numeric;
    if (!Number.isFinite(result)) {
      this.#throwScalar(
        `f: non-finite result dividing ${this.#value} by ${numeric}${suffix(this.#context)}`,
      );
    }
    return this.withValue(result);
  }

  clamp(min: number, max: number): IFloat {
    if (min > max) {
      this.#throwScalar(
        `f.clamp: min (${min}) must be <= max (${max})`,
      );
    }
    return this.withValue(Math.min(max, Math.max(min, this.#value)));
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

/**
 * Bind a set of float constraints once and reuse the bound factory, the scalar
 * analogue of `makeUnitHelper`. For example, an opacity value is
 * `hardenFloat({ min: 0, max: 1 })`.
 */
export const hardenFloat =
  (constraints: FloatConstraints = {}) =>
  (value: number, context?: string): IFloat =>
    new FloatImpl(value, { ...constraints, context });

export const isFloat = (value: unknown): value is IFloat =>
  value instanceof FloatImpl;

/**
 * The float factory config: the shared hardening slice (identical to m / i)
 * plus the shared `errorConfig` (stack-hint rendering), so a `createFloat`
 * instance builds its own per-instance error store like `createCalipers`.
 */
export type FloatFactoryConfig = HardeningConfig & {
  errorConfig?: ErrorConfig;
};

/** The bound float surface a `createFloat` instance exposes. */
export interface FloatApi {
  f: (value: number, options?: FloatOptions) => IFloat;
  hardenFloat: (
    constraints?: FloatConstraints,
  ) => (value: number, context?: string) => IFloat;
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
  // One per-instance error store, shared by every value this factory binds, so
  // the resolved `stackHints` config reaches both `f` and `hardenFloat`.
  const errorStore = createErrorConfigStore(config.errorConfig ?? {});
  return {
    f: (value, options = {}) =>
      f(value, { hardening, errorStore, ...options }),
    hardenFloat:
      (constraints = {}) =>
      (value, context) =>
        f(value, { hardening, errorStore, ...constraints, context }),
    isFloat,
  };
};
