// Type-level integer arithmetic for the author-time magnitude / overflow checks (D4). Tuple-based, so:
//   - INTEGER-only (a fraction has no length, so there is no float support);
//   - products are bounded by TypeScript's ~10,000 tuple-length ceiling (a bigger product is a
//     "too large to represent" error at the use site), measured on TS 5.9.3.
// See docs/magnitude.md (D2 / D6) and the README's "Author-time overflow checks" section. The arithmetic
// primitives do NOT touch the scalar types; `ValueBrand` (below) is the one bridge: the phantom `i` uses
// to carry its literal value into those checks.

/** A tuple of length `N` (unary encoding); the building block for the arithmetic below. */
type BuildTuple<
  N extends number,
  A extends unknown[] = [],
> = A['length'] extends N
  ? A
  : BuildTuple<
      N,
      [
        ...A,
        unknown,
      ]
    >;

/**
 * `A * B` as a number literal (e.g. `Multiply<5, 3>` is `15`). Integer-only; a product over ~10,000
 * exceeds TS's tuple-length ceiling and becomes a "too large to represent" error at the use site.
 */
export type Multiply<
  A extends number,
  B extends number,
  Acc extends unknown[] = [],
  I extends unknown[] = [],
> = I['length'] extends B
  ? Acc['length']
  : Multiply<
      A,
      B,
      [
        ...Acc,
        ...BuildTuple<A>,
      ],
      [
        ...I,
        unknown,
      ]
    >;

/**
 * `A > B`, strict (e.g. `GreaterThan<15, 10>` is `true`, `GreaterThan<10, 10>` is `false`). Integer-only,
 * same tuple ceiling as {@link Multiply}.
 */
export type GreaterThan<A extends number, B extends number> =
  BuildTuple<A> extends [
    ...BuildTuple<B>,
    unknown,
    ...unknown[],
  ]
    ? true
    : false;

// The value bridge: how `i` carries its literal value onto the type so the overflow checks (S3+) can read
// it back off `this`. Keyed by a module-private `unique symbol`, like the constraint brands in `brands.ts`.
declare const valueBrand: unique symbol;

/**
 * Carries a scalar's literal VALUE at the type level, so the overflow checks (S3+) can read it off `this`.
 * TRANSPARENT for a non-literal (`number extends V` -> `unknown`, which intersects away), so `i(x)` with
 * `x: number` never gains it. `ResolveIntegerBrand` applies it ONLY on the bounded branch: an unbounded
 * `i(5)` has no bound to check, so it stays plain `IInteger`, while a bounded `i(5, { min, max })` gains
 * `ValueBrand<5>`. The arithmetic ops shed it (via `PreserveIntegerBrand`) until S4 threads it through
 * them. Integers only; `f` never captures (D6).
 */
export type ValueBrand<V extends number> = number extends V
  ? unknown
  : { readonly [valueBrand]: V };
