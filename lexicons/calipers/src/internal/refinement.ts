// The SHARED value-constraint refinement factory. `makeMeasurementRefinement` (measurements)
// and `makeIntegerRefinement` / `makeFloatRefinement` (scalars) are all thin wrappers over
// this: it builds the quartet (is / ensure / check / hardenWith) from a numeric predicate and
// narrows to a constraint brand, parameterized by a few value-type adapters so the same logic
// serves any numeric lexicon.
//
// A BUILT-IN bound refinement (nonNegative / nonPositive / inRange) also declares a `bound`, so
// `ensure` / `hardenWith` re-mint a fresh copy carrying that bound (refinements-as-bounds): the
// brand is then backed by a runtime bound and PRESERVED through arithmetic (the HARD RULE), not
// dropped. A bound is set ONCE: refining an already-bounded value throws (mint a fresh value to
// re-bound). A CUSTOM refinement declares no bound, so it only brands (and arithmetic drops it).

/** Result of a non-throwing refinement check (`refinement.check`). */
export type RefinementResult<V, B> =
  | { ok: true; value: V & B }
  | { ok: false; value: V; error: string };

/**
 * The quartet a value-constraint refinement exposes. `V` is the value type it operates on
 * (e.g. `IMeasurement`, `IInteger`), `B` the constraint brand it applies on success.
 */
export interface Refinement<V, B> {
  /** Non-throwing guard; narrows to the brand on success. */
  is: <T extends V>(value: T) => value is T & B;
  /** Throws if the constraint fails; otherwise returns the branded value. */
  ensure: <T extends V>(value: T, context?: string) => T & B;
  /** Non-throwing; returns an ok/error result. */
  check: <T extends V>(value: T) => RefinementResult<T, B>;
  /** Returns the value if valid, else the fallback (default: a known-good value). */
  hardenWith: <T extends V>(value: T, fallback?: T & B) => T & B;
}

/** The min/max a bound refinement stores (either edge optional). */
export interface RefinementBound {
  min?: number;
  max?: number;
}

/** The value-type adapters that bind the shared factory to one lexicon. */
export interface RefinementAdapters<V> {
  /** Read the raw number a predicate checks (`m.value()`, `i.value()`, ...). */
  readValue: (value: V) => number;
  /** Throw the lexicon's constraint error (returns `never`). */
  throwConstraint: (
    message: string,
    value: V,
    context?: string,
  ) => never;
  /** Rebuild a value from `defaultFallback` for `hardenWith` (optional). */
  rebuild?: (fallbackValue: number, from: V) => V;
  /** The value's current runtime bound, to enforce set-once (bound refinements only). */
  constraintsOf?: (value: V) => RefinementBound;
  /** Re-mint a fresh copy of the value carrying `bound` (bound refinements only). */
  mintBounded?: (value: V, bound: RefinementBound) => V;
}

/** The predicate + messaging a specific refinement supplies. */
export interface RefinementSpec<V> {
  predicate: (value: number) => boolean;
  message: (value: V) => string;
  defaultFallback?: number;
  /**
   * A BUILT-IN bound refinement's stored bound (min 0 / max 0 / [a, b]). When set (and the adapters
   * support it), `ensure` / `hardenWith` re-mint a fresh bounded copy so the brand is runtime-backed.
   * A custom refinement leaves it undefined (brand only).
   */
  bound?: RefinementBound;
}

export const makeRefinement = <V, B>(
  adapters: RefinementAdapters<V>,
  spec: RefinementSpec<V>,
): Refinement<V, B> => {
  const is = <T extends V>(value: T): value is T & B =>
    spec.predicate(adapters.readValue(value));

  // Re-mint a fresh copy carrying the refinement's bound so the brand is runtime-backed. A bound is
  // set ONCE: with `strict`, re-bounding an already-bounded value THROWS (mint a fresh value); the
  // soft form (check / hardenWith) leaves an already-bounded value untouched (it never throws). A
  // refinement with no bound (custom) returns the value unchanged (brand only).
  const applyBound = <T extends V>(
    value: T,
    strict: boolean,
    context?: string,
  ): T & B => {
    if (!spec.bound || !adapters.mintBounded) {
      return value as unknown as T & B;
    }
    const existing = adapters.constraintsOf?.(value);
    if (
      existing &&
      (existing.min !== undefined || existing.max !== undefined)
    ) {
      if (strict) {
        adapters.throwConstraint(
          'a bound is already set; a value takes a bound once, from one source. Mint a fresh value to re-bound.',
          value,
          context,
        );
      }
      return value as unknown as T & B;
    }
    return adapters.mintBounded(value, spec.bound) as unknown as T &
      B;
  };

  const ensure = <T extends V>(value: T, context?: string): T & B => {
    if (!is(value)) {
      adapters.throwConstraint(spec.message(value), value, context);
    }
    // `throwConstraint` returns `never`, so the fall-through is narrowed to `T & B` by `is`.
    return applyBound(value, true, context);
  };

  const check = <T extends V>(value: T): RefinementResult<T, B> =>
    is(value)
      ? { ok: true, value: applyBound(value, false) }
      : { ok: false, value, error: spec.message(value) };

  const hardenWith = <T extends V>(
    value: T,
    fallback?: T & B,
  ): T & B => {
    if (is(value)) return applyBound(value, false);
    if (fallback !== undefined) return fallback;
    const { defaultFallback } = spec;
    if (defaultFallback !== undefined && adapters.rebuild) {
      return applyBound(
        adapters.rebuild(defaultFallback, value) as unknown as T,
        false,
      );
    }
    return adapters.throwConstraint(
      'no fallback provided and this refinement has no default fallback',
      value,
    );
  };

  return { is, ensure, check, hardenWith };
};
