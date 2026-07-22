# AGENTS.md

Guidance for agents working in CSS-Bookends. See `ARCHITECTURE.md` for the full
factory + book model, and each package's `design.md` / `notes.md` for specifics.

> **How this file works (the contract).** Each rule below has ONE canonical home, here. Other docs
> (`.claude/CLAUDE.md`, package READMEs, skills) LINK to it, they do NOT restate it. Every line is
> absolute and enough to obey on its own; follow a `→ skill:` pointer for the procedure and a
> `→ docs/` pointer for depth. One home per rule, link don't duplicate — that is what stops these from
> drifting.

## All packages stay PUBLIC (absolute)

Every package here is public, INCLUDING test / `e2e` packages. NEVER set `"private": true`,
never flip a package's `private` field, and never "fix" a `"private": false` to `true`
(e.g. during a publish audit). Leave `private` exactly as it is. This is the user's
explicit, repeated instruction. (Full statement in `.claude/CLAUDE.md`.)

## Architecture: the three layers (canonical, ABSOLUTE)

For the map at a glance (units × bundles, plus the foundation→family model), see
`docs/foundations.md` ("The map"). The stack is three strictly-separated layers, each with one
job (a Layer-1 unit is a **lexicon**; "primitive" is the retired synonym):

1. **css-calipers (Layer 1), typed CSS input LEXICONS only.** Fills the gap where
   `csstype` is lacking: typed, build-time-validated CSS input values (`m`, `r`, `i`,
   `f`, `color`). Usable STANDALONE, for someone who wants only typed CSS inputs and no
   helpers at all. NO helpers, NO books, no `publishBook` engine, ever.
2. **css-bookends (Layer 2), the helpers (books) that consume the lexicons.** EVERY
   helper is a book (per-property: opacity, zIndex, ...; composed: borders, shadows,
   margin, ...). A per-property book is the property-WRITING helper; the VALUE it works
   with (a bounded LEXICON value, e.g. font-weight `createIntegerFactory({ min: 100, max: 900 })`)
   is a Layer-1 lexicon per THE RULE, not the book. Value = lexicon, writing-helper = book.
   The compendium is the full bundle of every active book; gilding is the
   output-edge finisher. Books consume calipers; calipers never depends on a book. (The
   **platemaker** is NOT a book: it is a calipers-adjacent input adapter in the
   `css-calipers` org that feeds Layer 1; see its rule below.)
3. **css-squire (Layer 3, TBD), the opinionated framework on top.** Built on the steady
   calipers + bookends foundation, adaptable per project (you could in theory rebuild
   Tailwind or Bootstrap on top of it). Not built yet; nothing depends on it.

Calipers is the **assembly language for CSS**: verbose but it covers all of CSS. The upper layers are
additive ergonomics, never gatekeepers, so you can always drop DOWN to calipers directly for finer
control, a CSS feature no book covers yet, or an unfinished book. A missing helper is never a blocker.
(Full principle in `docs/foundations.md`.)

**THE THESIS (why a lexicon exists, absolute).** TypeScript cannot validate a numeric bound at the
type level (no `50 > 10` type operation; tuple-arithmetic tricks die on floats, negatives, large
ranges, and computed values). A lexicon RUNS JS to do that check, then BRANDS the result so TS
enforces the proof at every boundary: an unproven value cannot enter a bounded slot. JS validates
what TS can't; TS enforces the outcome. This is the whole "typed input, build-time-validated" promise
and the reason calipers exists. Author-time magnitude feedback for literals is an OPT-IN edge tool
(an in-package ESLint rule), never the core. See `docs/foundations.md` ("Why the lexicon exists").

The per-property helpers now live in the BOOKS layer (the `@css-bookends/css-value-core`
engine + a per-property book each); that is their home. The old `lexicons/calipers/src/css-values/`
residue has already been removed; calipers keeps only the value lexicons. Do NOT add helpers to
calipers.

**Both layers share ONE shape (absolute):** a UNIT is the atom (a calipers lexicon, a
bookends book); every unit is its own npm package exposing a factory. A BUNDLE aggregates a
layer's units with a global config: `compendium` for books, `codex` (`css-calipers`) for
calipers. So calipers is sliced into per-lexicon packages (`@css-bookends/measurement`,
`/ratio`, `/integer`, `/float`, the colour lexicon) at PUBLISH TIME from the single
`lexicons/calipers/src` source — NO shared `@css-bookends/core` package, no files move, each
slice self-contained (no slice depends on another `@css-bookends/*`; see `docs/calipers-split.md`,
authoritative on the split) — mirroring books + compendium. Three cross-cutting patterns follow:
factory-first, output-shape via config (`format`), and the three-tier config cascade. They are
detailed below.

