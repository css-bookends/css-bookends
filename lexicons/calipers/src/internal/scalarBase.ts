import { type Scalar, toNumber } from '../scalar';
import {
  createErrorConfigStore,
  createErrorHelpers,
  type ErrorCode,
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
 * A single bound EDGE as written in the OPTIONS: a bare number (value only), or an object that
 * co-locates the edge's `value` and its own `snap` policy. `V` carries the literal so a bounded
 * builder still brands `InRange<min, max>` from the object form. When an edge's resolved `snap` is
 * `true`, a breach on that edge ABSORBS to the limit instead of throwing.
 */
export type SnapEdge<V extends number = number> =
  | V
  | { value?: V; snap?: boolean };

/** A bound EDGE that FORBIDS its own `snap` (`snap?: never`): used on the edge that DEFERS to a
 *  blanket `snap`, so the redundancy ban below can reject a dead blanket at compile time. */
export type SnapEdgeNoSnap<V extends number = number> =
  | V
  | { value?: V; snap?: never };

/**
 * The bound half of a user-facing scalar config: `min` / `max` edges plus a blanket `snap`, with the
 * DEAD BLANKET (a blanket `snap` overridden on BOTH edges, so it does nothing) made a COMPILE error
 * via a three-branch union: no blanket (edges free), or blanket set + one edge DEFERRING to it
 * (`SnapEdgeNoSnap`). `{ snap: true, min: { snap: false }, max: { snap: false } }` matches no branch.
 */
export type SnapBound<
  Min extends number = number,
  Max extends number = number,
> =
  | { snap?: undefined; min?: SnapEdge<Min>; max?: SnapEdge<Max> }
  | { snap: boolean; min?: SnapEdgeNoSnap<Min>; max?: SnapEdge<Max> }
  | { snap: boolean; min?: SnapEdge<Min>; max?: SnapEdgeNoSnap<Max> };

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
> = {
  /** The lower bound edge: a bare `number`, or `{ value, snap }` co-locating the value with its own
   *  snap policy. */
  min?: SnapEdge<Min>;
  /** The upper bound edge: a bare `number`, or `{ value, snap }`. */
  max?: SnapEdge<Max>;
  /** The blanket snap policy governing BOTH edges; a per-edge `snap` (on `min` / `max`) overrides it.
   *  When resolved `true` for an edge, a breach on that edge ABSORBS to the limit instead of throwing.
   *  Loose here (internal); the user-facing factory configs layer the redundancy-ban union on top. */
  snap?: boolean;
  context?: string;
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
 * `ScalarOptions` after the constructor resolves it (the effective bounds baked in), assignable back
 * to `ScalarOptions` for `rebuildWith` / `clone`. New config props are added to `ScalarOptions`; the
 * constructor spread carries them into `#config` and `options()` returns the whole bag, so `clone`
 * picks them up with no extra wiring.
 */
export type ScalarConfig = ScalarOptions;

/** The `[context]` suffix appended to a scalar error message, or `''` when there is none. */
export const suffix = (context?: string): string =>
  context ? ` [${context}]` : '';

/** Resolve a bound EDGE (bare number or `{ value, snap }`) to its numeric limit, or `undefined`. */
export const edgeValue = (
  edge: SnapEdge | undefined,
): number | undefined =>
  edge === undefined
    ? undefined
    : typeof edge === 'number'
      ? edge
      : edge.value;

/** Resolve an edge's effective snap policy: its own `snap` if set, else the blanket, else `false`. */
export const edgeSnaps = (
  edge: SnapEdge | undefined,
  blanket: boolean | undefined,
): boolean =>
  typeof edge === 'object' && edge.snap !== undefined
    ? edge.snap
    : (blanket ?? false);

const coerce = (value: Scalar): number => toNumber(value);

/**
 * The BARE scalar base: everything a scalar needs that does NOT depend on a bound. It owns the
 * value and config fields, the finiteness check, one-shot arithmetic, introspection, and the error
 * plumbing. The construction pipeline lives here too, but the steps that only a BOUNDED scalar
 * needs (the `min > max` check, the modifier, the bound-breach throw) are delegated
 * to protected HOOKS that this class defines as no-ops / passthroughs and `ScalarRestricted`
 * overrides. The hooks take their inputs as PARAMETERS and never read instance fields, so subclass
 * field-init order is irrelevant and no subclass ever touches the private `#config`.
 *
 * `IntegerImpl` / `FloatImpl` / `UnspecifiedImpl` supply ONLY what differs per kind: the message
 * label (`i` / `f` / `u`), the extra input invariant (integers reject non-integers; floats and
 * unspecified accept any finite value), how a derived value is rebuilt, and `asScalar`. Every
 * value-producing method returns `this`, so each subclass keeps its own concrete type through
 * arithmetic and `clone`.
 */
export abstract class ScalarBase {
  #value: number;
  // The SINGLE source of truth for everything about this value EXCEPT the value itself: bound,
  // context, error store, and any config prop added later. `clone` / `rebuildWith`
  // reconstruct from this whole object (via `options()`), so a new prop is carried automatically
  // with no second list to keep in sync. It is frozen after construction; config props must be
  // immutable values (a future mutable field, e.g. a `oneOf` array, must be frozen before it
  // enters config, since `Object.freeze` is shallow).
  #config: ScalarConfig;

  /** The message prefix for this kind (`i` / `f` / `u`). */
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
  /** Build a NEW value of the same kind. Carries this value's options by default; pass `options` to
   *  rebuild with a modified config (used by `embedUnder` to stamp a wrapper label). */
  protected abstract rebuildWith(
    value: number,
    options?: ScalarOptions,
  ): this;
  /**
   * A kind-specific diagnostic on the RAW value, run BEFORE the modifier. Default no-op; `i`
   * overrides it to honour `warnOnNonIntegerInput`. Only warns, never throws or transforms.
   */
  protected warnOnRawInput(
    _value: number,
    _options: ScalarOptions,
    _context?: string,
  ): void {}

  // --- Construction hooks (bare defaults here; `ScalarRestricted` overrides them) ---------------
  // Each takes the raw `options` (and computed values) as PARAMETERS, so it never reads instance
  // fields and subclass field-init order cannot matter.

  /** The `min > max` sanity check. Bare base: no-op (a bare scalar has no bound). */
  protected checkBounds(
    _options: ScalarOptions,
    _label: string,
  ): void {}

  /** Apply the optional value modifier at intake. Bare base: passthrough (no modifier). */
  protected applyModifier(
    value: number,
    _options: ScalarOptions,
    _label: string,
  ): number {
    return value;
  }

  /** Enforce the bound at intake: throw on an un-snapped breach, or ABSORB (snap) the value to the
   *  limit, returning the possibly-snapped value. Bare base: no bound, so it passes through. */
  protected enforceBound(
    value: number,
    _options: ScalarOptions,
    _label: string,
  ): number {
    return value;
  }

  /** Assemble the frozen, normalized config: spread the options so the RAW bound (edge form + snap
   *  policy) is carried for `clone` / arithmetic to re-resolve; a future field flows in via `...`. */
  protected finalizeConfig(options: ScalarOptions): ScalarConfig {
    return { ...options };
  }

  constructor(value: number, options: ScalarOptions = {}) {
    // Preliminary config so every throw below renders through the right error store (the only
    // config the construction-time throws need). The frozen, normalized config is assembled at
    // the end once the effective bound is known.
    this.#config = { ...options };
    // The error prefix (this kind's label, wrapped by `wrapperLabel` when a measurement embeds this
    // scalar). Computed AFTER `#config` so `errorPrefix` can read the wrapper.
    const label = this.errorPrefix();
    // The `min > max` sanity check (a bound concern; no-op on the bare base).
    this.checkBounds(options, label);
    if (!Number.isFinite(value)) {
      this.throwScalar(
        `${label}: expected a finite number (got ${value})${suffix(options.context)}`,
        'CALIPERS_E_NONFINITE',
      );
    }
    // Diagnostic on the RAW value, BEFORE the modifier (e.g. `i` warns on a non-integer input).
    this.warnOnRawInput(value, options, options.context);
    // The optional modifier is ALWAYS applied at intake, before the kind check and the bound, so a
    // bounded/typed domain stays normalized (a bound concern; passthrough on the bare base).
    const finalValue = this.applyModifier(value, options, label);
    // The kind-specific input invariant, on the MODIFIED value (integers reject a non-integer;
    // floats accept). Always throws on violation; it is a type invariant, not a bound.
    this.validateInput(finalValue, options.context);
    // Enforce the bound: an un-snapped breach throws; a snapped edge ABSORBS the value to the limit.
    // enforceBound returns the possibly-snapped value (passthrough on the bare base).
    this.#value = this.enforceBound(finalValue, options, label);
    // Assemble the frozen, normalized config. The hook spreads the options (raw edge form + snap
    // policy) so `clone` / arithmetic re-resolve the same bound; a future field flows in via `...`.
    this.#config = Object.freeze(this.finalizeConfig(options));
  }

  // Throw a scalar error through this instance's error store (or a default one for the storeless
  // free builder path), so `stackHints` decides the stack block.
  protected throwScalar(message: string, code?: ErrorCode): never {
    const store = this.#config.errorStore ?? createErrorConfigStore();
    return createErrorHelpers(store).throwScalarError(message, code);
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
    return {
      min: edgeValue(this.#config.min),
      max: edgeValue(this.#config.max),
    };
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
        'CALIPERS_E_DIVIDE_BY_ZERO',
      );
    }
    const result = this.#value / numeric;
    if (!Number.isFinite(result)) {
      this.throwScalar(
        `${label}: non-finite result dividing ${this.#value} by ${numeric}${suffix(this.#config.context)}`,
        'CALIPERS_E_NONFINITE_RESULT',
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

  /**
   * Internal: a copy of this scalar embedded under an outer WRAPPER label, so its errors read
   * `<wrapper>(<kind>): ...` instead of `<kind>: ...`, and chained under the wrapper's `context` so
   * the error trace shows the full stack. Preserves the full config (bound, modifier); re-validates
   * the current value (a no-op for an in-range value). A measurement calls this when it ingests a
   * scalar, passing `'m'` + its own context, so an embedded `i` throws `m(i): ... [outer > inner]`
   * (either context alone renders `[outer]` / `[inner]`). Not a public knob (see
   * {@link ScalarOptions.wrapperLabel}).
   */
  embedUnder(wrapperLabel: string, wrapperContext?: string): this {
    const context =
      [
        wrapperContext,
        this.options().context,
      ]
        .filter((c): c is string => c !== undefined && c !== '')
        .join(' > ') || undefined;
    return this.rebuildWith(this.#value, {
      ...this.options(),
      wrapperLabel,
      context,
    });
  }
}
