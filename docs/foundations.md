# CSS-Bookends foundations

The canonical structure every package conforms to. There are two gold standards, both
file-verified, and everything else is brought to them:

- **`m()` (`lexicons/calipers`, the measurement value type) is the gold-standard LEXICON.**
- **`borders` (`books/borders`) is the gold-standard BOOK.**

Anything that predates this and diverges was vibe-coded; treat divergence as debt to fix, not a
precedent to copy. When in doubt, open `m()` or `borders` and match it.

---

## Why the lexicon exists: JS validates what TypeScript can't, then TS enforces it

This is the point of calipers, and every design choice below serves it.

TypeScript cannot validate numeric bounds at the type level. There is no `50 > 10` type operation,
and the usual tuple-length arithmetic trick collapses on the values CSS actually uses: it fails on
floats, on negatives, and on any range past roughly a thousand (verified with `tsc`: `TS2344` on a
generic multiply signature, `TS2589` "type instantiation is excessively deep" at `IntRange<0, 2000>`
and on any fractional value). So "is this value within `[min, max]`?" is simply not answerable by
the type system for real CSS input.

The lexicon fills exactly that gap. It runs the real `min <= v <= max` check in JavaScript at the
point a value is proven (a bounded builder, a refinement's `ensure`, or an arithmetic
result), and on success it stamps a proof, a phantom brand such as `InRange<0, 10>`, into the
value's type. From then on TypeScript refuses to admit an unproven value into a bounded slot, so a
consumer is forced through the lexicon's check, and an out-of-range value can never silently reach a
boundary.

**JS patches the gap; TS enforces the outcome.** That division is not a compromise, it is the
design: the runtime check is the one thing the type system genuinely cannot do, and the brand is how
the proof it produces becomes build-time enforcement. This is the whole "typed input,
build-time-validated" promise, and it is why a lexicon exists at all.

Two consequences worth stating up front:

- **The editor flags assignability, never magnitude.** A bare `i(50)` has no bound, so nothing is
  flagged; the feedback appears when an unproven or wrong-branded value meets an API that requires
  the bound. The magnitude comparison itself always happens in JS.
- **Author-time magnitude feedback for literals is an opt-in EDGE tool, not the core.** An ESLint
  rule (shipped in the package) can AST-trace a literal chain and run the real JS math at lint time,
  surfacing overflow as an editor squiggle. That is bookends: the typed core stays flexible, and a
  team brackets on stricter enforcement at the edge when it wants it.

---

## Calipers is the assembly language for CSS

You could write ALL of your CSS in calipers. It is verbose and not the most pleasant, but it covers
all of CSS. Calipers is the **assembly language for CSS**: the complete, low-level foundation. The
books (Layer 2) and Squire (Layer 3) are built on top to make authoring pleasant, but they are
ergonomics over a complete lower layer, never the only way in.

The layers are additive convenience, not gatekeepers. So you can always drop DOWN to calipers
directly: when a book isn't finished yet, when a CSS feature isn't covered by a higher layer, or when
you simply need finer control. Reach for the lowest layer that does the job; the higher layers are
optional sugar over a foundation that is always complete and reachable. A missing helper is never a
blocker.

---

## The map: units, bundles, and foundations

Two layers. Within each, a **unit** (the atom) and a **bundle** (every unit of the layer, carrying
config). Learn the four names once, because the two layers are the same machine:

|                          | **unit** — the atom, its own package + factory              | **bundle** — every unit of the layer + a `global` config cascade |
| ------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| **Layer 1 — calipers**   | **lexicon** — a typed CSS input value (`m`, `i`, `f`, `r`, `color`) | **codex** — `css-calipers` (`createCalipersBundle`)      |
| **Layer 2 — bookends**   | **book** — a helper for one CSS concern (opacity, borders, …)      | **compendium** — `publishCompendium`                     |

A **lexicon is to the codex what a book is to the compendium.** Both bundles take
`{ global?, <unitKey>? }` and resolve each setting **own key → `global` → factory default**;
`createCalipersBundle`'s own docstring says it mirrors `publishCompendium`. ("Primitive" is the
older synonym for "lexicon"; prefer **lexicon**.) For the full end-to-end path a setting takes
through every level (compendium → codex → scalar family → standalone lexicon), see
`docs/config-flow.md`.