## Global rules

### Rollout and commit priority (absolute)

Roll changes out — and commit them — in priority order: **spec → enforcement → foundational →
leaves → bookends**.

- **Spec first.** Document the target (these rules / `docs/` / skills) BEFORE any code, per
  test-first, and land it as its OWN commit once the user approves. Code never leads the spec.
- **Then code, foundational → leaves.** The shared machinery everything depends on (the core, the
  error / bound infra, the bundle / cascade) before the individual lexicons / units that ride on
  it; the bookends layer last.
- **Descend when a step needs a lower level.** If a batch surfaces a deeper dependency, descend to
  that level, complete and commit it, then bump back UP and continue the cycle.
- Keep each commit green and reviewable; do not mix layers in one pile.

### Source of truth: css-bookends drives; the calipers repo MIRRORS (absolute)

This monorepo (css-bookends) is the SOURCE OF TRUTH for all calipers code, authored here under
`lexicons/calipers/`. The standalone `slafleche/css-calipers` repo is a DOWNSTREAM MIRROR (the
`mirror.sh` push-out target), never where design decisions are made. The mirror MUST keep
working as a self-contained standalone library, but that is a property we PRESERVE downstream,
not a driver: when a bookends need conflicts with the mirror's standalone framing, BOOKENDS
WINS. "calipers reads as complete / standalone" governs how the MIRROR presents itself; it never
outranks what bookends requires. Order of work: change calipers HERE for bookends first, THEN
verify the mirror still publishes cleanly.

### css-calipers positioning (README, docs, all public copy) (absolute)

- NEVER knock or disparage `csstype`. It is loved and used as a DEPENDENCY. Frame
  calipers as COMPLEMENTARY to csstype, never a replacement and never a criticism.
- Lead with the gap calipers fills: csstype types the shape of CSS well, but leaves
  gaps for certain typed CSS INPUT values (e.g. a property type allows a bare
  `number` / `string`, so you cannot construct a build-time-validated value). calipers
  fills exactly that gap: typed, validated CSS input values that still satisfy csstype
  on output.
- Keep it SMALL and focused. Trim exhaustive feature dumps; lead with the goal and the
  space it fills, then concise examples, and link to `docs/` for depth. Do not oversell.
- calipers is and stays a STANDALONE library that fills a gap; it must read as complete
  and useful on its own (you never need bookends to use it). Pointing to the larger
  CSS-Bookends project (helpers on top, Layer 2; CSS Squire the opinionated Layer 3) is
  welcome but SECONDARY: a "there is more if you want it" note, never a framing that
  makes calipers feel incomplete without it or subordinate to it. (This governs how the
  MIRROR presents itself; per "Source of truth" above, standalone NEVER outranks a bookends need.)

### css-bookends positioning (README, docs, public copy) (absolute)

- The dream, in one line: TYPED INPUT and TYPED OUTPUT with a LOOSE MIDDLE. Typed CSS
  input values (calipers) go in, a typed `.css()` output that satisfies csstype comes
  out, and the middle, composing helpers and books, stays flexible and ergonomic. Type
  safety is anchored at the two ends; you are not forced to type every intermediate
  step. That is the whole appeal of the helper layer.
- Bookends is the helper layer that turns those typed inputs into something useful;
  emphasize the typed-ends, loose-middle framing as its reason to exist.

### Consume helpers from a factory, never import directly (absolute)

Every helper (lexicon or book) is produced by a factory; consume the factory (or an instance the
composition root bound from it), never the raw value-function. Full rationale + the bind-once-export
pattern: `docs/factory-first-pattern.md`. The factory / cascade / bundle procedure and examples live
in the `smart-factory` + `config-cascade` skills — invoke them before designing any factory or bundle.

- **Factory naming: `publishBook<Name>`** (e.g. `publishBookBorders`), bound from a manuscript by
  `@css-bookends/self-publish`. NEVER `make*` / `create*` for a book factory.
- **A book package exports ONLY its `publishBook<Name>` factory** (plus value builders / composition
  helpers where useful), never a pre-made instance as the consumer entry. Bind once
  (`const borders = publishBookBorders()`), then call; pass config at bind time.
