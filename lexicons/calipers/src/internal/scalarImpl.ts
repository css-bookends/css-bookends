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

/**
 * An optional value transform applied at intake. The three named shortcuts resolve to the JS
 * rounding built-ins (`'floor'` -> `Math.floor`, `'ceil'` -> `Math.ceil`, `'round'` -> `Math.round`)
 * for the common case; a function gives full control (e.g. `n => Math.round(n / 100) * 100` to snap
 * a font weight to a grid).
 */
export type Modifier =
  | 'floor'
  | 'ceil'
  | 'round'
  | ((value: number) => number);

const MATH_MODIFIERS: Record<
  'floor' | 'ceil' | 'round',
  (value: number) => number
> = {
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
};

/** Resolve a {@link Modifier} to its function (a named shortcut reuses the JS built-in). */
export const resolveModifier = (
  modifier: Modifier,
): ((value: number) => number) =>
  typeof modifier === 'function'
    ? modifier
    : MATH_MODIFIERS[modifier];

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
  /**
   * An optional value transform, ALWAYS applied at intake (before the kind check and the bound),
   * if defined. Mechanism, not policy: pass `'floor'` to round an `i` down, or a function to snap
   * to a grid. It runs on every value the builder mints, including arithmetic results (the config
   * is carried), so a bounded domain stays normalized. For `i` the integer check still runs AFTER,
   * so a modifier that yields a non-integer throws; with NO modifier a non-integer fails loudly.
   * Mirrors the `modifier` on `m`.
   */
  modifier?: Modifier;
  /**
   * Integer-only diagnostic (default `false`): `console.warn` when the RAW value (before the
   * modifier) is not an integer. Off by default so the fail-loud default stands; turn it on to
   * surface messy inputs that a `modifier` would otherwise clean up silently.
   */
  warnOnNonIntegerInput?: boolean;
  /**
   * Internal plumbing: an outer context that PREFIXES this scalar's error label. When set, a throw
   * reads `<wrapperLabel>(<kind>): ...` instead of `<kind>: ...`. A measurement passes `'m'` when it
   * embeds a scalar, so the error names both the measurement and the embedded subtype (e.g.
   * `m(i): ...`). Not a public knob.
   */
  wrapperLabel?: string;
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
  /**
   * The kind-specific input invariant, run AFTER the optional modifier (integers reject a
   * non-integer; floats accept any finite value). Always throws on violation; it is a type
   * invariant, not a bound.
   */
  protected abstract validateInput(
    value: number,
    context?: string,
  ): void;
  /** Build a NEW value of the same kind, carrying this value's options. */
  protected abstract rebuildWith(value: number): this;
  /**
   * A kind-specific diagnostic on the RAW value, run BEFORE the modifier. Default no-op; `i`
   * overrides it to honour `warnOnNonIntegerInput`. Only warns, never throws or transforms.
   */
  protected warnOnRawInput(
    _value: number,
    _options: ScalarOptions,
    _context?: string,
  ): void {}

  constructor(value: number, options: ScalarOptions = {}) {
    const { min, max, context } = options;
    const hardening = options.hardening ?? DEFAULT_HARDENING;
    // Preliminary config so every throw below renders through the right error store (the only
    // config the construction-time throws need). The frozen, normalized config is assembled at
    // the end once the warn-drop is known.
    this.#config = { ...options, hardening };
    // The error prefix (this kind's label, wrapped by `wrapperLabel` when a measurement embeds this
    // scalar). Computed AFTER `#config` so `errorPrefix` can read the wrapper.
    const label = this.errorPrefix();
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
    // Diagnostic on the RAW value, BEFORE the modifier (e.g. `i` warns on a non-integer input).
    this.warnOnRawInput(value, options, context);
    // The optional modifier is ALWAYS applied at intake, before the kind check and the bound, so a
    // bounded/typed domain stays normalized (e.g. an `i` rounded, or snapped to a grid).
    const finalValue =
      options.modifier !== undefined
        ? resolveModifier(options.modifier)(value)
        : value;
    if (!Number.isFinite(finalValue)) {
      this.throwScalar(
        `${label}: modifier produced a non-finite value (${finalValue})${suffix(context)}`,
      );
    }
    // The kind-specific input invariant, on the MODIFIED value (integers reject a non-integer;
    // floats accept). Always throws on violation; it is a type invariant, not a bound.
    this.validateInput(finalValue, context);
    // Range breaches go through the shared hardening reaction. On a 'warn' breach the reaction
    // returns here and the now-violated edge is DROPPED (its guarantee is broken); 'fail' has
    // already thrown.
    let effectiveMin = min;
    let effectiveMax = max;
    if (min !== undefined && finalValue < min) {
      reactToBreach(
        hardening,
        `${label}: ${finalValue} is below the minimum ${min}${suffix(context)}`,
        (message) => this.throwScalar(message),
      );
      effectiveMin = undefined;
    }
    if (max !== undefined && finalValue > max) {
      reactToBreach(
        hardening,
        `${label}: ${finalValue} is above the maximum ${max}${suffix(context)}`,
        (message) => this.throwScalar(message),
      );
      effectiveMax = undefined;
    }
    this.#value = finalValue;
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

  // The error-message prefix: this kind's label, wrapped by the outer context when one is set
  // (`wrapperLabel` -> `<wrapper>(<kind>)`, e.g. `m(i)`), so an embedded scalar names the measurement
  // AND the subtype. Used by every scalar throw.
  protected errorPrefix(): string {
    const wrapper = this.#config.wrapperLabel;
    return wrapper ? `${wrapper}(${this.label()})` : this.label();
  }

  protected options(): ScalarOptions {
    return this.#config;
  }

  value(): number {
    return this.#value;
  }

  /** The scalar's kind label (`'i'` / `'f'` / `'u'`). A measurement reads this to name its embedded
   *  subtype in errors (`m(<kind>): ...`); distinct from the value-based `isInt()` / `isFloat()`. */
  kind(): string {
    return this.label();
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
    const label = this.errorPrefix();
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
        `${this.errorPrefix()}.clamp: min (${min}) must be <= max (${max})`,
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