**Graduated control within the calipers lexicons (keep it simple, add complexity as needed).** The
value types split by how much numeric control you want, so the simple path stays simple and you opt
into complexity only when you need it. `m(5)` is breezy: it wraps a plain number in `u`, the bare
scalar (finite math, no config, no ceremony). You reach for a config-bearing SCALAR only when you
need constraints: `i` / `f` carry the bound (enforced by failing on breach), the modifier, and the
compile-time brands. `m` and `r` are CONTAINERS that embed a scalar and carry NO numeric config of
their own (`m` = one scalar + a unit; `r` = two scalars), so numeric control always lives on the
`i` / `f` you hand them (`m(i(700, { min: 1, max: 900 }), 'px')`) and composes up through the
container. You opt in to a checked system, or you don't. (Full model: `docs/measurement-scalar-model.md`.)

Consumption is one-way: **lexicon → book → squire (TBD)**. A book peer-depends on the lexicons it
uses and self-instantiates them; a lexicon never depends on a book.

### Foundations: not every unit stands alone

Value flows UP through foundations, and a book is often just the thin policy/label at the top.
Three kinds of foundation sit under the books:

- **Codex lexicons** (`m`, `i`, `f`, `r`, `color`) — standalone typed values; each renders its own
  `.css()`; shipped in the codex.
- **Foundation lexicons** (`spacing`) — a lexicon that CANNOT stand alone. It factors the shared
  input/storage/output steps plus a policy surface for a FAMILY of books, but chooses no CSS
  property, so it has no `.css()` target of its own. It lives OUTSIDE the codex, one layer above
  calipers.
- **Shared engines** (`packages/`) — `self-publish` (the manuscript engine every book is stamped
  from) and `css-value-core` (the constrained-scalar engine the per-property books share).

| Foundation        | Kind             | Founds (the family)                                    | What each book adds on top       |
| ----------------- | ---------------- | ------------------------------------------------------ | -------------------------------- |
| `self-publish`    | engine           | every book                                             | its three manuscript steps       |
| `css-value-core`  | engine           | the per-property scalar books (opacity, z-index, …)    | a per-property spec (range + keywords) |
| `spacing`         | foundation lexicon | `margin`, `padding` (gap TBD)                        | a value-domain policy + the property key |
| `color`           | codex lexicon   | `borders` (+ colour anywhere)                          | composition                      |
| `m` `i` `f` `r`   | codex lexicons  | ~everything                                            | —                                |

**Worked example — spacing.** `lexicons/spacing` provides `parseSpacing(input, policy)` (INPUT),
`resolveSpacing` (STORAGE — spells a shorthand out into the canonical four-side store), the
measurement-hardening hook, and the result renderer. The two books are the SAME machine at different
policies:

- **margin** = spacing at the permissive policy (`auto` + negatives + `anchor-size()` allowed),
  output keyed to `'margin'`.
- **padding** = spacing at a narrowed policy (no `auto`, no `anchor-size()`, measurements hardened to
  `NonNegativeMeasurement`), output keyed to `'padding'`.

The book contributes only its **policy** and its **property name**; everything else is spacing. That
is why spacing cannot be used alone, and why it is a lexicon but not a *codex* lexicon.

---

## First principle: everything is config-driven

A behaviour that could reasonably vary is a CONFIG OPTION, not a hardcoded decision. When the
design forces a "should it do X or Y?" question, the answer is almost always "neither — it's a
config" with a sensible default. Examples in play: output shape (`format: 'object' | 'string'`),
out-of-range handling in books (`outOfRange: 'throw' | 'clamp'`), and whether a bounded scalar
(`i` / `f`) absorbs an out-of-range result (the planned per-edge `clamp` reaction). (A bounded
scalar with no `clamp` simply **throws** on breach — that is not a config, it is the one rule.)

