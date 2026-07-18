import {
  DEFAULT_HARDENING,
  type Hardening,
  reactToBreach,
} from '../hardening';
import { type Scalar, toNumber } from '../scalar';
import { type InRangeBrand } from './brands';
import {
  createErrorConfigStore,
  createErrorHelpers,
  type ErrorConfigStore,
} from './errors';
import { toPlainDecimal } from './toPlainDecimal';

export type ScalarConstraints = {
  min?: number;
  max?: number;
};

export type ScalarOptions = ScalarConstraints & {
  context?: string;
  /**
   * Reaction when a bound is breached (at construction or through arithmetic):
   * the shared `'warn' | 'fail'` config (default `'fail'` = throw). A bundle
   * `global` can relax it.
   */
  hardening?: Hardening;
  /**
   * The per-instance error store this value throws through (carries the resolved
   * `stackHints` config). Threaded by the factory; the free builder leaves it
   * undefined and falls back to a default store.
   */
  errorStore?: ErrorConfigStore;
};

/** The `[context]` suffix appended to a scalar error message, or `''` when there is none. */
export const suffix = (context?: string): string =>
  context ? ` [${context}]` : '';

const coerce = (value: Scalar): number => toNumber(value);

/**
 * The shared integer / float implementation. `IntegerImpl` and `FloatImpl` extend it and supply
 * ONLY what differs: the message label (`i` / `f`), the extra input invariant (integers reject
 * non-integers; floats accept any finite value), how a derived value is rebuilt, and
 * `toTypedValue`. Every value-producing method returns `this`, so each subclass keeps its own
 * concrete type (`IInteger` / `IFloat`) through arithmetic and `clone`.
 */
export abstract class ScalarImpl {
  #value: number;
  #min?: number;
  #max?: number;
  #context?: string;
  #hardening: Hardening;
  #errorStore?: ErrorConfigStore;

  /** The message prefix for this kind (`i` / `f`). */
  protected abstract label(): string;
  /** Extra input invariant beyond finiteness (integers reject non-integers; floats accept). */
  protected abstract validateInput(
    value: number,
    context?: string,
  ): void;
  /** Build a NEW value of the same kind, carrying this value's options. */
  protected abstract rebuildWith(value: number): this;

  constructor(value: number, options: ScalarOptions = {}) {
    const { min, max, context } = options;
    const hardening = options.hardening ?? DEFAULT_HARDENING;
    const label = this.label();
    // Set the error store FIRST so every throw below renders through it.
    this.#errorStore = options.errorStore;
    if (min !== undefined && max !== undefined && min > max) {
      this.throwScalar(
        `${label}: min (${min}) must be <= max (${max})${suffix(context)}`,
      );
    }
    if (!Number.isFinite(value)) {
      this.throwScalar(
        `${label}: expected a finite number (got ${value})${suffix(context)}`,
      );
    }
    // The kind-specific input invariant (e.g. integers reject non-integers). Always throws; it is
    // a type invariant, not a bound.
    this.validateInput(value, context);
    // Range breaches go through the shared hardening reaction. On a 'warn' breach the reaction
    // returns here and the now-violated edge is DROPPED (its guarantee is broken); 'fail' has
    // already thrown.
    let effectiveMin = min;
    let effectiveMax = max;
    if (min !== undefined && value < min) {
      reactToBreach(
        hardening,
        `${label}: ${value} is below the minimum ${min}${suffix(context)}`,
        (message) => this.throwScalar(message),
      );
      effectiveMin = undefined;
    }
    if (max !== undefined && value > max) {
      reactToBreach(
        hardening,
        `${label}: ${value} is above the maximum ${max}${suffix(context)}`,
        (message) => this.throwScalar(message),
      );
      effectiveMax = undefined;
    }
    this.#value = value;
    this.#min = effectiveMin;
    this.#max = effectiveMax;
    this.#context = context;
    this.#hardening = hardening;
  }

  // Throw a scalar error through this instance's error store (or a default one for the storeless
  // free builder path), so `stackHints` decides the stack block.
  protected throwScalar(message: string): never {
    const store = this.#errorStore ?? createErrorConfigStore();
    return createErrorHelpers(store).throwScalarError(message);
  }

  protected options(): ScalarOptions {
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

  constraints(): ScalarConstraints {
    return { min: this.#min, max: this.#max };
  }

  isInt(): boolean {
    return Number.isInteger(this.#value);
  }

  isFloat(): boolean {
    return !Number.isInteger(this.#value);
  }

  css(): string {
    return toPlainDecimal(this.#value);
  }

  toString(): string {
    return this.css();
  }

  withValue(value: number): this {
    return this.rebuildWith(value);
  }

  add(delta: Scalar): this {
    return this.rebuildWith(this.#value + coerce(delta));
  }

  subtract(delta: Scalar): this {
    return this.rebuildWith(this.#value - coerce(delta));
  }

  multiply(factor: Scalar): this {
    return this.rebuildWith(this.#value * coerce(factor));
  }

  divide(divisor: Scalar): this {
    const numeric = coerce(divisor);
    const label = this.label();
    if (numeric === 0) {
      this.throwScalar(
        `${label}: cannot divide ${this.#value} by zero${suffix(this.#context)}`,
      );
    }
    const result = this.#value / numeric;
    if (!Number.isFinite(result)) {
      this.throwScalar(
        `${label}: non-finite result dividing ${this.#value} by ${numeric}${suffix(this.#context)}`,
      );
    }
    return this.rebuildWith(result);
  }

  clamp<Min extends number, Max extends number>(
    min: Min,
    max: Max,
  ): this & InRangeBrand<Min, Max> {
    if (min > max) {
      this.throwScalar(
        `${this.label()}.clamp: min (${min}) must be <= max (${max})`,
      );
    }
    // clamp forces the value in-range, so the InRange brand is always honest
    // regardless of the hardening reaction (System A follows System B here).
    return this.rebuildWith(
      Math.min(max, Math.max(min, this.#value)),
    ) as this & InRangeBrand<Min, Max>;
  }

  clone(): this {
    return this.rebuildWith(this.#value);
  }
}
