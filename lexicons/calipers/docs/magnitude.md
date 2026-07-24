# Hardening through math + author-time magnitude feedback (SPEC)

> This REDESIGNS how the brand behaves through arithmetic (today it is dropped). The direction is
> CONFIRMED; the load-bearing decisions below are the authoritative record. Re-read them before any edit
> to this doc or the code, and reconcile everything else to them.

## LOAD-BEARING DECISIONS (read before touching anything)

**D1 — Never drop a constraint; only mint a new one.** A bound is set once. Math carries the brand
through every op and never respecifies it. To change a bound, mint a fresh value (factory / refinement).

**D2 — Magnitude ladder (author-time -> runtime), in order:**
1. `tsc` type-level: the value + factor are captured as LITERALS, type-level arithmetic runs, and a
   PROVABLE overflow is a COMPILE ERROR.
2. TWO hard limits (see D6): the ~10,000 TUPLE-LENGTH wall caps a single product's MAGNITUDE (a bigger
   product is "too large to represent"); `TS2589` ("excessively deep") caps a long op CHAIN's recursion
   depth. Integer literals only.
3. the LIVE language server gives out earlier (per-keystroke perf); the opt-in eslint script (a full
   single-file compile on save) recovers that live gap.
4. runtime throw / snap = the final backstop. Correctness NEVER rides on the script.

**D3 — Always brand the output; a provable overflow is the ONE exception.** Every op's output is branded
(`InRange<a,b>` etc.). A provable overflow (all integer literals, within both limits) is a compile error; a
non-provable result (non-literal, a float, or past the tuple wall / `TS2589`) stays branded and the runtime enforces it. That is
the only place "always brand" and "catch the overflow" meet.

**D4 — Scalars CAPTURE the literal value + factor and do the arithmetic** — not brand-only. (The first
code pass shipped brand-only; the literal-magnitude layer is still to add, and it is the fragile
type-arithmetic piece, bounded by the tuple wall + `TS2589`.)

**D5 — `m` uses `IMeasurement<Unit, Brand>` (a parametric brand), NOT a `this`-conditional** (which
breaks unit covariance). The math ops carry `Brand` uniformly and never inspect it; a CUSTOM brand rides
as an intersection the ops shed; `absolute` carries `Brand` like the rest (pending final confirm).

**D6 — the MAGNITUDE ceiling is TS's ~10,000 TUPLE-LENGTH wall (measured 2026-07-24 on TS 5.9.3), not `TS2589`
(that is the SEPARATE chain-depth limit, D2), and it is INTEGER-ONLY.** Type-level arithmetic is tuple-based: a product over ~10,000 is "too large to
represent", a FLOAT (fraction) or a NEGATIVE has no tuple length, and only NON-NEGATIVE INTEGER LITERALS
are computable. So `tsc`'s magnitude coverage is a shallow non-negative-integer-literal sliver by design; the eslint script (it runs the
code) is the workhorse for floats / non-literals / deeper-or-bigger chains. Expected, not a gap. (TS 7
native would speed the LIVE server, giving more squiggles before the script, but would NOT raise this
ceiling.)

## The principle

Calipers restricts `i` / `f` as strictly as it can (`u` is the open escape). A value stays HARDENED at
EVERY math operation: TS ALWAYS carries the bound brand (`InRange<min,max>`), AND it computes the
MAGNITUDE where it can (D2 / D3), capturing the value + factor as literals so a PROVABLE overflow is a
compile error. Past `TS2589` (and past what the live language server recomputes per keystroke) the
opt-in compile script recovers the diagnostic, and the runtime is the final backstop. Correctness is
never at stake: `tsc` plus the runtime always run the full check.

**HARD RULE (absolute):** NEVER drop the hardening when it is present. EVERY math operation on a
bounded value preserves the brand, no exceptions. A bounded `i` / `f` (or an `m` embedding one) stays
`InRange` through `multiply` / `add` / `subtract` / `divide` / `clamp` / `round` / `floor` / `ceil`,
and any chain of them; only `u` (no bound) has nothing to preserve. This is invariant, not a heuristic,
and the suite asserts it after every operation.

## The bug to remedy (ASAP)

Today the brand is DROPPED by arithmetic (`multiply()` returns a plain `IInteger`), so the type stops
guiding after the FIRST op. That is the gap: we must stay hardened at every op, not fall back to a
plain value. (The runtime System B still re-checks and throws, so it was never a correctness hole,
only lost editor guidance.)