- Expose the behaviour as an explicit, enumerated, named config value; never bake one branch in.
- Ship a sensible DEFAULT (the most useful real behaviour), fully overridable.
- The option MUST be reachable from the bundle factory (`createCalipersBundle` / `publishCompendium`)
  under the matching key, with the cascade (own -> bundle global -> default). No unit config the
  bundle factory cannot reach. (See the `doc-test-code` skill's config rule.)

---

## Canonical LEXICON (the `m()` template)

A lexicon is a typed CSS input value type (measurement, ratio, integer, float, colour). Reference:
`lexicons/calipers/src/core.ts`, `internal/createCoreApi.ts`, `factory.ts`, `default.ts`.

1. **Single construction path.** A `create<Lexicon>(config)` factory builds the instance;
   `default.ts` calls it once with no config and re-exports the bare helpers. The default and any
   custom instance share one builder, so they cannot drift. (`factory.ts:23-35`, `default.ts`.)
2. **Phantom branding via module-private `unique symbol`s.** Unit and constraint brands are keyed
   by private symbols declared in `core.ts`; they are asserted only at one controlled construction
   point (`createCoreApi.ts` `createMeasurement`) and cannot be forged from outside. (`core.ts:38-70`.)
3. **Refinement quartet.** Constraints expose `is` (guard) / `ensure` (throw) / `check` (result) /
   `hardenWith` (fallback), all built by one `make<…>Refinement`. Brands are ADDITIVE on success
   and DROPPED by arithmetic (a result can cross a bound), so derived values must be re-checked.
   (`core.ts:153-182`.)
4. **Immutable value, single `.css()` terminal.** Private fields; every method returns a NEW
   instance. `.css()` is the only renderer, via the shared `toPlainDecimal` (no exponential
   notation in CSS). `.valueOf()` / `[Symbol.toPrimitive]` give number coercion.
5. **Shared `Scalar` arithmetic interop.** Arithmetic accepts `Scalar = number | IInteger | IFloat`
   via one `toNumber` (`scalar.ts`); no duck-typing.
6. **Error-config store, separate from core logic.** `createErrorConfigStore` holds per-instance
   config (e.g. `stackHints`), resolved through the cascade; NO process-global fallback. (`internal/errors.ts`.)
7. **Central metadata registry.** Units live in one `UNIT_DEFINITIONS` registry; builders reference
   it, never hardcoded strings; types derive from it. (`unitDefinitions.ts`.)
8. **Strict file split.** `core.ts` (types only) · `internal/create*.ts` (impl + factories) ·
   `factory.ts` (public entry) · `default.ts` (assembly, no logic) · barrels + subpaths.
9. **Tests: runtime + type split.** vitest `*.src.test.ts` for behaviour, tsd `*.test-d.ts` for
   narrowing / brand non-forgeability / unit safety, with shared harnesses across src/cjs/esm.

### The value surface (what a lexicon value exposes)

`m()` / `IMeasurement` (`core.ts:72-105`): render `.css()` / `.toString()`; raw `.value()` /
`.unit()` / `.valueOf()`; predicates `.isUnit` / `.assert*` / `.equals` / `.compare`; arithmetic
`.add` / `.subtract` / `.multiply` / `.divide` / `.double` / `.half` / `.negation` / `.absolute`
(hardened `>=0`) / `.round` / `.floor` / `.ceil` / `.clamp`.

`i()` / `f()` (`integer.ts:13-25`, `float.ts:13-25`) expose `.css()`, `.value()` (the raw number),
`.valueOf()`, `.constraints()`, `.withValue()`, and the same `Scalar` arithmetic.

### Unified value-surface decisions (locked 2026-06-27)

The accessors were inconsistent (measurements `.getValue()`/`.getUnit()`; scalars `.value()`;
ratio `.numerator()`/`.denominator()`). The conformance target:

- **One raw/unit accessor across all value types: `.value()` (raw) + `.unit()` (unit string,
  empty for unitless).** The old measurement `.getValue()`/`.getUnit()` are REMOVED (a breaking
  change, no deprecation window). So `result.value.value()` / `result.value.unit()` are uniform
  whether the leaf is a scalar or a measurement.
- **`m()` accepts `number | i | f`** (via the existing `Scalar` / `toNumber`), not just `number`.
- **Interconversion helpers on every value:** a generic `.asScalar()` (returns the matching
  `i()`/`f()`) plus `.isInt` / `.isFloat` queries (modelled on the colour object's queries), so a
  value can be recovered as a typed scalar through `.value`.
- **CLOSED, not doing: type-through-math.** Values keep their kind through arithmetic. CSS does
  not care about an int-vs-float distinction (helpers already convert via config), so we do NOT
  add kind-changing arithmetic (`i(4).multiply(4.5555)` does not become a float).

### Validation and hardening philosophy (locked 2026-06-27, CSS-spec-grounded)

Per the CSS Values and Units Module L4 range-checking rules: an out-of-range numeric value makes
the declaration **invalid (ignored) by default**, "unless otherwise specified"; values produced by
`calc()` / interpolation / animation are **clamped** to range; and specific properties clamp by
spec (e.g. `opacity` -> `[0,1]`). So the spec defines clamp-or-invalidate per property.

The conformance rules that follow:

- **Validation lives in the HELPER (book), not in `m()` / the lexicons.** A book knows its
  property's spec rule and applies it: **clamp where the spec clamps** (opacity, calc-context),
  otherwise **fail fast** (throw) rather than emit CSS the browser would reject (a typed-input
  library cannot "silently ignore" like the cascade does). This is the existing
  `outOfRange: 'throw' | 'clamp'` knob, defaulted per the property's spec behaviour.
- **`m()` / the lexicons stay PERMISSIVE.** Only truly-invalid input (non-finite) fails; range
  rules are not their job. Ordinary in-range variation (an opacity moving 1 -> 0.4) is never an
  error.
- **Bounds are OPT-IN.** `m()`'s refinement quartet, and a bound on `i`/`f` (`i(v, {min,max})` /
  `createInteger({min,max})`), let a consumer add strict bounds when they want them; it is never forced.

### The runtime bound fails on breach (locked 2026-06-29; `warn` retired 2026-07-21)

All numeric checking lives on the SCALARS. The config-bearing scalars `i` / `f` carry the bound
(`i(v, {min,max})` / `createInteger({min,max})`, runtime bounds re-validated through arithmetic,
exposed via `.constraints()`) and the modifier. A measurement ALSO keeps its refinement quartet
(`nonNegative` / `nonPositive` / `inRange`) for stamping a compile-time brand on a measurement directly
(System A, below). `m` itself carries NO numeric config: its options are only `{ unit, context }`, and
there is no `hardenMeasurement`.

`m()` accepts `number | i | f`. A plain number wraps in `u` (the bare scalar) and has no bound, so it
never reacts. Hand `m` a bounded `i` / `f` instead — `m(i(v, { min, max }), 'px')` — and the measurement
CARRIES that scalar's bound (exposed as a runtime `.constraints()`); ingestion itself is silent (nothing
is lost, it is kept). When later ARITHMETIC crosses (breaks) the carried bound, the operation **fails
(throws)**. There is no reaction knob: a bound you set is a bound you enforce. An in-bounds operation
keeps the constraint; ingesting an unbounded scalar (or a plain number) carries nothing.

