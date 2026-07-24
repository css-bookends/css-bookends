// Type-level integer arithmetic for the author-time magnitude / overflow checks (D4). Tuple-based, so:
//   - INTEGER-only AND NON-NEGATIVE (a fraction has no tuple length, a negative has none either), so
//     floats and negatives are unsupported and fall to the runtime;
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

type Digit =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9';

/**
 * An operand is NATIVELY CHECKABLE (by TS's own type-level tuple arithmetic, as opposed to the runtime
 * and the eslint script, which check EVERYTHING) iff it is a non-negative integer literal with at most
 * three digits (0-999). Tuple length has no negative or fractional value, and `BuildTuple<N>` for N at or
 * over ~1000 hits TS's recursion limit (TS2589), so a negative, a fraction, or a 4+-digit literal is
 * SKIPPED from the type-level check; the runtime and the eslint script are the backstop for those.
 */
type IsNativelyCheckable<N extends number> = number extends N
  ? false
  : `${N}` extends `-${string}`
    ? false
    : `${N}` extends `${string}.${string}`
      ? false
      : `${N}` extends `${Digit}${Digit}${Digit}${Digit}${string}`
        ? false
        : true;

/**
 * Does a bounded construction PROVABLY overflow? True iff `Value` is a NATIVELY-CHECKABLE literal (a
 * non-negative integer, 0-999) exceeding a natively-checkable `Max` (over) or under such a `Min` (under). A
 * non-literal `Value`, a `never` bound (that side unbounded), or any negative / fractional / 4+-digit
 * operand skips the check (D6): the runtime and eslint script are the backstop, never a false error.
 */
export type Overflows<
  Value extends number,
  Min extends number,
  Max extends number,
> = number extends Value
  ? false
  : IsNativelyCheckable<Value> extends false
    ? false
    : (
          [
            Max,
          ] extends [
            never,
          ]
            ? false
            : IsNativelyCheckable<Max> extends false
              ? false
              : GreaterThan<Value, Max>
        ) extends true
      ? true
      : (
            [
              Min,
            ] extends [
              never,
            ]
              ? false
              : IsNativelyCheckable<Min> extends false
                ? false
                : GreaterThan<Min, Value>
          ) extends true
        ? true
        : false;

/**
 * The construction guard (S3): intersect onto `i`'s `value` parameter so a PROVABLE overflow is a compile
 * error. `Value` stays naked in `value: Value & OverflowGuard<...>`, so it still infers; on overflow the
 * guard is an object shape a bare number cannot satisfy, so the call is rejected with the bound shown in
 * the message. In range (or skipped) it is `unknown`, which intersects away to leave `value: Value`.
 */
export type OverflowGuard<
  Value extends number,
  Min extends number,
  Max extends number,
> =
  Overflows<Value, Min, Max> extends true
    ? {
        readonly __overflow: [
          'css-calipers: value out of range',
          Value,
          'bounds',
          Min,
          Max,
        ];
      }
    : unknown;
