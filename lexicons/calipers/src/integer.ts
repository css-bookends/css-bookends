import { toPlainDecimal } from './internal/toPlainDecimal';

export type IntegerConstraints = {
  min?: number;
  max?: number;
};

export type IntegerOptions = IntegerConstraints & {
  context?: string;
};

export interface IInteger {
  css: () => string;
  toString: () => string;
  valueOf: () => number;
  value: () => number;
  constraints: () => IntegerConstraints;
  withValue: (value: number) => IInteger;
  add: (delta: number | IInteger) => IInteger;
  subtract: (delta: number | IInteger) => IInteger;
  multiply: (factor: number) => IInteger;
  clamp: (min: number, max: number) => IInteger;
}

const suffix = (context?: string): string =>
  context ? ` [${context}]` : '';

const coerce = (value: number | IInteger): number =>
  typeof value === 'number' ? value : value.valueOf();

class IntegerImpl implements IInteger {
  #value: number;
  #min?: number;
  #max?: number;
  #context?: string;

  constructor(value: number, options: IntegerOptions = {}) {
    const { min, max, context } = options;
    if (min !== undefined && max !== undefined && min > max) {
      throw new Error(
        `i: min (${min}) must be <= max (${max})${suffix(context)}`,
      );
    }
    if (!Number.isFinite(value)) {
      throw new Error(
        `i: expected a finite number (got ${value})${suffix(context)}`,
      );
    }
    if (!Number.isInteger(value)) {
      throw new Error(
        `i: expected an integer (got ${value})${suffix(context)}`,
      );
    }
    if (min !== undefined && value < min) {
      throw new Error(
        `i: ${value} is below the minimum ${min}${suffix(context)}`,
      );
    }
    if (max !== undefined && value > max) {
      throw new Error(
        `i: ${value} is above the maximum ${max}${suffix(context)}`,
      );
    }
    this.#value = value;
    this.#min = min;
    this.#max = max;
    this.#context = context;
  }

  #options(): IntegerOptions {
    return { min: this.#min, max: this.#max, context: this.#context };
  }

  value(): number {
    return this.#value;
  }

  valueOf(): number {
    return this.#value;
  }

  constraints(): IntegerConstraints {
    return { min: this.#min, max: this.#max };
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

  add(delta: number | IInteger): IInteger {
    return this.withValue(this.#value + coerce(delta));
  }

  subtract(delta: number | IInteger): IInteger {
    return this.withValue(this.#value - coerce(delta));
  }

  multiply(factor: number): IInteger {
    return this.withValue(this.#value * factor);
  }

  clamp(min: number, max: number): IInteger {
    if (min > max) {
      throw new Error(
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
