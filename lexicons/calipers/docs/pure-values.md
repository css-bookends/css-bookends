# Pure values: exact rationals for `f` / `m` (DRAFT SPEC — design in progress)

> Sibling of `magnitude.md`. It REVISES **D6** ("floats are unencodable at the type level"): a PURE float is
> two integers, so it IS encodable within the same tuple limits as an integer. Design doc, talk-no-code;
> fill the OPEN FORKS top-to-bottom with the user, then move to /protocol.

## Thesis

A scalar tracks an EXACT rational (`num/den`, both integers) when its value is PURE; otherwise it holds an
opaque double, as today.

- **Payoff 1 — exact arithmetic.** No `0.1 + 0.2` drift, especially compounded through a chain.
- **Payoff 2 — pure-float squiggles.** A pure float's magnitude check is an INTEGER compare (`n/d` vs a
  bound), so pure floats become `tsc`-checkable — the D6 revision, the reason this rides with the magnitude work.
- **Honest about impurity.** `pi` and messy doubles stay doubles; we do not pretend to exactness we lack.

## The purity model

- **PURE** = the exact value is known as a small rational. Two sources:
  - **clean literal** — a short terminating decimal read exactly: `f(0.5)` -> `1/2`, `line-height 1.5` -> `3/2`.
  - **integer math** — built from integer operands: `m(i(10)).divide(i(3))` -> keep `10/3`, never compute `3.333…`.
- **IMPURE** = an arbitrary / irrational double (`f(Math.PI)`, a long messy decimal) -> stays a plain double.
- **CLOSURE** = pure ∘ pure = pure (rationals are closed under `+ − × ÷`). One impure operand taints -> impure.

## `iRatio` — the exact-rational carrier

- `iRatio(i(9), i(10))` = the pure value `9/10`. It feeds a scalar: `f(iRatio(i(9), i(10)))` (renders `0.9`),
  `m(iRatio(i(10), i(3)), 'px')` (renders `10/3` px). It is both the author-facing input and the internal rep.
- Because numerator / denominator are `i()` values, `i`'s value capture (S2) already puts `9` / `10` on the
  TYPE, so the rational is type-level for free -> it SQUIGGLES, with no type-level decimal-string parsing.

## DECIDED (the load-bearing block — re-read before editing)

- **PV1 — the axis is PURITY** (clean-literal OR integer-math), NOT always-vs-lazy. A messy double (`pi`)
  stays a double; that is expected, not a gap. (2026-07-24)
