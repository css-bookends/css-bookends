# AGENTS.md

Guidance for agents working in CSS-Bookends. See `ARCHITECTURE.md` for the full
factory + book model, and each package's `design.md` / `notes.md` for specifics.

## All packages stay PUBLIC (absolute)

Every package here is public, INCLUDING test / `e2e` packages. NEVER set `"private": true`,
never flip a package's `private` field, and never "fix" a `"private": false` to `true`
(e.g. during a publish audit). Leave `private` exactly as it is. This is the user's
explicit, repeated instruction. (Full statement in `.claude/CLAUDE.md`.)

## Architecture: the three layers (canonical, ABSOLUTE)

The same statement lives in `.claude/CLAUDE.md`, the package READMEs, and the skills.
Keep them in sync. For the map at a glance (units × bundles, plus the foundation→family model),
see `docs/foundations.md` ("The map"). The stack is three strictly-separated layers, each with one
job (a Layer-1 unit is a **lexicon**; "primitive" is the retired synonym):

1. **css-calipers (Layer 1), typed CSS input LEXICONS only.** Fills the gap where
   `csstype` is lacking: typed, build-time-validated CSS input values (`m`, `r`, `i`,
   `f`, `color`). Usable STANDALONE, for someone who wants only typed CSS inputs and no
   helpers at all. NO helpers, NO books, no `publishBook` engine, ever.
2. **css-bookends (Layer 2), the helpers (books) that consume the lexicons.** EVERY
   helper is a book (per-property: opacity, zIndex, ...; composed: borders, shadows,
   margin, ...). The compendium is the full bundle of every active book; gilding is the
   output-edge finisher. Books consume calipers; calipers never depends on a book. (The
   **platemaker** is NOT a book: it is a calipers-adjacent input adapter in the
   `css-calipers` org that feeds Layer 1; see its rule below.)
3. **css-squire (Layer 3, TBD), the opinionated framework on top.** Built on the steady
   calipers + bookends foundation, adaptable per project (you could in theory rebuild
   Tailwind or Bootstrap on top of it). Not built yet; nothing depends on it.

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
  error / hardening infra, the bundle / cascade) before the individual lexicons / units that ride on
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

### Consume helpers from a factory, never import directly (absolute)

Every helper (lexicon or book) is produced by a factory. Consume the factory, or
an instance the composition root made from it, never the raw helper/value-function
imported straight from its module.

See `docs/factory-first-pattern.md` for the full rationale: why the factory is the
one supported construction path, and the recommended bind-once-and-export pattern.

**Examples and tests dogfood this (absolute).** Example files consume helpers the
recommended way: bind a factory once (at the top of the file, or via a binding
module) and use that, never a bare value-function. An example may break best
practice ONLY when demonstrating that the inline / non-recommended path also works
is the explicit POINT of that example, and it says so (e.g. the labelled inline `p`
in `examples/bind-once/`). The test suite follows the same rule: default tests
import their helpers from the shared bound codex in `tests/support/` (bind once,
re-export), and only tests whose SUBJECT is a factory / its config, or the built
artifact, construct their own instances.

- **Factory naming: `publishBook<BookName>`.** A book's factory is named with the
  `publishBook` prefix plus the book's name, e.g. `publishBookBorders`,
  `publishBookShadows`, `publishBookOpacity`. The engine (`@css-bookends/self-publish`)
  exposes `publishBook`, which binds a book from its manuscript. Do NOT use
  `make*` / `create*` for a book factory.

The public surface of a per-book package is its factory; a per-book package ships no
pre-made default instance. The compendium is the one aggregate on top: its entry is the
`publishCompendium` factory itself, and a bare `publishCompendium()` is the lazy-defaults
form (every book bound at defaults). That aggregate does not change the per-book contract.

