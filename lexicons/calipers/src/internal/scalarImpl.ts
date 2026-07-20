import {
  DEFAULT_HARDENING,
  type Hardening,
  reactToBreach,
} from '../hardening';
import { type Scalar, toNumber } from '../scalar';
import {
  createErrorConfigStore,
  createErrorHelpers,
  type ErrorConfigStore,
} from './errors';
import { toPlainDecimal } from './toPlainDecimal';

// The `Min extends number = number` idiom does two distinct jobs, one per `number`:
//   - `extends number` (the CONSTRAINT) is what makes TS capture the LITERAL: a param
//     constrained to `number` is inferred as narrowly as possible (`100`) instead of
//     widening to `number`, and that literal is what lets a builder brand `InRange<100, 900>`.
//     Drop the constraint and the brand collapses to the useless `InRange<number, number>`.
//   - `= number` (the DEFAULT) is the fallback when nothing is supplied or inferred (a bare
//     `ScalarConstraints` used as a plain holder type), where an ordinary `min?: number` is right.
// So: capture the exact literal if given, else fall back to plain `number`. (The factory
// FUNCTIONS below default to `never` instead, a "no bound, don't brand" sentinel; see there.)
export type ScalarConstraints<
  Min extends number = number,
  Max extends number = number,
> = {
  min?: Min;
  max?: Max;
};

export type ScalarOptions<
  Min extends number = number,
  Max extends number = number,
  H extends Hardening = Hardening,
> = ScalarConstraints<Min, Max> & {
  context?: string;
  /**
   * Reaction when a bound is breached (at construction or through arithmetic):
   * the shared `'warn' | 'fail'` config (default `'fail'` = throw). A bundle
   * `global` can relax it.
   */
  hardening?: H;
  /**
   * The per-instance error store this value throws through (carries the resolved
   * `stackHints` config). Threaded by the factory; the free builder leaves it
   * undefined and falls back to a default store.
   */
  errorStore?: ErrorConfigStore;
};

/**
 * The normalized config a scalar stores as its SINGLE source of truth (`#config`). It is a
 * `ScalarOptions` after the constructor resolves it (the hardening default applied, the warn-dropped
 * bounds baked in), so it is assignable back to `ScalarOptions` for `rebuildWith` / `clone`. New
 * config props are added HERE (and to `ScalarOptions`); the constructor spread carries them into
 * `#config` and `options()` returns the whole bag, so `clone` picks them up with no extra wiring.
 */
export type ScalarConfig = ScalarOptions & { hardening: Hardening };

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
  // The SINGLE source of truth for everything about this value EXCEPT the value itself: bound,
  // context, hardening, error store, and any config prop added later. `clone` / `rebuildWith`
  // reconstruct from this whole object (via `options()`), so a new prop is carried automatically
  // with no second list to keep in sync. It is frozen after construction; config props must be
  // immutable values (a future mutable field, e.g. a `oneOf` array, must be frozen before it
  // enters config, since `Object.freeze` is shallow).
  #config: ScalarConfig;

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
    // Preliminary config so every throw below renders through the right error store (the only
    // config the construction-time throws need). The frozen, normalized config is assembled at
    // the end once the warn-drop is known.
    this.#config = { ...options, hardening };
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
    // Assemble the frozen, normalized config with a SPREAD, not a hand-listed set: a future field
    // added to `ScalarOptions` flows in via `...options`; only the fields that need normalization
    // (the warn-dropped bounds, the defaulted hardening) are overridden by name.
    this.#config = Object.freeze({
      ...options,
      min: effectiveMin,
      max: effectiveMax,
      hardening,
    });
  }

  // Throw a scalar error through this instance's error store (or a default one for the storeless
  // free builder path), so `stackHints` decides the stack block.
  protected throwScalar(message: string): never {
    const store = this.#config.errorStore ?? createErrorConfigStore();
    return createErrorHelpers(store).throwScalarError(message);
  }

  protected options(): ScalarOptions {
    return this.#config;
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
    return { min: this.#config.min, max: this.#config.max };
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
        `${label}: cannot divide ${this.#value} by zero${suffix(this.#config.context)}`,
      );
    }
    const result = this.#value / numeric;
    if (!Number.isFinite(result)) {
      this.throwScalar(
        `${label}: non-finite result dividing ${this.#value} by ${numeric}${suffix(this.#config.context)}`,
      );
    }
    return this.rebuildWith(result);
  }

  // The clamp MATH lives here; the public, brand-returning `clamp` is defined on each subclass
  // (it returns the concrete `InRangeInteger` / `InRangeFloat`, whose `clone` preserves the brand
  // through the interface's polymorphic `this`). A base method returning `this & InRangeBrand`
  // could not compose with `clone(): this` in the implements check, since `this` drops an
  // externally-intersected brand.
  protected clampToRange(min: number, max: number): this {
    if (min > max) {
      this.throwScalar(
        `${this.label()}.clamp: min (${min}) must be <= max (${max})`,
      );
    }
    return this.rebuildWith(
      Math.min(max, Math.max(min, this.#value)),
    );
  }

  clone(): this {
    return this.rebuildWith(this.#value);
  }
}