**Why there is no "just warn" / "just ignore" mode.** Dropping a bound — silently or with a warning — is
the same as never bounding the value, so if you do not want enforcement, use `u` (the unbounded scalar)
and carry no bound. And a value that must survive out-of-range in production without crashing is served
by clamping it to a valid limit, not by shipping the broken value (which CSS ignores anyway). So there
are three real intents, each with its own tool: don't-enforce → `u`; catch-the-bug → the bound **throws**;
stay-valid-without-crashing → the planned **`clamp`** opt-in (absorb to the limit). The old
`hardening: 'warn' | 'fail'` knob is retired (2026-07-21): `warn` was dominated by `u` / `fail` / `clamp`
in every direction and added no coherent behaviour, and with `fail` the sole reaction the config knob
itself disappears.

**The input `modifier` (generic normalization hook).** The scalar options take an optional
`modifier: (n: number) => number`, applied to the raw value at INTAKE, before the bound is checked and
before the value is stored (modify-then-validate). It is a generic MECHANISM, not policy: the core ships
no built-in normalization. Domain-specific behaviour is built WHERE it is needed, e.g. a cyclic-angle
transform that runs modulo 360 rides on the `f` you hand `m` (`m(f(deg, { modifier: wrap360 }), 'deg')`),
NOT on `m` or `mDeg` (angles legitimately exceed 360°, as in `rotate(720deg)`). A non-special clamp like
opacity does NOT belong here at all — CSS already clamps it, so it is the opacity book's concern, not the
lexicon's. `m` and the unit helpers carry no `modifier`; a unit helper that later presets one would
translate it into the scalar it builds (a parked future door, see `docs/measurement-scalar-model.md`).