- **A book package exports its `publishBook<Name>` factory** (plus value builders and
  composition helpers where useful, e.g. `anchorSize`, or margin/padding's `parse*`/`store*`),
  never a pre-made instance as the consumer entry. A consumer binds a book once
  (`const borders = publishBookBorders()`) and calls it.
- **The compendium (aggregate root).** `@css-bookends/compendium`'s entry IS the
  `publishCompendium` factory, exported as the package's DEFAULT export (the entry file is
  the factory). A bare `publishCompendium()` binds every active book at its own defaults
  (the lazy-defaults form); passing a master `CompendiumConfig` configures any subset.
  `CompendiumConfig` is an amalgam: an optional `global` slot of shared options PLUS one
  OPTIONAL key per configurable book, each keyed to that book's own config type
  (`{ global?: { format?: 'object' | 'string'; … }; color?: Partial<ColorConfig>;
  opacity?: OpacityConfig; borders?: BordersConfig; ... }`). The factory fans each sub-config
  into the matching `publishBook<Name>` and binds the rest at defaults. It returns every book
  bound in one object and does NOT re-export raw helpers, so a raw value-helper is not reachable
  through it. This aggregate sits ON TOP of the per-book factories; it does not change the
  per-book contract (each package still exports only its `publishBook<Name>`, no pre-made
  instance).
- **Everything is config-driven (absolute, first principle).** A behaviour that could reasonably
  vary is a config OPTION (an explicit, enumerated value with a sensible default), never a hardcoded
  decision. When the design forces a "should it do X or Y?" choice, the answer is "neither — it's a
  config." Do not bake one branch in. Every such option then follows the cascade +
  bundle-reachability rules below. (Examples: `format: 'object' | 'string'`,
  `outOfRange: 'throw' | 'clamp'`, the hardening reaction `'warn' | 'fail'`.)
- **Three-tier config cascade (absolute).** A bundle (`publishCompendium`, `createCalipersBundle`)
  resolves every setting per unit as: the unit's OWN keyed config -> the bundle's `global` slot
  (where that option applies) -> the unit's built-in default. Set a value once in `global` and
  every applicable unit inherits it; a unit's own key overrides. The `global` slot is the only
  way to set a value across the whole bundle at once.
- **Same pattern all the way down; mirror `src/bundle.ts` (absolute).** Every grouping is the
  SAME bundle-factory shape, recursively: a lexicon family (e.g. `scalar` = integer/float/ratio),
  the codex, the compendium. Each has a `global` slot + one OPTIONAL key per sub-factory + a
  `cascade` helper + a body that SPREADS every sub-factory (called through the cascade) into one
  bound object. A sub-factory can itself be a bundle: the codex composes a family bundle exactly
  as it composes a lexicon factory. `createCalipersBundle` in `lexicons/calipers/src/bundle.ts`
  is the ONE canonical implementation. Before designing or changing ANY factory, bundle, or NEW
  grouping / family factory, invoke the `config-cascade` + `smart-factory` skills and MIRROR
  `src/bundle.ts` — never design a bundle shape from memory. A grouping that does not take
  `global` and cascade is wrong; the answer to "should this be its own new shape?" is always
  "no, mirror the bundle."
