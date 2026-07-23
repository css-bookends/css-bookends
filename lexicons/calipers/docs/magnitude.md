# Hardening through math + author-time magnitude feedback (SPEC, DRAFT 2026-07-22)

> DRAFT for review. This REDESIGNS how the brand behaves through arithmetic (today it is dropped);
> confirm the direction before code.

## The principle

Calipers restricts `i` / `f` as strictly as it can (`u` is the open escape). A value stays HARDENED at
EVERY math operation: the result re-validates against `min` / `max` and keeps carrying that in the
TYPE, so the editor guides the author op after op. TS does this as far as its type-level arithmetic
holds; past that limit the opt-in ESLint script takes over. Correctness is never at stake: `tsc` at
compile always runs the full check.

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

## Harden at each op

Each math op re-validates the magnitude against the bound and re-brands the result. For a LITERAL chain
TS computes it (capture the value + factor literals, type-level arithmetic, compare to `[Min, Max]`):
the result keeps `InRange` when it stays in range, and a provable overflow is a type ERROR. Where TS's
type-level arithmetic gives out (below), the ESLint script covers the same check.

## Snap moves the compile-time brand

Whether the breached edge SNAPS decides the result TYPE, so `snap` is not just a runtime reaction, it
changes the brand:
- `snap: true`: the result absorbs to the limit, always in range, so `InRange` SURVIVES (hardened,
  "safe"); an overflow is clamped in the type, never an error.
- no snap (the default): `InRange` survives only when provably in range; a provable overflow is a type
  ERROR (or the ESLint diagnostic past the limit); a non-literal result keeps `InRange` optimistically
  and the runtime re-check stands.

The snap runtime absorb already shipped needs its compile-time half: a snapped edge keeps the brand
through arithmetic.

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

## Robust test suite (mandatory, full matrix, no skips)

The spine of the suite is the HARD RULE: after ANY op on a bounded value the brand is STILL present
(`expectType<InRangeInteger<...>>` / `InRangeFloat<...>`), never a plain `IInteger` / `IFloat`. Cross
every axis:

- TYPE: `i`, `f`, `u` (no brand to preserve), `m` (surfaces the embedded scalar's brand).
- OP: construction, `multiply`, `add`, `subtract`, `divide`, `withValue`, `clamp`, `round` / `floor` /
  `ceil`, AND multi-op chains.
- OUTCOME: in-range (brand preserved), overflow + `snap` (clamped, brand preserved), overflow + no snap
  (runtime throw; author-time script diagnostic), per edge (min / max independent).
- ARG kind: literal and non-literal.

Both layers: tsd `expectType` for the compile-time brand, runtime tests for the value / throw / clamp.

## Confirm before code

- This flips arithmetic branding from "dropped" to "brand preserved at every op" (the HARD RULE) and
  completes snap's compile-time effect. It is a real redesign; confirm the direction.
- **The one feasibility fork.** Preserving the brand (`this` through arithmetic) is contained and I'll
  do it. But making the TYPE reflect the COMPUTED magnitude, so `snap` clamps the type vs a no-snap
  overflow becoming a type ERROR, needs type-level ARITHMETIC (track the running value in the type).
  That is a large, fragile build and trips `TS2589` at modest magnitudes / shallow chains. Two ways:
  - **(a)** TS carries the BOUND (brand preserved, never dropped); ALL magnitude + snap-vs-overflow
    judgement is author-time in the script. Simpler, robust, ships soon.
  - **(b)** TS also tracks the computed magnitude type-level (snap changes the static type; overflow is
    a type error) up to `TS2589`, then the script. Matches the "snap changes the type output" ideal,
    but is a big, limited, fragile investment.
  Which one?