### The two constraint systems (brands and the runtime bound) (locked 2026-07-16)

Constraints on a numeric value are really TWO orthogonal systems. Keep them apart:

- **System A, brands (compile-time proof).** The refinement quartet (point 3 above) stamps a phantom
  brand (`InRange<0, 50>`, `NonNegative`, ...) into the type on success. It stores nothing at
  runtime, is ADDITIVE (brands stack), and is DROPPED by arithmetic. This is the editor feedback.
- **System B, the runtime bound (stored min/max).** A per-instance `.constraints()` bound, carried
  through arithmetic and enforced by **failing on breach**. This is real data on the value.

The config-bearing SCALARS `i` / `f` carry BOTH: System B (the runtime bound) and System A (a brand on
a bounded builder). `m` and `r` are CONTAINERS: they embed a scalar and hold no numeric config of
their own, so a measurement surfaces the embedded scalar's bound via `.constraints()` (and can still
stamp a measurement brand through its refinement quartet, System A). `u` is the bare scalar: neither
system. So the runtime bound lives where the numeric config does, on the scalar, and composes up
through the container. The surface that follows:

- **Bounded builders mint branded values.** `createInteger({ min, max })` produces an `i` whose
  values are typed `InRange<min, max>`: the constructor runs the real check in JS, and the type
  carries the proof. A refinement (`inRange(a, b).ensure(x)`) tightens a value downstream,
  additively. `m` carries no bound of its own; hand it a bounded scalar, `m(i(v, { min, max }), 'px')`,
  and the measurement carries that bound.
