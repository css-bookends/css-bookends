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

// The value bridge: how `i` carries its literal value onto the type so the overflow checks can read
// it back off `this`. Keyed by a module-private `unique symbol`, like the constraint brands in `brands.ts`.
declare const valueBrand: unique symbol;

/**
 * Carries a scalar's literal VALUE at the type level, so the overflow checks can read it off `this`.
 * TRANSPARENT for a non-literal (`number extends V` -> `unknown`, which intersects away), so `i(x)` with
 * `x: number` never gains it. `ResolveIntegerBrand` applies it ONLY on the bounded branch: an unbounded
 * `i(5)` has no bound to check, so it stays plain `IInteger`, while a bounded `i(5, { min, max })` gains
 * `ValueBrand<5>`. The arithmetic ops shed it (via `PreserveIntegerBrand`) until an op threads it through
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
 * The construction guard: intersect onto `i`'s `value` parameter so a PROVABLE overflow is a compile
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

/**
 * Read the literal value `i` captured back off a receiver's `ValueBrand`, so an op can compute with
 * it. `never` when the receiver has no captured value (unbounded, or built from a non-literal).
 */
export type ValueOf<T> = T extends {
  readonly [valueBrand]: infer V extends number;
}
  ? V
  : never;

/**
 * The OPERAND's value for a math guard (the "FactorValue" rule): a number LITERAL is itself; a BOUNDED
 * `i` scalar contributes its OWN captured value (via {@link ValueOf}), so `x.multiply(i(3, { min, max }))`
 * checks against `3`; an unbounded scalar, a float (never captures), or a non-literal `number` yields
 * `never`, so the check SKIPS. The operand's own min / max are IRRELEVANT: only its value is applied to
 * the receiver. The bare `F extends number` (not tuple-wrapped) keeps the true branch NARROWED, so
 * `FactorValue<F>` is provably `extends number` (a resolved value feeds `Multiply` / `Sum` / `Diff`, which
 * require it). Every consumer must guard `[FactorValue<F>] extends [never]` (tuple-wrapped) FIRST, since a
 * naked `never extends` would DISTRIBUTE to `never` and poison the check; the guard keeps `never` (an
 * unbounded / float / non-literal operand) from ever reaching the arithmetic below.
 */
export type FactorValue<F> = F extends number ? F : ValueOf<F>;

/**
 * The product `V * F` against a MAX bound, SHORT-CIRCUITING so a huge product never reaches the ~10k tuple
 * wall: accumulate `BuildTuple<V>` up to F times, but stop the moment the partial product passes `Max`, so
 * the accumulator never grows past ~`Max + V` (< 2000). `'over'` if it passes Max, else `'within'`.
 */
type ProductVsMax<
  V extends number,
  F extends number,
  Max extends number,
  Acc extends unknown[] = [],
  I extends unknown[] = [],
> = Acc extends [
  ...BuildTuple<Max>,
  unknown,
  ...unknown[],
]
  ? 'over'
  : I['length'] extends F
    ? 'within'
    : ProductVsMax<
        V,
        F,
        Max,
        [
          ...Acc,
          ...BuildTuple<V>,
        ],
        [
          ...I,
          unknown,
        ]
      >;

/** The MIN-side mirror: `'atLeast'` once the partial product reaches `Min`, else `'under'` when F is done. */
type ProductVsMin<
  V extends number,
  F extends number,
  Min extends number,
  Acc extends unknown[] = [],
  I extends unknown[] = [],
> = Acc extends [
  ...BuildTuple<Min>,
  ...unknown[],
]
  ? 'atLeast'
  : I['length'] extends F
    ? 'under'
    : ProductVsMin<
        V,
        F,
        Min,
        [
          ...Acc,
          ...BuildTuple<V>,
        ],
        [
          ...I,
          unknown,
        ]
      >;

/**
 * Does `V * F` PROVABLY fall outside `[Min, Max]`? Non-negative-integer-<1000 operands only (as the
 * construction check); a `never` value/bound or any non-checkable operand skips (false).
 */
type ProductOutOfRange<
  V extends number,
  F extends number,
  Min extends number,
  Max extends number,
> = [
  V,
] extends [
  never,
]
  ? false
  : IsNativelyCheckable<V> extends false
    ? false
    : IsNativelyCheckable<F> extends false
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
                : ProductVsMax<V, F, Max>
          ) extends 'over'
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
                  : ProductVsMin<V, F, Min>
            ) extends 'under'
          ? true
          : false;

/**
 * The multiply guard (FactorValue): intersect onto `multiply`'s factor so a PROVABLE product overflow
 * is a compile error. The factor value is resolved via {@link FactorValue} (a literal, OR a bounded `i`
 * operand's captured value); an unbounded operand, a float, or an unbounded receiver resolves to `never`
 * and skips (`unknown`).
 */
