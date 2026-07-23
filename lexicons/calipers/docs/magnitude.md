# Hardening through math + author-time magnitude feedback (SPEC, DRAFT 2026-07-22)

> DRAFT for review. This REDESIGNS how the brand behaves through arithmetic (today it is dropped);
> confirm the direction before code.

## The principle

Calipers restricts `i` / `f` as strictly as it can (`u` is the open escape). A value stays HARDENED at
EVERY math operation: TS ALWAYS keeps carrying the bound brand (`InRange<min,max>`) op after op, so the
editor keeps guiding the author. The MAGNITUDE itself (has this chain overflowed?) is NOT tracked in the
type (type-level arithmetic trips `TS2589`); the runtime enforces it (throw / snap) and the opt-in
compile script surfaces it author-time. Correctness is never at stake: `tsc` plus the runtime always run
the full check.

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

## Harden at each op (the brand is PRESERVED, never re-derived)

Every math op returns the SAME hardened type as its receiver: a bounded `i` / `f` stays `InRange<min,max>`
through `multiply` / `add` / etc. The type keeps carrying the bound, so the editor still guides you (a
function wanting `InRange<0, 900>` still accepts the result). The runtime (System B) enforces it (throw,
or clamp under snap), so no out-of-range value ever survives with the brand.

TS does NOT compute the resulting MAGNITUDE to re-check it, that is type-level arithmetic and trips
`TS2589` almost at once. So the type asserts the bound but cannot, on its own, flag that a chain has
overflowed. That author-time magnitude check is exactly what the opt-in compile script provides.

## Snap is a RUNTIME reaction; the brand stays `InRange<min,max>`

Because the output is ALWAYS branded with the bound (see "Confirm before code"), snap does NOT change the
STATIC type: a bounded value is `InRange<min,max>` with or without snap. Snap decides the RUNTIME reaction
on a breach:
- `snap: true`: the value absorbs to the limit (stays in range), silently.
- no snap (the default): the breach throws.

Either way the compile-time brand is `InRange<min,max>`. A would-breach value is surfaced AUTHOR-TIME by
the compile script and enforced at runtime, never by a change to the TS type. (This supersedes an earlier
draft where snap changed the output type; that was the type-level-magnitude path we are NOT taking.)

## Per type: `i`, `f`, `u`, `m`

- `i` / `f`: bounded, hardened at each op as above.
- `u`: the open escape, no bound, math results stay plain `u`.
- `m`: a container; it delegates arithmetic to the embedded scalar, so its hardening (and snap) is
  exactly the embedded `i` / `f`'s. `m` over a plain number wraps `u`.

Behaviour and tests cover all four (`i`, `f`, `u`, `m`), across the operations, in-range and overflow,
snap and no-snap.

## The limit: TS2589, and honestly it comes early

Type-level arithmetic compounds per op and goes "excessively deep" (`TS2589`) well before what feels
like a deep chain. Realistically TS holds the hardening for shallow / small-magnitude cases and the
ESLint script is the practical workhorse for the rest, not just an occasional deep-chain fallback. The
IDE's live checker gives out FIRST (it recomputes each keystroke); `tsc` at compile still completes.

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

## Confirm before code

- This flips arithmetic branding from "dropped" to "brand preserved at every op" (the HARD RULE) and
  completes snap's compile-time effect. It is a real redesign; confirm the direction.
- **RESOLVED, (a): TS ALWAYS brands the output.** Per "TS must ALWAYS brand the output": the output type
  always carries the bound brand (`InRange<min,max>`), preserved through every op. TS NEVER drops it and
  NEVER turns an overflow into a type ERROR (an error would leave the output UNbranded, which the HARD
  RULE forbids). TS does NOT track the computed magnitude type-level (that is `TS2589`-prone). All
  magnitude + snap-vs-overflow judgement is RUNTIME (throw / snap) plus AUTHOR-TIME (the compile script).
  `u` / unbounded is the sole exception: nothing to brand.
- **Consequence for snap:** since the output is `InRange<min,max>` with OR without snap, snap changes the
  RUNTIME reaction (clamp vs throw), NOT the static type. This supersedes the earlier "snap changes the
  TS output type" (that was the (b) / type-level-magnitude path we are NOT taking); see the Snap section,
  updated to match.

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

`m(i(...))` / `m(f(...))` / `m(u(...))` just SURFACE the embedded scalar's hardening, so `m` re-runs
blocks 1-2 in full (every restriction x the shared ops). Its EXTRA ops:

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

| op | numerator bounded, denom unbounded | both bounded | both unbounded |
|---|---|---|---|
| `withNumerator(n)`  | new numerator state; denom unchanged | both re-stated | plain |
| `withDenominator(d)`| numerator preserved; new denom state | both re-stated | plain |
| `numeratorScalar()` | numerator's brand | numerator's brand | plain |
| `denominatorScalar()`| plain (denom unbounded) | denom's brand | plain |
| `numeratorOrDenominator(sel)` | the selected scalar's state | selected scalar's state | plain |
| `clone()`           | both preserved | both preserved | plain |

NOTE: `r.clone()` does NOT exist yet; it is the TARGET here. Adding `clone` to `r` (and to `color`) is a
separate follow-up (see the todo), done AFTER this matrix plan.

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
