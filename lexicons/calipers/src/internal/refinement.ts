// The SHARED value-constraint refinement factory. `makeMeasurementRefinement` (measurements)
// and `makeIntegerRefinement` / `makeFloatRefinement` (scalars) are all thin wrappers over
// this: it builds the quartet (is / ensure / check / hardenWith) from a numeric predicate and
// narrows to a constraint brand, parameterized by a few value-type adapters so the same logic
// serves any numeric lexicon. The brand is a pure phantom (see `core.ts`), additive on success
// and DROPPED by arithmetic (a result can cross a bound), so a derived value must be re-checked.

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
}

/** The predicate + messaging a specific refinement supplies. */
export interface RefinementSpec<V> {
  predicate: (value: number) => boolean;
  message: (value: V) => string;
  defaultFallback?: number;
}

export const makeRefinement = <V, B>(
  adapters: RefinementAdapters<V>,
  spec: RefinementSpec<V>,
): Refinement<V, B> => {
  const is = <T extends V>(value: T): value is T & B =>
    spec.predicate(adapters.readValue(value));

  const ensure = <T extends V>(value: T, context?: string): T & B => {
    if (!is(value)) {
      adapters.throwConstraint(spec.message(value), value, context);
    }
    // `throwConstraint` returns `never`, so the fall-through is narrowed to `T & B` by the
    // `is` guard: no cast needed.
    return value;
  };

  const check = <T extends V>(value: T): RefinementResult<T, B> =>
    is(value)
      ? { ok: true, value }
      : { ok: false, value, error: spec.message(value) };

  const hardenWith = <T extends V>(
    value: T,
    fallback?: T & B,
  ): T & B => {
    if (is(value)) return value;
    if (fallback !== undefined) return fallback;
    const { defaultFallback } = spec;
    if (defaultFallback !== undefined && adapters.rebuild) {
      return adapters.rebuild(
        defaultFallback,
        value,
      ) as unknown as T & B;
    }
    return adapters.throwConstraint(
      'no fallback provided and this refinement has no default fallback',
      value,
    );
  };

  return { is, ensure, check, hardenWith };
};
