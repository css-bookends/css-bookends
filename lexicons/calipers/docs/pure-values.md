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
- **PV7 — purity is INTERNAL storage; NO public accessor.** `#rational` is read only by the exact-arithmetic
  ops (S-pv3); there is NO public `.asFraction()` / `.isPure()`, and `m` (a pure container) never surfaces it.
  A scalar / measurement does not advertise its purity on its API. So the S-pv2 storage is verified through
  S-pv3's exact RESULTS, not a query. (2026-07-26)

## SLICING (protocol build order, smallest-first)

Each slice is one commit boundary; forks resolve just-in-time per slice.
- **S-pv1 — `r` integer-ratio validation (runtime).** Add to `r`: `.isIntRatio()` (a BOOLEAN check, both
  operands integer) + an `{ asInts: true }` option that THROWS a coded `CALIPERS_E_*` on a non-integer
  operand. Reuse `r`'s gcd/normalize + scalar embedding. Runtime only (the `IntRatio` type-brand rides on
  Phase C, S-pv6).
- **S-pv2 — `f` / `m` accept an `r`; `f` carries its exact rational INTERNALLY.** `f(r(9, 10))` -> `0.9`;
  `f`'s input widens to `number | IRatio`, coercing via `.valueOf()`. When the `r` is `.isIntRatio()`, the
  float STORES its exact rational (`#rational`) as INTERNAL state — there is NO public accessor; purity is
  internal storage the exact-arithmetic ops (S-pv3) read directly. `clone` preserves it; arithmetic DROPS it
  (the value changed, so the fraction is stale). `m` ALSO accepts an `r`, by WRAPPING it in a pure `f` and
  ingesting that scalar: `m` stays a pure CONTAINER (purity is `f`'s / `r`'s concern, NO `m`-level API), and
  the embedded `f` carries the rational. `m(r(9, 10), 'px')` -> `0.9px`.
- **S-pv3 — the pure-rational engine.** Keep `#rational` INTERNAL (no public accessor). Make `+ − × ÷` stay
  symbolic (rational) through a chain by RECOMPUTING `#rational` from the operands instead of dropping it,
  with tainting (one impure operand -> impure). An operand is PURE when it carries a stored `#rational` OR is
  integer-valued (trivially `n/1`), so integer chains and `m(10)` stay exact with no auto-detect. The
  observable is the exact RESULT, which is ALSO how the S-pv2 storage (currently carried but internal) gets
  its coverage. This slice ships only the ENGINE, so the purity sources are the ones S-pv2 already provides:
  an `r`-sourced float (`f(r(3, 10)).divide(f(r(1, 10)))` -> `3`) and integers
  (`m(f(10)).divide(i(3)).multiply(i(3))` -> `10`). The decimal-literal spelling (`f(0.1).add(f(0.2))` ->
  `0.3`) lights up at S-pv4, when auto-detect makes `f(0.1)` pure `1/10`.
- **S-pv4 — auto-detect clean decimal literals** (PV3 conservative): `f(0.5)` -> `1/2` at runtime, gated by
  the config-driven `cleanDecimalDigits` (default 3; float-scoped, cascades like `snap`). `f` only; `m`/`u` later.
- **S-pv5 — output precision** for a non-terminating rational (`10/3` -> rounded `.css()`).
- **S-pv6 — type-level squiggle (needs Phase C).** `r` generic `IRatio<N, D>` -> harden to `IntRatio` when
  `i/i` (PV6) -> a pure `f` squiggles on overflow (the D6 revision; shallow-only within tuple limits).
  REVISIT here: `cleanDecimalDigits` default is 3 = the max squiggle-able digits (tuple limit); if this tier
  can squiggle MORE digits, RAISE that default to match (the maximize-squiggles principle).

## OPEN FORKS (work top-to-bottom)

- [x] **"How clean is clean" — RESOLVED (S-pv4): a config-driven digit bound `cleanDecimalDigits`, default 3.**
  Mechanism: read the double's shortest round-trip decimal (`.toString()`) and take it LITERALLY as its exact
  rational (`0.333` -> `333/1000`, honouring what was typed). NO fraction-RECOGNITION: we never look at
  `0.3333333333333333` and guess `1/3`. Promote only when it is a plain terminating decimal with
  `<= cleanDecimalDigits` fractional digits; a longer / noisier string (`0.1+0.2` -> `0.30000000000000004`,
  `0.3/0.1` -> `2.9999999999999996`, `pi`) stays impure. `cleanDecimalDigits` is float-scoped and cascades
  `own float key -> scalar/codex global -> default 3`, exactly like `snap` (see docs/config-flow.md).
  - **Why 3 (the MAX squiggle-able cutoff).** The lexicon's goal is MAXIMUM author-time squiggles. A pure
    float can only ever type-squiggle when its denominator fits the type-level tuple arithmetic, which dies at
    TS's ~1000 recursion limit: `IsNativelyCheckable` caps at **3** fractional digits (denominator <= 1000,
    the tuple edge; matrix row `f(0.333)` -> `333/1000`). So 3 is the most a pure float could EVER squiggle,
    and the runtime auto-detect default is aligned to it: a runtime-promoted pure float never exceeds what
    could eventually get a squiggle (S-pv6, the type-level pure-float tier, is not built yet, but the default
    is set for it). The cap stays 15: a consumer who wants broader RUNTIME exactness and does not care about
    squiggle alignment can opt into a higher cutoff per factory. **FUTURE (revisit at S-pv6): if a type
    encoding ever squiggles past 3 digits, RAISE this default to match — the maximize-squiggles principle.**
  - **The 3-digit cap is a TypeScript LIMIT; the ESLint script (magnitude Phase D) is the planned bridge.**
    The type-level check is unary tuple arithmetic, which hits TS's ~1000 recursion limit (TS2589): `tsc`
    cannot build a tuple past ~1000, so it can only squiggle a magnitude up to ~1000 / 3 fractional digits.
    That is a `tsc` limitation, NOT a limit on author-time feedback. The planned author-time ESLint magnitude
    script (magnitude ladder Phase D, "the biggest lever") RUNS THE REAL JS MATH at lint time, so it flags an
    out-of-range value for ANY magnitude — floats, 4+ digit decimals, non-literals, deep chains — with no
    tuple ceiling. So author-time feedback is TWO rungs: `tsc` squiggles the shallow (<= 3 digit) slice live
    per keystroke, and the ESLint script covers the rest. When that script lands, revisit raising
    `cleanDecimalDigits` past 3 (the linter, not `tsc`, would then supply the feedback).