- **The compendium is the aggregate root.** `@css-bookends/compendium`'s DEFAULT export IS
  `publishCompendium`; a bare `publishCompendium()` binds every book at defaults (lazy form), a
  `CompendiumConfig` (a `global` slot + one optional key per book) configures any subset. It fans
  each sub-config into the matching `publishBook<Name>`, re-exports NO raw helpers, and does not
  change the per-book contract.
- **Everything is config-driven.** A behaviour that could reasonably vary is a config OPTION
  (enumerated + sensible default), never a baked-in branch — "should it do X or Y?" is answered
  "neither, it's a config" (e.g. `format`, `outOfRange: 'throw' | 'clamp'`, the planned per-edge `clamp`).
- **Three-tier cascade.** Each setting resolves: the unit's OWN key → the bundle `global` slot → the
  unit default. Set once in `global` (the only bundle-wide switch), a unit key overrides.
- **Same shape all the way down — mirror `lexicons/calipers/src/bundle.ts`.** Every grouping (lexicon
  family, codex, compendium) is the same bundle-factory shape: a `global` slot + one optional key per
  sub-factory + a `cascade` helper spreading each sub-factory into one bound object; a sub-factory can
  itself be a bundle. Never design a bundle shape from memory; "should this be a new shape?" is always
  "no, mirror the bundle." (Detail: `config-cascade` skill.)
- **A book self-instantiates its dependencies; it never REQUIRES their config.** It creates its own
  calipers instance (`createCalipersFactory` / `createColorFactory`) internally with the config it needs; it never
  threads a calipers config through the consumer or hard-depends on a shared instance. (The
  compendium's `calipers` slot configures the calipers LAYER you use directly, not a book's internals.)
- **Never reach past the factory** to import the underlying value-helper as the consumer entry.
- **Examples and tests dogfood this.** Examples bind a factory once and use it (a bare value-function
  only when demoing that the inline path works is the explicit POINT, and it says so). Default tests
  import helpers from the bound codex in `tests/support/`; only factory-subject / built-artifact tests
  construct their own instances.
- **Exception: `css-calipers`.** A lexicon is consumed via its `create*` factory (`createCalipersFactory` →
  `m()`, `createColorFactory` → `color()`); `m()` / `color()` are those factories bound at defaults.
- **Exception: composed books (closed, documented namespace class).** `shadows`, `positioning`,
  `supports-fallback`, `backdrop-filter`, `transforms` expose NO `publishBook<Name>` factory — their
  surface is a namespace of pure functions, and they ship no bound instance / no default export. The
  list is closed; a new per-property / per-value book is always a `publishBook<Name>` factory.

### Constraints and brands (the two systems, absolute)

A numeric value's restrictions are TWO orthogonal systems. Both live on the config-bearing SCALARS
(`i`, `f`); `m` and `r` are CONTAINERS that embed a scalar and carry NO numeric config of their own
(`m` = one scalar + a unit; `r` = two scalars), so a measurement gets BOTH only via the `i` / `f` it
embeds (its bound surfaces through `.constraints()`). `u` is the bare scalar and gets neither:

- **System A, brands** (compile-time proof): the refinement quartet stamps a phantom brand
  (`InRange<0,50>`, `NonNegative`) into the type on success. Additive, dropped by arithmetic. The
  editor feedback (see THE THESIS above).
- **System B, the runtime bound** (stored `min`/`max`, `.constraints()`): carried through arithmetic,
  enforced by **failing on breach**. Real data on the value.

Surface: **bounded builders mint branded values** (`createIntegerFactory({ min, max })` -> `InRange<min,max>`).
A bound is set ONCE at construction (a factory config OR per-value options, never both -> throws), then
it is immutable; to change a bound you MINT A FRESH value (`i(v.value(), { min, max })`), the
always-available escape. There is NO bound merging and NO in-place bound mutation.

- **`clone()`** is a zero-arg, config-preserving copy (same value, bound, error config, a
  fresh instance); to change anything, mint fresh. There is no `sealed` and no clone patch: with no
  bound mutation, nothing needs locking.
- **Terminology (absolute):** the bound is `constraints`; breaching it **throws** — there is no
  reaction knob (`hardening` retired 2026-07-21). The value and its bound are both immutable. Full
  model + the two-systems table in `docs/foundations.md`.

### The two lazy-defaults exports (the zero-config path, absolute)