export type MultiplyGuard<
  F,
  V extends number,
  Min extends number,
  Max extends number,
> = [
  FactorValue<F>,
] extends [
  never,
]
  ? unknown
  : ProductOutOfRange<V, FactorValue<F>, Min, Max> extends true
    ? {
        readonly __overflow: [
          'css-calipers: product out of range',
          V,
          '*',
          FactorValue<F>,
          'bounds',
          Min,
          Max,
        ];
      }
    : unknown;

/**
 * The NEW value `multiply` carries so a chain keeps checking. `V * FactorValue<F>` when the product is in
 * range (so <= Max < 1000, safe to compute), else `number` (out of range, an unbounded / float / non-literal
 * operand, or a non-checkable receiver).
 */
export type MultiplyValue<
  F,
  V extends number,
  Min extends number,
  Max extends number,
> = [
  V,
] extends [
  never,
]
  ? number
  : [
        FactorValue<F>,
      ] extends [
        never,
      ]
    ? number
    : // Resolve the operand into a plain `K extends number` (via `infer ... extends number`), so
      // `Multiply<V, K>` gets a genuinely constrained number literal; the tuple never-guard above keeps
      // `never` (a skipped operand) out of this inference, where a naked `never` would poison it.
      FactorValue<F> extends infer K extends number
      ? IsNativelyCheckable<V> extends false
        ? number
        : IsNativelyCheckable<K> extends false
          ? number
          : ProductOutOfRange<V, K, Min, Max> extends true
            ? number
            : Multiply<V, K>
      : number;

// --- overflow through add / subtract / divide -------------------------------------------------
// add RAISES the value (a checkable operand is >= 0), so like multiply it can only breach the MAX;
// subtract / divide LOWER it (divide shrinks toward zero), so they can only breach the MIN. A sum /
// difference of two < 1000 operands is at most ~2000, well under the ~10k wall, so it is built by
// CONCATENATING two in-range tuples (never recursed past the depth limit). Divide needs no new
// arithmetic: `V / K < Min` iff `Min * K > V`, so it REUSES the multiply short-circuit `ProductVsMax`.

/** `V + K` as a tuple, by concatenation. Both operands are checkable (< 1000), so the result is at most
 *  ~2000 long and is built from two independent in-range tuples, never a single recursion past ~1000. */
type SumTuple<V extends number, K extends number> = [
  ...BuildTuple<V>,
  ...BuildTuple<K>,
];

/** `V + K` as a number literal (e.g. `Sum<5, 8>` is `13`); the value `add` carries when it stays in range. */
type Sum<V extends number, K extends number> = SumTuple<
  V,
  K
>['length'];

/**
 * `V - K` as a number literal when `V >= K` (e.g. `Diff<5, 3>` is `2`), else `number`. A negative
 * difference has no tuple length; the value computation only reaches here on the in-range (>= Min >= 0)
 * branch, where `V >= K` holds, so the fallback just keeps a skipped case safe.
 */
type Diff<V extends number, K extends number> =
  BuildTuple<V> extends [
    ...BuildTuple<K>,
    ...infer Rest,
  ]
    ? Rest['length']
    : number;

/** Does `V + K` exceed `Max`? `'over'` once the sum passes Max, else `'within'`. (add breaches MAX only.) */
type SumVsMax<
  V extends number,
  K extends number,
  Max extends number,
> =
  SumTuple<V, K> extends [
    ...BuildTuple<Max>,
    unknown,
    ...unknown[],
  ]
    ? 'over'
    : 'within';

/**
 * Does `V - K` fall below `Min`? Equivalent to `Min + K > V`, so no tuple SUBTRACTION is needed:
 * `'under'` once `Min + K` passes V, else `'atLeast'`. (subtract breaches MIN only.)
 */
type DiffVsMin<
  V extends number,
  K extends number,
  Min extends number,
> =
  SumTuple<Min, K> extends [
    ...BuildTuple<V>,
    unknown,
    ...unknown[],
  ]
    ? 'under'
    : 'atLeast';

/** Does `V + K` PROVABLY exceed `Max`? Non-negative-integer-<1000 operands only, else skip (false). */
type SumOutOfRange<
  V extends number,
  K extends number,
  Max extends number,
> = [
  V,
] extends [
  never,
]
  ? false
  : IsNativelyCheckable<V> extends false
    ? false
    : IsNativelyCheckable<K> extends false
      ? false
      : [
            Max,
          ] extends [
            never,
          ]
        ? false
        : IsNativelyCheckable<Max> extends false
          ? false
          : SumVsMax<V, K, Max> extends 'over'
            ? true
            : false;

/** Does `V - K` PROVABLY fall below `Min`? Non-negative-integer-<1000 operands only, else skip (false). */
type DiffOutOfRange<
  V extends number,
  K extends number,
  Min extends number,