- **A bound is set ONCE, at construction, then it is immutable.** A value takes its bound from a
  single source (a factory config OR per-value options, never both — passing both throws); there is
  no merging of two specs. To get a different bound you MINT A FRESH value from the number
  (`i(v.value(), { min, max })`), the always-available escape (see "Calipers is the assembly language
  for CSS"). There is no in-place way to widen, narrow, or re-restrict a bound.
- **`clone()`** returns an independent, config-preserving copy: the same value, the same bound, the
  same error config, as a fresh instance. It takes NO arguments; to change anything, mint
  a fresh value.
- **Arithmetic re-checks at runtime and re-proves in the editor.** A derived value re-validates its
  bound in JS (**a breach throws**) and DROPS its brand (the type system cannot
  know the result's magnitude), so the result is unproven and must be re-checked before it re-enters
  a bounded slot.

Terminology guardrails: the bound is **`constraints`**; breaching it **throws** — there is no reaction
knob (`hardening` is retired 2026-07-21). The value is already immutable (every operation returns a new
instance), and its bound is immutable too: there is no mutation API, so no separate lock concept is
needed.

Optional and opt-in: a **type-level strict-literal** range check, for the narrow slice it fits
(small non-negative integer literals in small ranges, e.g. font-weight `100`-`900`), is config-gated
and OFF by default because it is compile-heavy. Outside its feasible slice it resolves to a plain
brand plus a friendly pointer, never a leaked `TS2589`. The general author-time magnitude feedback is
the in-package ESLint rule (real JS math, no tuple limits); the runtime check plus brand is the
baseline for every value.

### Colour is a Layer-1 calipers lexicon (locked 2026-06-27)

The colour VALUE (parse/store/resolve, `colorFormats`, types) lives in `@css-bookends/css-calipers`.
Colour is a LEXICON, not a Layer-2 book: its factory `createColor` is the config-driven entry,
carrying the FULL colour config (`formats`, the default `output` format, `strictness`, `transparent`,
`omitOpaqueAlpha`) and inheriting it through the cascade (compendium `calipers.color` → codex `color`
key → `createColor` → `defaultColorConfig`). The old `@css-bookends/color` / `publishBookColor` BOOK
wrapper is REMOVED — it added nothing once `createColor` carries the config; a book that needs colour
self-instantiates it via `createColor(...)`.

---

## Canonical BOOK (the `borders` template)

A book is a helper that turns typed lexicon inputs into CSS for one concern. Reference:
`books/borders/src/borders.ts`, `src/types.ts`, `design.md`.

1. **Manuscript + `publishBook`.** A book is a `Manuscript { defaults, input, storage, output }`
   passed to `publishBook` (from `@css-bookends/self-publish`), which returns the
   `publishBook<Name>` factory. No pre-made instance. (`borders.ts:303-313`.)
2. **input = PARSE, don't validate.** Accept many raw shapes (shorthand, per-side, axis, complex)
   and merge them by SEMANTIC precedence into a canonical `Store`. The store cannot represent an
   invalid state, so storage and output never re-check. (`borders.ts:130-249`.)
3. **storage = the canonical `Store` is the source of truth.** Often a near no-op when input already
   normalised. Concrete leaves, no ambiguous optionals. (`borders.ts:40-64`.)
4. **output = a NAVIGABLE result.** Drill-in nodes (`.top` / `.right` / `.nw` / …) with `.css()` at
   every node, and **the leaves are LEXICON VALUES** (`IMeasurement`, `ResolvedColor`, `i`/`f`) that
   carry their own `.css()` / `.value()`. So `borders(x).top.width.css()` drills whole → edge →
   value → string. (`types.ts:125-149`, `borders.ts:253-299`.)
5. **Output VARIANTS by config.** A config field selects the emitted shape — borders'
   `output: 'long' | 'line' | 'short'`; the per-property analogue is `format: 'object' | 'string'`.
   **The output step MUST receive `cfg` and switch on it.** Borders has a LIVE BUG here:
   `output: (store) => build(store)` drops `cfg`, so its `output` config is ignored and only `long`
   renders. Fix shape: `output: (store, cfg) => build(store, cfg)`. (`borders.ts:310-312`.)
6. **Typed boundary: loose in, strict out.** Permissive input types; a fully-typed config; a
   canonical typed `Store` in the middle; output typed against csstype `Property.*`.
7. **Peer-depend on lexicons; self-instantiate.** A book peer-depends on the lexicons it uses and
   builds its OWN instances via their factories for defaults (`const color = publishBookColor()`),
   never importing a pre-made singleton, and never requiring a lexicon config be passed in. This
   keeps books decoupled from lexicon config surface. (`borders.ts:1-28`, `package.json`.)
8. **A `design.md` decision record + comprehensive tests** (merge, precedence, drill-in), not just
   the happy path.

### The book result surface (resolves the per-property case)

Because leaves are lexicon values, a PER-PROPERTY book (opacity, zIndex, …) whose single leaf is a
scalar exposes:

- `result.css()` → the CONFIGURED `format` default (`'object'` → `{ opacity: '0.5' }`, `'string'`
  → `'0.5'`). The single render terminal.
- `result.value` → the lexicon value itself (the `i`/`f`), so `result.value.css()` → `'0.5'` and
  `result.value.value()` → the raw number. "The value is always an `i` or `f`."
- `result.style.css()` → the property-keyed style object (`{ opacity: '0.5' }`).
- No `.toString()` on the book result surface.

Both forms are always reachable; `format` (resolved via the bundle cascade) only decides what the
top-level `.css()` returns. Multi-property books additionally keep borders-style drill-in and a
decomposition variant.

---

## What vibe-coded units lack (the conformance checklist)

A lexicon or book is NON-conforming if it:

- builds bare helpers outside the single factory/`default.ts` path (defaults drift);
- uses forgeable brands / public constructors instead of phantom symbols;
- mutates in place instead of returning new instances;
- has only throw-or-nothing instead of the refinement quartet;
- duplicates `.css()` / render logic instead of the shared helper;
- (book) returns a FLAT result instead of a navigable one with lexicon-value leaves;
- (book) drops `cfg` in the output step so config is ignored (the borders bug);
- (book) validates strict input instead of parsing permissive input into a canonical store;
- requires a lexicon config to be threaded in instead of self-instantiating;
- ships no `design.md` and only happy-path tests.

Bringing every lexicon and book to this checklist is the conformance work; see the architecture
plan for sequencing (output `format` + config cascade, the calipers package split, per-package
READMEs).