- **PV2 — ship BOTH tiers from the start.** `iRatio` = explicit, TYPE-pure (squiggles, via `i`'s capture);
  auto-detected clean decimal literals = RUNTIME-pure (exact arithmetic + output, but NO type squiggle). A
  clean decimal never gains a type-level rational; only `iRatio` does. (2026-07-24)
- **PV3 — auto-detect is CONSERVATIVE; err on the side of caution.** Promote a double to a rational ONLY when
  it is certain to be the author's exact intent (a short terminating decimal, `0.5` -> `1/2`, `0.1` -> `1/10`).
  A long / ambiguous double is left IMPURE: a rounding artifact (`0.3 / 0.1` -> `2.9999999999999996`) or an
  irrational (`pi`). NEVER fabricate a fraction we are not sure of; a false `3` is worse than an honest double.
  For guaranteed precision the author declares with `iRatio` (see Guidance). (2026-07-24)
- **PV4 — DECIDED: extend `r`, no new construct.** `r` already accepts `i` / `f` operands (`r(i(9), i(10))`
  works today), so the work is (a) teach `f` / `m` to accept an `r`, (b) surface integer-ratio validation
  (PV4-sub), (c) the type-level `i/i` narrowing rides on **Phase C** (`IRatio<N, D>`), with num/den VALUES
  from the `i` operands' `ValueBrand`s (S2). Runtime-purity does NOT need Phase C; the squiggle tier does. So
  pure-values collapses to: Phase C (`r` generic) + `f` / `m` accept an `i/i` `r` + exact arithmetic. (2026-07-24)
- **PV4-sub — DECIDED.** `r` ALWAYS returns a ratio. Two faces:
  - **`.isIntRatio()` — always available** (no option): a BOOLEAN check for integer-ness. `r(1, 2).isIntRatio()`
    -> true; `r(1, Math.PI).isIntRatio()` -> false. The detect path.
  - **`{ asInts: true }` — opt-in ENFORCE + harden**: THROWS a coded `CALIPERS_E_*` on a non-integer operand
    (`r(1, Math.PI, { asInts: true })` throws, NOT a soft false); when integer, HARDENS the brand to a pure
    `IntRatio` (PV6). Runtime throw + type brand travel together (`hardening implies type`). (2026-07-24)
- **PV5 — representation is `number` num/den** (reuse `r`; the 2^53 headroom is ample for shallow CSS
  rationals). `bigint` is a later fallback only if real overflow appears; not now. (2026-07-24)
- **PV6 — branding `r` HARDENS the brand when `i/i` (hardening implies type).** Branding is not passive: it
  inspects the operands, and both-integer HARDENS the brand to a pure integer-ratio (carrying the `i/i` proof
  + num/den for the squiggle). `i()` operands harden automatically (their type is already `IInteger`); the
  `{ integer: true }` option hardens AND runtime-enforces even for bare-number operands, per the project's
  `hardening implies type` rule. This hardened brand is the type-level "pure" marker `f` / `m` read. (2026-07-24)

## SLICING (protocol build order, smallest-first)

Each slice is one commit boundary; forks resolve just-in-time per slice.
- **S-pv1 — `r` integer-ratio validation (runtime).** Add to `r`: `.isIntRatio()` (a BOOLEAN check, both
  operands integer) + an `{ asInts: true }` option that THROWS a coded `CALIPERS_E_*` on a non-integer
  operand. Reuse `r`'s gcd/normalize + scalar embedding. Runtime only (the `IntRatio` type-brand rides on
  Phase C, S-pv6).
- **S-pv2 — `f` / `m` accept an `r`.** `f(r(9, 10))` -> `0.9`; `m(r(i(10), i(3)), 'px')` -> `10/3` px. `f`'s
  input type grows to include `IRatio`. When the `r` is integer (`.isIntRatio()`), store its exact rational
  internally (runtime-pure); `.value()` / `.css()` render from it. Arithmetic still double for now.
- **S-pv3 — exact arithmetic on pure operands.** `+ − × ÷` stay symbolic (rational) through a chain; tainting
  (one impure operand -> impure). The `0.1 + 0.2` / `0.3 ÷ 0.1` payoff.
- **S-pv4 — auto-detect clean decimal literals** (PV3 conservative): `f(0.5)` -> `1/2` at runtime.
- **S-pv5 — output precision** for a non-terminating rational (`10/3` -> rounded `.css()`).
- **S-pv6 — type-level squiggle (needs Phase C).** `r` generic `IRatio<N, D>` -> harden to `IntRatio` when
  `i/i` (PV6) -> a pure `f` squiggles on overflow (the D6 revision; shallow-only within tuple limits).

## OPEN FORKS (work top-to-bottom)

- [ ] **"How clean is clean" — the exact bound (direction SET by PV3: conservative).** Mechanism: read the
  double's shortest round-trip decimal (`.toString()`); promote only when SHORT (`<= K` fractional digits) so
  it is unambiguously intended; a long string (`0.3/0.1` -> `2.9999999999999996`, or `pi`) stays impure.
  Remaining: fix `K`, plus belt-and-suspenders (cap the reduced denominator). Distinct from the tuple limit
  (which gates only the type squiggle).