There are EXACTLY TWO lazy-defaults exports in the whole monorepo, no per-book ones. Each
is a master factory (one optional keyed config slot per sub-factory) PLUS the
bound-at-defaults surface, so a consumer who does not want to configure anything imports
helpers already bound and never calls a factory:

- **css-calipers: `codex`** (the calipers BUNDLE). DEFAULT-exports the master factory
  `createCalipersBundleFactory`, whose config is the same `{ global?, <unitKey>? }` shape as
  `publishCompendium` (a `global` slot plus one optional key per lexicon: `measurement`,
  `ratio`, `integer`, `float`, `color`), with the three-tier cascade. It binds the whole
  calipers surface in one object and also named-exports the full helper set bound at defaults
  (`m` / `r` / `i` / `f` / `color` + the factories), so `codex` is both the master factory and
  the bound bundle. `css-calipers` is the bundle package that depends on + re-exports the
  per-lexicon packages.
- **compendium: `@css-bookends/compendium/defaults`**. The package's main entry stays the
  `publishCompendium` factory (the configurable path, default export). The `/defaults`
  subpath is the bound-at-defaults bundle: `publishCompendium()` called once, with every
  bound book and lexicon re-exported by name (`import { opacity, m, color } from
  '@css-bookends/compendium/defaults'`).

The lazy export is a convenience layer ON TOP of the factory, never a replacement:
configuration still goes through the factory. Do NOT add per-book lazy or instance exports.

Why: the factory is the override seam. It lets you rewrite any step (input, storage,
output), wrap a step (onion-style), or replace the whole manuscript, and swap internals
(libraries, sources) with zero changes at call sites (see `self-publish/composition.md`
and `publishBook`). A direct import bypasses that seam and freezes every call site to one
implementation, which is exactly what this architecture exists to prevent.

### Output is always `.css()` (absolute)

Every helper in CSS-Bookends, lexicon or book, renders its final output through a
single `.css()` terminal. This is universal and not negotiable per helper.

- **`.css()` is the only renderer.** Rendering to a CSS string ALWAYS happens
  through `.css()`. No method may return a rendered string per format (no
  `.hex(): string`, `.toLong(): string`, etc.).
- **The variant is a typed object, never a magic string.** Each book exports a
  named preset namespace of typed format objects (e.g. color's `colorFormats.hex`,
  `colorFormats.rgb`; a true book would have `borderFormats.long`). The
  format type is a discriminated union, so each variant can carry its own typed
  options. Do NOT accept a bare string literal as the format.
- **The variant is chosen by factory config.** The output format is set at factory
  time via the manuscript config (`output: colorFormats.hex`). `.css()` with no
  argument renders the configured variant.
- **One way to pick a one-off variant, ending in `.css()`:** a format selector, never
  an argument into `.css()` (`.css()` itself takes no argument).
  - **As a named format selector:** a method like `color(x).hex()` that returns the
    navigable result configured to that format (it does NOT render), so you still
    finish with `.css()`: `color(x).hex().css()`. Selectors return the helper's
    resolved type, never a string, and the chosen format persists through later
    modifications. This is the line that keeps selectors compatible with the rule.
  - **For a custom format or a priority list:** `color(x).formatAs(descriptor).css()`
    sets the one-off format, then renders through `.css()`.
  The configured default still wins when no override is given.
- **Intermediate values may still be navigated** (drill into a resolved result,
  chain modifications), but the moment you render to CSS, it goes through `.css()`.

Why: a single, predictable output seam is what lets the internals of any helper be
rewritten without touching call sites (the whole point of the factory model). It
also keeps every helper consistent, so a consumer never has to learn a different
render method per package.

Examples:

```ts
// (color is the calipers colour LEXICON via `createColorFactory()`, NOT a book)
borders(spec).css();                       // configured variant per factory config
color('#3366cc').css();                    // configured format (default colorFormats.rgba)
color('#3366cc').hex().css();              // one-off override (selector) -> '#3366cc'
color('#3366cc').formatAs(colorFormats.hex).css();  // one-off override (custom/list) -> '#3366cc'
color('red').darken(0.2).css();            // navigate/modify, then render via .css()
```

### Output shape: a style object or a bare value, by config (`format`, absolute)

Separate from WHICH variant `.css()` renders (above), every book chooses the SHAPE of what
`.css()` returns via a `format: 'object' | 'string'` config:

- `'object'` -> a property-keyed style object (`{ opacity: '0.5' }`, `{ marginTop: '8px', … }`),
  ready to spread into a style object.