- [x] **Constructs that carry purity** — `f` (yes), `m` (embeds a scalar -> inherits), `i` (trivially `n/1` —
  YES, resolved S-pv3: an integer-VALUED operand is treated as `n/1`, so integer math and `m(10)` are exact
  with no auto-detect; an integer scalar need not STORE a `#rational` for this).
- [ ] **Representation** — `number` num/den (overflow past 2^53) vs `bigint` (exact, heavier); GCD-reduce each
  op (`6/3` -> `2/1`). S-pv3: GCD-reduce every op; on an unsafe-integer result (past 2^53) TAINT to a plain
  double (honest impurity) rather than claim a false-exact value — `bigint` stays the deferred richer option.
- [ ] **Symbolic vs eager** — stay `10/3` through the whole chain, collapse only at `.css()` / `.value()`.
- [ ] **Output** — `.css()` on a non-terminating rational (`10/3`) rounds to N places (reuse `toPlainDecimal`
  + a precision knob); does `.value()` collapse to a double?
- [ ] **Type-level squiggle** — only via `iRatio` (per PV2); confirm the D6 revision + the shallow-only tuple
  limits (`num`, `den`, `min·d`, `max·d` < ~1000).
- [ ] **`iRatio` vs `r`** — a new sibling, or a variant sharing `r`'s num/den + gcd (renders a decimal via `f`,
  where `r` renders `"16/9"`)?
- [ ] **Two-tier interaction** — how a TYPE-pure `iRatio` value and a RUNTIME-pure decimal value compose
  through an op (the result's tier).
- [ ] **API surface** — `f.frac(n, d)` shorthand? `iRatio` inputs (bare literals `iRatio(9, 10)` vs `i()`
  values vs both)? (`.asFraction()` / `.isPure()` are RESOLVED: no public accessor, purity is internal — PV7.)

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

## Later (low priority)

- **Symbolic Math irrationals in `r`.** A JS built-in irrational (`Math.PI`, `Math.E`) could be recognized
  SYMBOLICALLY — as the constant, not a fabricated fraction — and potentially rendered via CSS's `pi` / `e`
  `calc()` constants. This is recognition of a KNOWN constant, distinct from the fraction-guessing non-goal
  above (`Math.PI` stays impure under the current rules). Not now; a bullet for later.

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
> Decimal-literal rows (`f(0.1)` / `f(0.3)` / `f(0.5)`) need S-pv4 auto-detect to be pure; at S-pv3 the same
> engine is proven with the `r`-sourced and integer rows (`f(r(3, 10))`, `m(f(1))`, the `iRatio` form).

| expression | double today | pure expected |
|---|---|---|
| `f(0.1).add(f(0.2))` | `0.30000000000000004` | `0.3` |
| `f(0.3).divide(f(0.1))` | `2.9999999999999996` | `3` |
| `f(0.1).multiply(i(3))` | `0.30000000000000004` | `0.3` |
| `iRatio(i(1), i(3)).multiply(i(3))` | `0.999…` | `1` |
| `m(f(1)).divide(i(10)).multiply(i(3))` | `0.30000000000000004` | `0.3` (symbolic chain; `f` not `i` — an embedded `i` rejects the `0.1` step) |
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
| `modifier` (`floor` / `round`) on a pure value | S-pv3: DROP the rational (impure); re-deriving one from the modified value stays **[OPEN: floor(`10/3`) -> pure `3/1`?]** |
| pure `f` + `{ min, max }` + `snap` | bound / snap operate on the rational (magnitude-layer reuse) |
| `m` embeds a pure `f` | `m` inherits the purity + rational |
| type-pure `iRatio` composed with runtime-pure decimal (`f(iRatio(i(1), i(2))).add(f(0.25))`) | exact `3/4` (runtime-pure); NO type squiggle (the decimal side has no type-level rational) |
| num / den overflow in the `number` rep | **[OPEN: representation fork -> `bigint` or cap]** |