## Harden at each op (brand carried + magnitude computed where TS can)

Every math op returns the SAME bound brand as its receiver: a bounded `i` / `f` stays `InRange<min,max>`
through `multiply` / `add` / etc., so the editor keeps guiding you (a function wanting `InRange<0, 900>`
still accepts the result), and the runtime enforces it (throw, or clamp under snap) so no out-of-range
value ever survives with the brand.

For a LITERAL chain TS ALSO computes the magnitude (capture the value + factor as literals, type-level
arithmetic, compare to `[Min, Max]`): the result keeps `InRange` when provably in range, and a PROVABLE
overflow is a compile ERROR (D3). Where TS's type-level arithmetic gives out (`TS2589`, D2) the opt-in
script covers the same check; either way the runtime is the backstop.

## Snap decides the compile-time outcome for a provable overflow

The brand is always `InRange<min,max>`. What snap changes is whether a PROVABLE overflow on the breached
edge is a compile error (D3):
- `snap: true` on that edge: a would-overflow ABSORBS to the limit, so it stays in range, `InRange`
  survives, NO compile error (and no runtime throw, it clamps).
- no snap (the default): a PROVABLE overflow is a compile error (or the script diagnostic past `TS2589`),
  and the runtime throws; a NON-provable result keeps `InRange` and the runtime re-check stands.

So snap is not only a runtime reaction: a snapped edge never errors on overflow (it absorbs), a
non-snapped edge does. The runtime absorb already shipped; this is its compile-time half.

## Per type: `i`, `f`, `u`, `m`

- `i` / `f`: bounded, hardened at each op as above.
- `u`: the open escape, no bound, math results stay plain `u`.
- `m`: a container; it delegates arithmetic to the embedded scalar, so its hardening (and snap) is
  exactly the embedded `i` / `f`'s. `m` over a plain number wraps `u`.

Behaviour and tests cover all four (`i`, `f`, `u`, `m`), across the operations, in-range and overflow,
snap and no-snap.

## The limits: the tuple wall (magnitude) and TS2589 (chain depth), and both come early