- [ ] **Constructs that carry purity** — `f` (yes), `m` (embeds a scalar -> inherits), `i` (trivially `n/1`?).
- [ ] **Representation** — `number` num/den (overflow past 2^53) vs `bigint` (exact, heavier); GCD-reduce each
  op (`6/3` -> `2/1`).
- [ ] **Symbolic vs eager** — stay `10/3` through the whole chain, collapse only at `.css()` / `.value()`.
- [ ] **Output** — `.css()` on a non-terminating rational (`10/3`) rounds to N places (reuse `toPlainDecimal`
  + a precision knob); does `.value()` collapse to a double?
- [ ] **Type-level squiggle** — only via `iRatio` (per PV2); confirm the D6 revision + the shallow-only tuple
  limits (`num`, `den`, `min·d`, `max·d` < ~1000).
- [ ] **`iRatio` vs `r`** — a new sibling, or a variant sharing `r`'s num/den + gcd (renders a decimal via `f`,
  where `r` renders `"16/9"`)?
- [ ] **Two-tier interaction** — how a TYPE-pure `iRatio` value and a RUNTIME-pure decimal value compose
  through an op (the result's tier).
- [ ] **API surface** — `f.frac(n, d)` shorthand? `.asFraction()` / `.isPure()` accessors? `iRatio` inputs
  (bare literals `iRatio(9, 10)` vs `i()` values vs both).

## Guidance (to document for authors)

- **For guaranteed precision, declare with `iRatio`.** Auto-detect (PV2 / PV3) is conservative best-effort; a
  value it leaves impure stays a double. `f(iRatio(i(3), i(10)))` is unambiguous AND squiggles.
- **Do the math IN calipers, not in raw JS.** `f(0.3).divide(f(0.1))` can be exact (`3/10 ÷ 1/10 = 3`), but
  `f(0.3 / 0.1)` receives the already-broken double `2.9999999999999996` — a long, ambiguous value we leave
  impure, so `3` is unrecoverable. Precision comes from operating on the clean OPERANDS, never from trying to
  fix a broken result after the fact.

## Non-goals

- Parsing `pi` / arbitrary long doubles into fractions.
- Unbounded-precision arithmetic for every value (only PURE values are exact).

## Relation to `magnitude.md`

- Revises **D6**: floats ARE type-encodable WHEN pure (two integers), within the same tuple limits as integers.
- The ladder is unchanged: pure-float squiggle -> eslint script -> runtime. Impure floats skip to script / runtime.

## TEST MATRIX (edge cases): the coverage to build

Two layers per applicable row (like `magnitude.md`): tsd `expectType` / `expectError` for the TYPE tier, and
a vitest runtime assertion for value / throw / `.css()`. Impure and runtime-pure rows have runtime assertions
only (no type tier). No cell skipped as "unreachable".

### 1. Classification: source -> tier + rational
| input | tier | rational | note |
|---|---|---|---|
| `iRatio(i(9), i(10))` | type-pure | `9/10` | squiggles |
| `f(iRatio(i(1), i(2)))` | type-pure | `1/2` | |
| `f(0.5)` / `f(1.5)` | runtime-pure | `1/2` / `3/2` | auto-detect, NO squiggle |
| `f(0.1)` | runtime-pure | `1/10` | short round-trip |
| `f(0.333)` | runtime-pure | `333/1000` | exactly as typed (NOT `1/3`); at the tuple edge |
| `i(5)` / `f(2)` | pure | `5/1` / `2/1` | integers, trivially |
| `f(-0.5)` | runtime-pure | `-1/2` | negative (no squiggle: negatives skip) |
| `f(0)` | pure | `0/1` | zero |
| `f(Math.PI)` | impure | (double) | honest, no fabrication |
| `f(0.3 / 0.1)` = `f(2.9999999999999996)` | impure | (double) | artifact NOT rounded to `3` (PV3) |
| `f(0.1 + 0.2)` = `f(0.30000000000000004)` | impure | (double) | artifact (PV3) |
| `f(1 / 3)` = `f(0.3333333333333333)` | impure | (double) | long -> double (PV3) |

### 2. Exact arithmetic (the precision payoff), runtime `.value()`
| expression | double today | pure expected |
|---|---|---|
| `f(0.1).add(f(0.2))` | `0.30000000000000004` | `0.3` |
| `f(0.3).divide(f(0.1))` | `2.9999999999999996` | `3` |
| `f(0.1).multiply(i(3))` | `0.30000000000000004` | `0.3` |
| `iRatio(i(1), i(3)).multiply(i(3))` | `0.999…` | `1` |
| `m(i(10)).divide(i(3)).multiply(i(3))` | `9.999…` | `10` (symbolic through the chain) |
| `f(0.5).multiply(f(0.5)).multiply(i(4))` | `1` | `1` (`1/4 * 4`) |

### 3. Tainting: pure composed with impure -> impure
| expression | result |
|---|---|
| `f(0.5).add(f(Math.PI))` | impure double |
| `f(iRatio(i(1), i(2))).multiply(f(Math.PI))` | impure |
| `impure.add(f(0.5)).divide(i(2))` | impure, and stays impure downstream |

### 4. Reduction / normalization / guards
| input | expected |
|---|---|
| `iRatio(i(6), i(3))` | reduce -> `2/1` -> `2` |
| `iRatio(i(2), i(4))` | `1/2` |
| `iRatio(i(1), i(-2))` | `-1/2` (denominator sign normalized) |
| `iRatio(i(5), i(5))` | `1/1` -> `1` |
| `iRatio(i(0), i(5))` | `0/1` -> `0` |
| `iRatio(i(1), i(0))` | THROW (denominator zero) |
| `iRatio` with a non-integer arg | rejected at type + runtime (integers only) |

### 5. Output `.css()` / `.value()`
| value | `.css()` | `.value()` |
|---|---|---|
| `iRatio(i(1), i(4))` | `"0.25"` | `0.25` |
| `iRatio(i(10), i(3))` | `"3.333"` (rounded to the precision knob) | `3.333…` (collapsed double) |
| `f(0.1).add(f(0.2))` | `"0.3"` | `0.3` |
| `m(iRatio(i(1), i(3)), 'px')` | `"0.333px"` (rounded) | (n/a) |

### 6. Type squiggle (tsd): pure floats overflow, only via `iRatio`
| expression | expect |
|---|---|
| `f(iRatio(i(9), i(10)), { max: 1 }).multiply(i(2))` | SQUIGGLE (`18/10 > 1`) |
| `f(iRatio(i(1), i(2)), { max: 1 }).multiply(i(2))` | clean (`2/2 = 1 = max`, inclusive) |
| `f(0.9, { max: 1 }).multiply(i(2))` | NO type squiggle (runtime-pure) -> runtime throws |
| `f(Math.PI, { max: 1 }).multiply(i(2))` | NO squiggle (impure) -> runtime throws |
| `iRatio` num / den or product past the tuple limit (~1000) | NO squiggle -> script / runtime |

### 7. Feature interactions (edge)
| case | expected |
|---|---|
| `clone()` a pure value | preserves the rational + tier |
| `modifier` (`floor` / `round`) on a pure value | result re-classified from the modified value **[OPEN: floor(`10/3`) -> pure `3/1`?]** |
| pure `f` + `{ min, max }` + `snap` | bound / snap operate on the rational (magnitude-layer reuse) |
| `m` embeds a pure `f` | `m` inherits the purity + rational |
| type-pure `iRatio` composed with runtime-pure decimal (`f(iRatio(i(1), i(2))).add(f(0.25))`) | exact `3/4` (runtime-pure); NO type squiggle (the decimal side has no type-level rational) |
| num / den overflow in the `number` rep | **[OPEN: representation fork -> `bigint` or cap]** |