- **A book self-instantiates its dependencies; it never REQUIRES their config (absolute).** When
  a book needs a calipers lexicon configured a certain way, it CREATES its own calipers
  instance via the factory (`createCalipers` / `createColor`) with the config it needs, INTERNAL
  to the book. A book never asks the consumer to pass a calipers config through, and never takes
  a hard dependency on a shared calipers instance. This keeps books decoupled from calipers'
  config surface and minimizes the config a consumer ever has to supply. (The compendium's
  `calipers` slot configures the calipers LAYER you use directly through the bundle; it is not a
  channel for wiring an individual book's internal calipers needs.)
- **Call sites bind, then call** (`const borders = publishBookBorders(); borders(spec).css()`),
  or pull a bound book off `publishCompendium()`. Pass config at bind time
  (`publishBookBorders({ config })`), or via the matching `CompendiumConfig` key when
  configuring through the compendium (`publishCompendium({ color: { config } })`).
- **Never reach past the factory** to import the underlying value-helper as the consumer
  entry, even when it is exported from its own package for the factory's use.
- **Exception: `css-calipers` (the codex bundle and its lexicons).** A lexicon is consumed
  directly via its `create*` factory (`createCalipers` → `m()`, `createColor` → `color()`), not
  via a `publishBook` factory; `m()` / `color()` are those factories bound at defaults.
- **Exception: composed books (a DOCUMENTED namespace class).** A small, fixed set of
  books are multi-function utility namespaces, not single value->CSS manuscripts, so they
  expose NO `publishBook<Name>` factory: `shadows`, `positioning`, `supports-fallback`,
  `backdrop-filter`, `transforms`. Their public surface is the namespace of pure
  functions (`backdropFilterValue` / `backdropFilterStyle`, `transformValue` /
  `transformStyle`, etc.). They ALSO ship NO pre-made bound instance and no default
  export: there is no bound default anywhere in the books layer. The compendium binds
  each of these via `import * as X` under its namespace. This list is closed; a new
  per-property / per-value book is a `publishBook<Name>` factory, never a namespace.

### Constraints, brands, and seal (the two systems, absolute)

A numeric lexicon's restrictions are TWO orthogonal systems, and every numeric lexicon (`i`, `f`,
`m`, `r`) gets BOTH:

- **System A, brands** (compile-time proof): the refinement quartet stamps a phantom brand
  (`InRange<0,50>`, `NonNegative`) into the type on success. Additive, dropped by arithmetic. The
  editor feedback (see THE THESIS above).
- **System B, the runtime bound** (stored `min`/`max`, `.constraints()`): carried through arithmetic,
  enforced by the `hardening` reaction. The data you clone and seal.

Surface: **bounded builders mint branded values** (`createInteger({ min, max })` -> `InRange<min,max>`);
**`clone(patch?)`** is a partial-patch copy that respects seals; **`sealed` is per boundary edge**
(config `sealedMin` / `sealedMax` / `sealedRange`, methods `sealMin()` / `sealMax()` / `sealRange()`).

- **`sealed` is CONTROL, not prevention.** A sealed edge is fixed against `clone`, but minting a
  fresh value from the number (`i(v.value(), { min, max })`) is always allowed and DOCUMENTED. A team
  that wants "sealed means sealed" adds the in-package ESLint rule at its edge (bookends: typed core,
  opt-in edge enforcement).
- **Terminology (absolute):** the bound-lock is `sealed`, NEVER `immutable` (the value already is)
  and NEVER `hardening` (the `'warn' | 'fail'` reaction). The bound is `constraints`. Full
  model + the two-systems table in `docs/foundations.md`.

### The two lazy-defaults exports (the zero-config path, absolute)

There are EXACTLY TWO lazy-defaults exports in the whole monorepo, no per-book ones. Each
is a master factory (one optional keyed config slot per sub-factory) PLUS the
bound-at-defaults surface, so a consumer who does not want to configure anything imports
helpers already bound and never calls a factory:

- **css-calipers: `codex`** (the calipers BUNDLE). DEFAULT-exports the master factory
  `createCalipersBundle`, whose config is the same `{ global?, <unitKey>? }` shape as
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
// (color is the calipers colour LEXICON via `createColor()`, NOT a book)
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

### Test-first, always (absolute)

When adding or changing behaviour that needs tests, write the tests FIRST and confirm they
genuinely FAIL against the current code before writing any implementation. The failing test is
the spec.

- NEVER `it.skip` / `it.todo` / `xit`, or an always-passing assertion. A deliberately-failing
  stub must stay RED and visible (`expect.fail('not implemented')`), never skipped or todo'd.
- Confirm the red by running the test BEFORE writing the implementation.
- A type-level change MUST have a `tsd` test that does NOT compile against the old types (a
  runtime test that is green from the start does not validate a type-level change).
- Report test status ACCURATELY: never call a suite green or done while anything is red.
- Only once the test is truly red do you implement to make it green.
