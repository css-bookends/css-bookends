import { toPlainDecimal } from './internal/toPlainDecimal';

export type FloatConstraints = {
  min?: number;
  max?: number;
};

export type FloatOptions = FloatConstraints & {
  context?: string;
};

export interface IFloat {
  css: () => string;
  toString: () => string;
  valueOf: () => number;
  value: () => number;
  constraints: () => FloatConstraints;
  withValue: (value: number) => IFloat;
  add: (delta: number | IFloat) => IFloat;
  subtract: (delta: number | IFloat) => IFloat;
  multiply: (factor: number) => IFloat;
  clamp: (min: number, max: number) => IFloat;
}

const suffix = (context?: string): string =>
  context ? ` [${context}]` : '';

const coerce = (value: number | IFloat): number =>
  typeof value === 'number' ? value : value.valueOf();

class FloatImpl implements IFloat {
  #value: number;
  #min?: number;
  #max?: number;
  #context?: string;

  constructor(value: number, options: FloatOptions = {}) {
    const { min, max, context } = options;
    if (min !== undefined && max !== undefined && min > max) {
      throw new Error(
        `f: min (${min}) must be <= max (${max})${suffix(context)}`,
      );
    }
    if (!Number.isFinite(value)) {
      throw new Error(
        `f: expected a finite number (got ${value})${suffix(context)}`,
      );
    }
    if (min !== undefined && value < min) {
      throw new Error(
        `f: ${value} is below the minimum ${min}${suffix(context)}`,
      );
    }
    if (max !== undefined && value > max) {
      throw new Error(
        `f: ${value} is above the maximum ${max}${suffix(context)}`,
      );
    }
    this.#value = value;
    this.#min = min;
    this.#max = max;
    this.#context = context;
  }

  #options(): FloatOptions {
    return { min: this.#min, max: this.#max, context: this.#context };
  }

  value(): number {
    return this.#value;
  }

  valueOf(): number {
    return this.#value;
  }

  constraints(): FloatConstraints {
    return { min: this.#min, max: this.#max };
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

  add(delta: number | IFloat): IFloat {
    return this.withValue(this.#value + coerce(delta));
  }

  subtract(delta: number | IFloat): IFloat {
    return this.withValue(this.#value - coerce(delta));
  }

  multiply(factor: number): IFloat {
    return this.withValue(this.#value * factor);
  }

  clamp(min: number, max: number): IFloat {
    if (min > max) {
      throw new Error(
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