Two limits bound the type-level check. A single product over ~10,000 hits the TUPLE-LENGTH wall ("too
large to represent"); a long op chain compounds per op and goes "excessively deep" (`TS2589`). Both
arrive well before what feels like a deep or big chain, so realistically TS holds the hardening for
shallow / small-magnitude cases and the ESLint script is the practical workhorse for the rest, not just
an occasional deep-chain fallback. The IDE's live checker gives out FIRST (it recomputes each keystroke);
`tsc` at compile still completes.

## The escape hatch: an opt-in compile script (IDE support only)

100% opt-in. We ship ONE agnostic script: compile a SINGLE file (the one being edited) with whatever
compiler the author points it at, and surface the magnitude diagnostic fast enough to run on keystroke
OR save (the author's choice). We do NOT ship an eslint config, a files-to-scan list, or a specific
compiler. Our example uses `vanilla-extract`.

## Deliverables

1. Harden-through-math in `i` / `f` / `m` (the brand survives / errors / clamps per above), including
   snap's compile-time half.
2. The agnostic single-file compile-and-report script.
3. An example: a chain that outruns TS's live check, the error appears, and is remedied by the script,
   via `vanilla-extract`.

## Implementation plan (the code)

Per scalar there are TWO layers: the BRAND is carried, and the literal MAGNITUDE is computed (D2-D4).

- **`i` / `f` brand (SHIPPED):** `add` / `subtract` / `multiply` / `divide` / `withValue` return
  `PreserveIntegerBrand<this>` / `PreserveFloatBrand<this>`, a conditional that keeps the receiver's
  bound-brand (`InRange` / `NonNegative` / `NonPositive`) and drops a CUSTOM one (correct: no bound keeps
  it honest). `clamp` MINTS `InRange<x,y>`; `clone` returns `this`; `f.asScalar` is the bound-preserving
  `Integer | Float` union.
- **`i` / `f` magnitude (D4, STILL TO ADD):** capture the value + factor as LITERALS and compute the
  result type-level; a PROVABLE overflow of the bound is a compile error (up to the tuple wall + `TS2589`);
  a snapped edge absorbs instead of erroring. This is the fragile type-arithmetic piece; the eslint script
  covers past it.
- **Refinements-as-bounds (SHIPPED):** the built-in bound refinements (`nonNegative` -> min 0,
  `nonPositive` -> max 0, `inRange(a,b)` -> `[a,b]`) set a RUNTIME bound + the brand, SET-ONCE (re-bounding
  an already-bounded value throws). Custom refinements set no bound and add their brand as an
  intersection (dropped by math). `is` narrows but cannot re-mint, so it is the one non-backed path.
- **`m` (D5, parametric brand):** `IMeasurement<Unit, Brand = unknown>`, NOT a `this`-conditional (that
  breaks unit covariance). `m<S extends Scalar>(value: S, ...)` DERIVES `Brand` from the embedded scalar;
  the ops carry `Brand` parametrically (`add(delta): IMeasurement<Unit, Brand>`) and never inspect it; a
  custom brand rides as an intersection the ops shed; `absolute` carries `Brand` (pending confirm); the
  branded aliases are one-liners over `IMeasurement<Unit, Brand>`.
- **`r` (generic):** `IRatio<N, D>`; `r<N, D>(num, den)`; `numeratorScalar(): N`,
  `denominatorScalar(): D`; `withNumerator<NewN>` / `withDenominator<NewD>` restate one side, preserve
  the other.

Order: (A) `i`/`f` brand [SHIPPED] + refinements-as-bounds [SHIPPED]; (A2) `i`/`f` MAGNITUDE layer (D4);
(B) `m` parametric-brand derive (D5); (C) `r` generic; (D) the compile script + example. Each phase
updates docs, flips/adds its tests, lands green, then a red-hat pass.

## Test matrix (FULL, no skips, finalized 2026-07-23)

The spine is the HARD RULE: after ANY value-producing op the brand is STILL present, never dropped.

### Types x their value-producing ops

- `i` / `f`: `add`, `subtract`, `multiply`, `divide`, `withValue`, `clamp`, `clone`, `asScalar`.
- `u`: the same ops, always unbounded (no brand to preserve).
- `m`: `add`, `subtract`, `multiply`, `divide`, `double`, `half`, `round`, `floor`, `ceil`, `clamp`,
  `withValue`, `clone`; hardening delegates to the embedded `i` / `f` / `u`.
- `r`: `withNumerator`, `withDenominator`, `clone`, plus the `numeratorScalar` / `denominatorScalar`
  accessors. `r` has no bound of its own; the hardening lives in the embedded numerator / denominator
  scalars, so the rule is that those keep their state through `r`'s ops.

### Restrictions (the hardening state of the receiver / embedded scalar)

- R0 unbounded (`u`; `i` / `f` / `m` / an `r` scalar with no bound): nothing to preserve.
- R1 bounded `[min, max]`; R2 min-only; R3 max-only.
- R4 `nonNegative` (stored as min 0); R5 `nonPositive` (stored as max 0); R6 `inRange(a, b)` (stored as
  `[a, b]`). The three refinement brands are stored as BOUNDS and enforced through math like any bound.
- Each of R1..R6 x snap {none, blanket, per-edge on min / max}.

### Assertions per cell

- **A, HARD RULE (compile-time, tsd `expectType`):** after the op the brand is PRESERVED, never a plain
  `IInteger` / `IFloat`. `clamp(x, y)` mints a NEW `InRange<x, y>`; `asScalar` preserves the brand;
  `clone` preserves brand AND value. Asserted for literal AND non-literal args.
- **B, runtime bound (System B):** `.constraints()` unchanged (except `clamp(x, y)` -> `{x, y}`).
- **C, runtime behavior:** in-range -> correct value; overflow + snap(edge) -> clamp to that limit;
  overflow + no snap -> throws. Per edge, min / max independent.

### Explicit rows (no "unreachable" skips)

- `divide` on `i`: a non-integer result throws (integer invariant), independent of the bound.
- `divide` by zero throws (all types).
- construction `i(v, {min, max})` and refinement `.ensure(...)` are op-0.
- multi-op CHAINS: the brand holds at EVERY step, not only the first.
- `m` over a plain number wraps `u` (unbounded, no brand).
- `r` with a bounded numerator and an unbounded denominator, and the reverse: each scalar keeps its own
  state.

Every cell is checked at BOTH layers: tsd `expectType` for the brand (A), and a runtime test for the
value / throw / clamp / `.constraints()` (B, C).

## Resolved (the decisions are D1-D6 at the top)

- This flips arithmetic branding from "dropped" to "brand carried at every op" (D1), AND adds the
  literal-magnitude layer (D2-D4) so a provable overflow is a compile error.
- **RETRACTED:** an earlier draft of this section said "TS does NOT track the computed magnitude" and
  "overflow is never a type error" (the "(a)" reading). That was WRONG. Correct = D2/D3: TS captures the
  value + factor as literals, computes the magnitude, and a PROVABLE overflow IS a compile error, up to
  `TS2589`; past that the eslint script recovers the live gap; the runtime is the backstop. The brand is
  always carried; the provable overflow is the single exception.
- **Snap's compile-time effect (D3):** a snapped edge absorbs a would-overflow (no error), a non-snapped
  edge makes a provable overflow an error. See the Snap section.

---

# THE ENUMERATED MATRIX

Conventions. Column **A** is what `expectType` asserts after the op (the HARD RULE). Column **B** is
`.constraints()`. Column **C** is runtime: `ok` = value passes, `throw`, `snap:max` / `snap:min` =
clamped to that limit.

## Brands in play (what A asserts)

- `InRange<a,b>`: bounded on BOTH edges (factory / per-value `{min,max}` / the `inRange(a,b)` refinement).
- `NonNegative`: min 0 (the `nonNegative` refinement).
- `NonPositive`: max 0 (the `nonPositive` refinement).
- no brand: `u`, an unbounded `i` / `f`, or a general single-edge bound `{min:k}` / `{max:k}` (carries
  the System-B bound, no compile brand).

## Axes crossed in EVERY block below

- RESTRICTION: unbounded, `[min,max]`, min-only, max-only, `nonNegative`, `nonPositive`, `inRange(a,b)`,
  each x snap {none, blanket, per-edge min, per-edge max}.
- MODIFIER variant of each bounded restriction (value built with `modifier: floor|ceil|round|fn`): the
  modifier runs at intake AND on every rebuilt result, hardening must still hold.
- SCENARIO: in-range, `== a boundary` (inclusive), overflow max, underflow min.
- ARG: literal, non-literal, a HARDENED scalar arg (`i.add(f(...))`).

## 1. `i` / `f` scalar ops x brand (A)

| op | `InRange<a,b>` | `NonNegative` | `NonPositive` | unbounded |
|---|---|---|---|---|
| `add(k)`      | `InRange<a,b>` | `NonNegative` | `NonPositive` | plain |
| `subtract(k)` | `InRange<a,b>` | `NonNegative` | `NonPositive` | plain |
| `multiply(k)` | `InRange<a,b>` | `NonNegative` | `NonPositive` | plain |
| `divide(k)`   | `InRange<a,b>` | `NonNegative` | `NonPositive` | plain |
| `withValue(v)`| `InRange<a,b>` | `NonNegative` | `NonPositive` | plain |
| `clone()`     | `InRange<a,b>` | `NonNegative` | `NonPositive` | plain |
| `asScalar()`  | `InRange<a,b>` | `NonNegative` | `NonPositive` | plain |
| `clamp(x,y)`  | `InRange<x,y>` | `InRange<x,y>`| `InRange<x,y>`| `InRange<x,y>` |

Invariant: every op EXCEPT `clamp` keeps the receiver's brand; `clamp(x,y)` mints a fresh `InRange<x,y>`.

## 2. `u` (open escape) x brand (A)

Every op returns plain `u`, including `clamp` (`u.clamp(x,y)` is `IUnspecified`, NOT `InRange`). This
block proves `u` never carries a brand.

## 3. `m` x brand (A) — runs the FULL scalar matrix, delegated

**DECIDED 2026-07-23: `m` DERIVES its brand from the embedded scalar (option "derive the brand").** So
`m(i(5, {min:0,max:10}), 'px')` is `InRangeMeasurement<'px', 0, 10>`, `m(nonNegative..., 'px')` is
`NonNegativeMeasurement<'px'>`, and `m(plainNumber)` is unbranded. `m()` becomes GENERIC over the
embedded scalar's brand (the bigger build), so the editor guides on the bound THROUGH `m`, not just at
runtime. `m(i(...))` / `m(f(...))` / `m(u(...))` SURFACE the embedded scalar's hardening, so `m` re-runs
blocks 1-2 in full (every restriction x the shared ops). Its EXTRA ops:

**MECHANISM DECIDED 2026-07-24: `IMeasurement<Unit, Brand = unknown>` (a parametric brand), NOT the
scalar's `Preserve<this>` conditional.** The `this`-conditional breaks unit COVARIANCE on `m` (TS can no
longer prove `IMeasurement<'px'>` <= `IMeasurement<string>`, cascading through `context` / unit helpers /
`bundle`), because `this` drags `Unit` into an invariant position. A plain `Brand` parameter does not.
Consequences (all verified with scratch tsd):
- The branded aliases collapse to one-liners: `InRangeMeasurement<U,Min,Max> = IMeasurement<U,
  InRangeBrand<Min,Max>>`, `NonNegativeMeasurement<U> = IMeasurement<U, GreaterOrEqualToZeroBrand>`, etc.
- The math ops are declared ONCE and carry `Brand` PARAMETRICALLY: `add(delta: number |
  IMeasurement<Unit>): IMeasurement<Unit, Brand>`. They do NOT inspect the brand ("none of the math
  functions mind a new brand"), and the runtime (delegated to the embedded scalar) enforces the bound
  (throw / snap) so the carried brand is never a lie.
- A CUSTOM refinement brand rides as an INTERSECTION (`IMeasurement<Unit, Brand> & EvenBrand`) that the
  parametric ops shed, so custom brands still DROP through math with no special-casing; a BOUND
  refinement sets the `Brand` param (runtime-backed) and is carried. The distinction lives INSIDE the
  refinement, never in the ops.
- `absolute` carries `Brand` like every other op (does NOT mint `NonNegative`); use `nonNegative.ensure`
  for the `>= 0` proof. *(Pending final confirm; default = carry.)*

| op | m over bounded `i` / `f` | m over plain number (wraps `u`) |
|---|---|---|
| `add` `subtract` `multiply` `divide` | embedded brand preserved | plain |
| `double` `half` | embedded brand preserved | plain |
| `round` `floor` `ceil` | embedded brand preserved | plain |
| `negation` | brand preserved; negated value re-checked vs the SAME bound (throw / snap if it leaves) | plain |
| `absolute` | MINTS `NonNegativeMeasurement` (`Math.abs` >= 0), like `clamp` | `NonNegativeMeasurement` |
| `clamp(x,y)` | fresh `InRange<x,y>` | `InRange<x,y>` |
| `asScalar` | the embedded scalar, brand intact | plain `u` |
| `clone` | embedded brand + value preserved | plain |

(No `withValue` on `m`. `m`'s own refinement brands `NonNegativeMeasurement` / `InRangeMeasurement`
preserve identically.)

## 4. `r` x brand (A) — hardening in the embedded scalars

**DECIDED 2026-07-23: `IRatio` becomes GENERIC `IRatio<N, D>` over the numerator / denominator scalar
brands (option "include r now").** So `r` SURFACES the embedded brands: `numeratorScalar()` returns `N`,
`denominatorScalar()` returns `D`, and `withNumerator` / `withDenominator` restate one side while
PRESERVING the other. `r` itself has no bound and no math ops; the accessors just expose the embedded
state. `IRatio`'s ONLY methods are the four below (`numeratorOrDenominator` is a PARAMETER name in
standalone ratio helpers, NOT a method).

| op | numerator bounded, denom unbounded | both bounded | both unbounded |
|---|---|---|---|
| `withNumerator(n)`  | new numerator brand; denom preserved | both restated | plain / `u` |
| `withDenominator(d)`| numerator preserved; new denom brand | both restated | plain / `u` |
| `numeratorScalar()` | numerator's brand | numerator's brand | `u` (bare number) |
| `denominatorScalar()`| `u` (denom unbounded plain) or the denom's brand | denom's brand | `u` |

NOTE: `r.clone()` does NOT exist yet. With `IRatio` now generic, adding `clone` (returns `this`, so both
brands preserve) is trivial; it can ride along or stay in the `r.clone` + `color` follow-up.

## 5. Runtime behavior (C), scenario x snap (every bounded op, both edges)

| scenario | snap none | snap blanket | per-edge, that edge snaps | per-edge, that edge does NOT |
|---|---|---|---|---|
| result in range | `ok` | `ok` | `ok` | `ok` |
| result == boundary (min or max, inclusive) | `ok` | `ok` | `ok` | `ok` |
| overflow max | `throw` | `snap:max` | `snap:max` | `throw` |
| underflow min | `throw` | `snap:min` | `snap:min` | `throw` |

## 6. Special-case rows (explicit, no skips)

| case | expected |
|---|---|
| `i.divide(k)` -> non-integer | `throw` (integer invariant), any bound |
| `any.divide(0)` | `throw` |
| `m.absolute()` | `NonNegativeMeasurement` (brand MINTED, not preserved) |
| `m.negation()` of an asymmetric bound | value re-checked vs the SAME bound -> `throw` / `snap` if it leaves |
| chain (op, op, op, ...) | brand preserved at EVERY step, `.constraints()` intact throughout |
| `modifier` + bound | the modifier applies at intake AND on results, THEN the bound hardens; brand still holds |
| hardened arg (`i.add(f(...))`) | receiver's brand preserved regardless of the arg's own brand |
| refinement on an already-bounded value (`nonNegative.ensure(i(5,{max:10}))`) | constraints COMBINE, tightest wins (`[0,10]`); brand reflects the combined bound (design point to confirm) |
| construction op-0, initial value out of range | `throw`, or `snap` to the limit when that edge snaps |
| general `{min:k}` / `{max:k}` (no brand) | System-B bound preserved (`.constraints()`), A = no brand |

Coverage rule: every (type x restriction x modifier? x op x scenario x snap x arg-kind) cell above is a
test at BOTH layers, tsd `expectType` for A and a runtime assertion for B / C. No cell skipped as
"unreachable".

---

# TEST FILES TO WRITE (from the matrix)

## Type layer — tsd (`expectType`, asserts A: brand preserved, the HARD RULE)

- `tests/types/hardening-i.test-d.ts` — `i` receivers in `InRange<a,b>` / `NonNegative` / `NonPositive` /
  unbounded; assert every op keeps the brand; `clamp(x,y)` mints `InRange<x,y>`; `asScalar` / `clone`
  keep it; literal AND non-literal args.
- `tests/types/hardening-f.test-d.ts` — `f`, same shape.
- `tests/types/hardening-m.test-d.ts` — `m(i)` / `m(f)` / `m(u)` surface the embedded brand through the
  shared ops + `double` / `half` / `round` / `floor` / `ceil` / `negation`; `absolute` ->
  `NonNegativeMeasurement`; `asScalar` -> the scalar's brand; `m(plain)` -> plain.
- `tests/types/hardening-r.test-d.ts` — numerator / denominator brands kept through `withNumerator` /
  `withDenominator` / the scalar accessors / `clone` (target).

## Runtime layer — vitest (`.src.test.ts`, asserts B: `.constraints()` + C: value / throw / clamp)

- `tests/runtime/hardening/through-math-i.src.test.ts` — `i`: restriction x op x scenario {in-range,
  boundary, overflow} x snap {none, blanket, per-edge}; assert value {ok / throw / snap:limit} and
  `.constraints()` intact. Plus `divide` -> non-integer throws, `divide(0)` throws.
- `tests/runtime/hardening/through-math-f.src.test.ts` — `f`, same (no integer invariant).
- `tests/runtime/hardening/through-math-u.src.test.ts` — `u`: every op stays plain / unbounded, never
  throws on magnitude.
- `tests/runtime/hardening/through-math-m.src.test.ts` — `m`: delegates to the embedded scalar; the
  m-only ops; `absolute` -> `>= 0`; `negation` re-checks the same bound; `m(plain)`.
- `tests/runtime/hardening/through-math-r.src.test.ts` — `r`: embedded scalars keep state through `r`'s
  ops.
- `tests/runtime/hardening/through-math-special.src.test.ts` — chains (brand at EVERY step),
  `modifier` + bound, hardened arg (`i.add(f(...))`), refinement-combine
  (`nonNegative.ensure(i(5,{max:10}))` -> `[0,10]`).

## Wiring

The `.test-d.ts` files auto-glob under `test:types`. Add one runtime script (`test:hardening-math`,
the `through-math-*` files) into the `test` chain. All red first: today's `multiply` / `add` / etc.
return a plain `IInteger` / `IFloat`, so every A assertion fails until the code preserves the brand.