> = [
  V,
] extends [
  never,
]
  ? false
  : IsNativelyCheckable<V> extends false
    ? false
    : IsNativelyCheckable<K> extends false
      ? false
      : [
            Min,
          ] extends [
            never,
          ]
        ? false
        : IsNativelyCheckable<Min> extends false
          ? false
          : DiffVsMin<V, K, Min> extends 'under'
            ? true
            : false;

/**
 * Does `V / K` PROVABLY fall below `Min`? `V / K < Min` iff `Min * K > V`, so this reuses the
 * short-circuiting `ProductVsMax<Min, K, V>` (Min * K, stopped the moment it passes V). Non-negative-
 * integer-<1000 operands only. `K = 0` yields `Min * 0 = 0`, never over, so divide-by-zero skips here
 * (it is the runtime throw); a fractional / non-integer quotient in range is likewise the runtime's job.
 */
type QuotientOutOfRange<
  V extends number,
  K extends number,
  Min extends number,
> = [
  V,
] extends [
  never,
]
  ? false
  : IsNativelyCheckable<V> extends false
    ? false
    : IsNativelyCheckable<K> extends false
      ? false
      : [
            Min,
          ] extends [
            never,
          ]
        ? false
        : IsNativelyCheckable<Min> extends false
          ? false
          : ProductVsMax<Min, K, V> extends 'over'
            ? true
            : false;

/** The add guard (FactorValue): a PROVABLE sum overflow (over the MAX) is a compile error; the operand
 *  value is resolved via {@link FactorValue}, so an unbounded / float / non-literal operand or an unbounded
 *  receiver skips (`unknown`). Mirrors {@link MultiplyGuard}. */
export type AddGuard<K, V extends number, Max extends number> = [
  FactorValue<K>,
] extends [
  never,
]
  ? unknown
  : SumOutOfRange<V, FactorValue<K>, Max> extends true
    ? {
        readonly __overflow: [
          'css-calipers: sum out of range',
          V,
          '+',
          FactorValue<K>,
          'max',
          Max,
        ];
      }
    : unknown;

/** The subtract guard (FactorValue): a PROVABLE difference underflow (below the MIN) is a compile
 *  error; the operand value is resolved via {@link FactorValue}. */
export type SubtractGuard<K, V extends number, Min extends number> = [
  FactorValue<K>,
] extends [
  never,
]
  ? unknown
  : DiffOutOfRange<V, FactorValue<K>, Min> extends true
    ? {
        readonly __overflow: [
          'css-calipers: difference out of range',
          V,
          '-',
          FactorValue<K>,
          'min',
          Min,
        ];
      }
    : unknown;

/** The divide guard (FactorValue): a PROVABLE quotient underflow (below the MIN) is a compile error;
 *  the operand value is resolved via {@link FactorValue}. Divide only shrinks toward zero, so it never
 *  breaches the max; a non-integer quotient is the runtime's throw. */
export type DivideGuard<K, V extends number, Min extends number> = [
  FactorValue<K>,
] extends [
  never,
]
  ? unknown
  : QuotientOutOfRange<V, FactorValue<K>, Min> extends true
    ? {
        readonly __overflow: [
          'css-calipers: quotient out of range',
          V,
          '/',
          FactorValue<K>,
          'min',
          Min,
        ];
      }
    : unknown;

/** The value `add` carries so a chain keeps checking: `V + FactorValue<F>` when in range (so <= Max < 1000,
 *  safe to represent), else `number`. `[V] extends [never]` is checked FIRST so an unbounded receiver
 *  collapses to `number` (a transparent `ValueBrand`); the operand is resolved to a plain `K extends number`
 *  via `infer ... extends number` (guarded from `never` first), exactly as {@link MultiplyValue} does. */
export type AddValue<F, V extends number, Max extends number> = [
  V,
] extends [
  never,
]
  ? number
  : [
        FactorValue<F>,
      ] extends [
        never,
      ]
    ? number
    : FactorValue<F> extends infer K extends number
      ? IsNativelyCheckable<V> extends false
        ? number
        : IsNativelyCheckable<K> extends false
          ? number
          : SumOutOfRange<V, K, Max> extends true
            ? number
            : Sum<V, K>
      : number;

/** The value `subtract` carries: `V - FactorValue<F>` when in range (so >= Min >= 0, safe), else `number`.
 *  The operand resolves to a plain `K extends number` via `infer ... extends number` (never-guarded first). */
export type SubtractValue<F, V extends number, Min extends number> = [
  V,
] extends [
  never,
]
  ? number
  : [
        FactorValue<F>,
      ] extends [
        never,
      ]
    ? number
    : FactorValue<F> extends infer K extends number
      ? IsNativelyCheckable<V> extends false
        ? number
        : IsNativelyCheckable<K> extends false
          ? number
          : DiffOutOfRange<V, K, Min> extends true
            ? number
            : Diff<V, K>
      : number;