- `'string'` -> the bare value (`'0.5'`).
- Global DEFAULT is `'object'`. It is set per book, or once via the bundle's `global` slot
  (cascade above).

Rules:
- The output step MUST receive `cfg` and switch on `format`. A book whose output step drops
  `cfg` and ignores its config is a BUG (borders did this; spacing is the correct reference,
  `lexicons/spacing/src/render.ts`).
- Per-property books still expose `.value()` for the raw scalar. Multi-property books ALSO keep
  their decomposition axis (longhand/shorthand; long/line/short) as a separate config from
  `format`.

### The platemaker is a calipers input adapter, not a book (planned)

A third construct is planned (spec: `docs/platemaker-spec.md`, no code yet): the
**platemaker**, the input-edge adapter that turns design tokens into typed calipers
values at build time. It **onion-wraps [style-dictionary](https://styledictionary.com)**
(the swappable core, the same shape `gilding` uses for Lightning CSS): style-dictionary
owns parse / resolve / transform, so the SOURCE is agnostic (DTCG, Tokens Studio, bespoke
JSON); the platemaker owns the `$type` -> lexicon mapping + emit.

It **belongs to the `css-calipers` org, NOT to bookends / Layer 2.** It depends on
calipers and emits calipers values, and nothing lower depends on it, so it is calipers
input tooling that FEEDS Layer 1, not a book that sits on top. It is its OWN INDEPENDENT
repo (`~/GitHub/platemaker`, package `css-platemaker`), developed on its own and NOT mirrored
out of this monorepo the way calipers is (decided 2026-07-10; see `docs/platemaker-spec.md` §7,
authoritative on its home). The factory + `.css()` rules do not apply to it directly:

- It is **not consumed from a `publishBook` factory**; it is `createPlate(config)`, an
  on-demand build step the dev runs when the design updates.
- It **does not render `.css()`**. Its output is calipers values (TS source and/or an
  in-memory map), rendered downstream through `.css()` like any other value.

Keep the wrapped engine SWAPPABLE (the onion `core`, not a fixed bespoke engine) and the
calipers mapping / routing / emit configurable (see `docs/platemaker-spec.md`).

### Format, lint, and type-check every file you touch (absolute)

Any code an agent writes or edits MUST be run through the repo's formatter,
linter, and type-checker before the work is considered done. Do not hand back
unformatted, unlinted, or type-erroring code.

- **Format with Prettier:** `pnpm format` from the repo root. Markdown is
  intentionally Prettier-ignored (hand-tuned tables and aligned fenced-code
  comments), so never reformat `.md` files.
- **Lint with ESLint, in the owning package:** flat config does not cascade and
  type-aware linting needs the package as its cwd, so run e.g.
  `pnpm --filter @css-bookends/<name> exec eslint . --fix` and resolve anything
  not auto-fixable. All packages share `@css-bookends/eslint-config`; never add
  per-package lint plugins or a per-package Prettier config.
- **Type-check with `tsc`, in the owning package:**
  `pnpm --filter @css-bookends/<name> exec tsc -p tsconfig.json --noEmit` (the
  package's `test:tsc`). It checks the whole project, not a single file, so run
  it for every package you changed and fix all errors.

Tooling scripts use `.mts` (e.g. `scripts/emit-esm-package.mts`) and run under
plain `node`, which requires **Node >= 24** to build (see `.nvmrc` / root
`engines`).

A `husky` pre-commit hook runs `lint-staged` on staged files as a backstop:
per-package ESLint `--fix`, then per-package `tsc --noEmit`, then Prettier. It
is a safety net, not a substitute: leave the tree already clean rather than
relying on the hook.

### Testing (absolute)

Every line is a hard rule; procedure, examples, and the full rationale live in the
`doc-test-code` skill.

- **Test-first.** Changed or new behaviour gets a test you confirm FAILS (run it) against the
  current code before you implement. The failing test is the spec.
- **Red-first for type-level changes.** Use a `tsd` test that does NOT compile against the old
  types; a runtime test green from the start does not validate a type-level change.
- **No fake-green.** Never `it.skip` / `it.todo` / `xit` or an always-passing assertion; a
  deliberately-failing stub stays RED and visible (`expect.fail('not implemented')`).
- **Full-matrix coverage.** Test every `(outcome × type × position)` cell; never skip one as
  "unreachable" or "caught upstream" — that cell is the one that regresses when its other guard moves.
- **Report honestly.** Never call a suite green or done while anything is red.
