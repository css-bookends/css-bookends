# CSS-Bookends architecture rules

This is the canonical architecture. It is ABSOLUTE. The same statement lives in
`AGENTS.md`, the package READMEs, and the skills, keep them in sync.

## All packages stay PUBLIC (absolute, do not touch `private`)

Every package in this repo is published / public, INCLUDING test and `e2e` packages.
NEVER set `"private": true` on any package, never flip a package's `private` field, and
never "fix" a `"private": false` to `true` (e.g. during a publish audit). If a package is
`"private": false`, LEAVE IT. A package describing itself as test-only is NOT a reason to
make it private; the user has decided everything stays public. This is the user's explicit,
repeated instruction. Report packaging observations if asked, but do not change `private`.

## The three layers

A typed-CSS stack in three layers. Each has one job. Keep them strictly separated.
For the units/bundles/foundations map at a glance, see `docs/foundations.md` ("The map").
(Terminology: a Layer-1 unit is a **lexicon**; "primitive" is the older synonym, retired in
favour of "lexicon".)

### Layer 1, css-calipers = typed CSS input LEXICONS only

- THE RULE (absolute): ALL typed CSS input VALUES go in calipers, FULL STOP, regardless
  of how rich the value's surface is. That includes `color`, `m`, `i`, `f`, `r`. The
  ONLY test is "is it a typed input value?" If yes, it belongs in calipers. Colour's
  size and complexity (parse, modify, format escalation, custom formats) is NOT a reason
  to question it, that is all the value's own surface, exactly like `m`'s units and
  arithmetic. Do not re-litigate whether colour belongs here; it does.
- Mission: fill the gap where `csstype` is lacking, typed, build-time-validated CSS
  input VALUES. It MUST be usable STANDALONE, by someone who wants only typed CSS
  inputs and no helpers at all.
- THE THESIS (why a lexicon exists, absolute): TypeScript cannot validate a numeric bound at the
  type level (there is no `50 > 10` type operation; tuple-arithmetic tricks die on floats, negatives,
  large ranges, and computed values). A lexicon RUNS JS to do that check, then BRANDS the result so
  TS enforces the proof at every boundary: an unproven value cannot enter a bounded slot. JS
  validates what TS can't; TS enforces the outcome. This is the whole "typed input,
  build-time-validated" promise and the reason calipers exists. Author-time magnitude feedback for
  literals is an OPT-IN edge tool (an in-package ESLint rule), never the core. See
  `docs/foundations.md` ("Why the lexicon exists").
- Contains: the lexicons and the machinery they need, and nothing else. `m()`
  measurements, `r()` ratios, `i()` integers, `f()` floats, `color()` (the colour
  VALUE lexicon; its factory `createColor` carries the FULL colour config — formats, output,
  strictness, transparent — so colour is config-driven like every lexicon and needs NO book), plus the hardening,
  refinement, and factory support those lexicons require.
- MUST NOT contain: any helper, any book, any composed concern, or the `publishBook`
  / self-publish engine. No book code lives in calipers, ever.
- SEPARATE PACKAGES (the unit model): each lexicon is installable as its OWN npm package
  (`@css-bookends/measurement`, `/ratio`, `/integer`, `/float`, and the colour lexicon), so a
  consumer installs only what they want, e.g. measurement without colour and its `culori`
  dependency (colour + culori arrive ONLY with the colour lexicon package). These are
  PUBLISH-TIME SLICES built from the single `lexicons/calipers/src` source: there is NO shared
  `@css-bookends/core` package, no files move out of calipers, and no slice depends on another
  `@css-bookends/*` slice (each is self-contained, so no cross-package cycles). `css-calipers`
  is the BUNDLE (the "codex"): the everything-slice (entry `.`, the whole source) that owns
  `createCalipersBundle`. This mirrors the books + compendium model in Layer 2: per-unit
  packages + a bundle. `docs/calipers-split.md` is authoritative on the split. (Supersedes the
  earlier one-package + subpath-exports design, and an intermediate shared-`core` idea.)

### Layer 2, css-bookends = the helpers (books) that consume the lexicons

- Mission: helpers built ON TOP of calipers lexicons, to turn typed inputs into
  something useful. CSS-Bookends is the helper layer.
- EVERY helper is a book. Per-property helpers (opacity, zIndex, fontWeight, ...) and
  composed helpers (borders, shadows, margin, padding, ...) are ALL Layer-2 books
  here. A helper NEVER lives in calipers.
- The compendium (`packages/compendium`) is the full bundle: it always re-exports every
  active book (the full "bookends"). Gilding is the output-edge finisher (browser-compat
  post-processing). (The platemaker is NOT part of Layer 2, see below: it is a
  calipers-adjacent input adapter in the `css-calipers` org that feeds Layer 1.)

### Layer 3, css-squire (TBD) = the opinionated framework on top

- An opinionated layer built on the steady calipers + bookends foundation, adaptable
  per project. In theory you could rebuild Tailwind or Bootstrap on top of it.
- Not built yet (TBD). Nothing depends on it.

## Direction of consumption (one-way)

- Books consume calipers; calipers never depends on a book or on `publishBook`. Squire
  builds on calipers + bookends; nothing in the lower layers depends on Squire.
- Design tokens flow IN through the platemaker (a calipers-adjacent input adapter in the
  `css-calipers` org that onion-wraps style-dictionary): tokens -> calipers lexicons -> books.
  The platemaker consumes the tokens; calipers itself stays token-unaware.

## css-calipers positioning (README, docs, all public copy)

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
  MIRROR presents itself; per "Source of truth" below, standalone NEVER outranks a bookends need.)

## Source of truth: css-bookends drives; the standalone calipers repo MIRRORS (absolute)

- This monorepo (css-bookends) is the SOURCE OF TRUTH for all calipers code, authored here
  under `lexicons/calipers/`. The standalone `slafleche/css-calipers` repo is a DOWNSTREAM
  MIRROR (the push-out target of `mirror.sh`), never where design decisions are made.
- The mirror MUST keep functioning as a self-contained standalone library, but that is a
  property we PRESERVE downstream, not a driver. When a bookends need conflicts with the
  mirror's standalone framing, BOOKENDS WINS. The "calipers reads as complete / standalone"
  positioning rule governs how the MIRROR presents itself; it NEVER outranks what bookends
  requires.
- Practical order: design and change calipers HERE, for bookends, first; THEN verify the
  mirror still publishes cleanly as a standalone. The standalone check is a downstream gate,
  not a veto on the design.

## css-bookends positioning (README, docs, public copy)

- The dream, in one line: TYPED INPUT and TYPED OUTPUT with a LOOSE MIDDLE. Typed CSS
  input values (calipers) go in, a typed `.css()` output that satisfies csstype comes
  out, and the middle, composing helpers and books, stays flexible and ergonomic. Type
  safety is anchored at the two ends; you are not forced to type every intermediate
  step. That is the whole appeal of the helper layer.
- Bookends is the helper layer that turns those typed inputs into something useful;
  emphasize the typed-ends, loose-middle framing as its reason to exist.

## The unit + bundle model (both layers, absolute)

Both layers obey ONE model. A **unit** is the atom (a calipers LEXICON in Layer 1, a
bookends BOOK in Layer 2); every unit is its own npm package exposing a factory. A **bundle**
package aggregates every unit of a layer and carries a global config. calipers' bundle is the
`codex` (`css-calipers`); bookends' bundle is the `compendium`. Learn it once, it applies to
both. Three cross-cutting patterns follow. (See `docs/foundations.md` "The map" for the
lexicon/book × codex/compendium grid and the foundation→family model, e.g. `spacing`.)

### Pattern 1: factory-first (the override seam)

- Every unit's REAL, configurable path is its FACTORY: a book's `publishBook<Name>()`; a
  lexicon's `create<Name>` (`createCalipers` / `createColor`); the bundle's
  `publishCompendium()` / `createCalipersBundle()`. Consume the factory, never a pre-made
  instance. It is the override seam (rewrite or wrap any step onion-style, swap internals, with
  zero call-site changes; minimal blast radius since you bind once; independent multi-instances
  with no global state to fight). See `AGENTS.md` for the full why; document it in READMEs too.
- **Encourage the factory.** It is the path we WANT consumers on, with the lazy defaults below
  as the clean zero-config escape.
- **Composed-book exception (a DOCUMENTED namespace class).** A closed set of books are
  multi-function utility namespaces, not single value->CSS manuscripts, so they expose NO
  `publishBook<Name>` factory: `shadows`, `positioning`, `supports-fallback`, `backdrop-filter`,
  `transforms`. Their surface is the namespace of pure functions; they ship NO bound instance.
  NO book ships a bound default. Everything else is a `publishBook<Name>` factory, no instance.

### Pattern 2: output shape is a config choice (`format: 'object' | 'string'`)

- Every book's factory config takes `format: 'object' | 'string'`. `'object'` -> a
  property-keyed style object (`{ opacity: '0.5' }`, `{ marginTop: … }`); `'string'` -> the
  bare value (`'0.5'`). Global DEFAULT is `'object'`.
- Reference implementation is spacing (margin/padding): `SpacingConfig.format`, switched in
  `lexicons/spacing/src/render.ts`. The book's output step MUST receive `cfg` and switch on
  `format` (borders historically dropped `cfg` and ignored its config — that is the bug shape
  to avoid). Multi-property books ALSO keep their decomposition axis (longhand/shorthand;
  long/line/short); per-property books keep `.value()` for the raw scalar.

### Output terminal: always `.css()` (absolute)

Every helper (lexicon or book) renders its final CSS string through a SINGLE `.css()`
terminal; universal, not per-helper. (Distinct from Pattern 2's output SHAPE.)

- `.css()` is the ONLY renderer; no method returns a rendered string per variant (no
  `.hex(): string`, `.toLong(): string`). `.css()` itself takes NO argument.
- Variants are TYPED objects, never magic strings: a book exports a named preset namespace
  (`colorFormats.hex`, `borderFormats.long`) as a discriminated union. The default variant is
  chosen by factory config (`output: colorFormats.hex`).
- Pick a one-off variant ONLY via a selector that returns the navigable result (it does NOT
  render), then finish with `.css()`: `color(x).hex().css()`, or `.formatAs(descriptor).css()`
  for a custom/list. The configured default wins when no override is given; the chosen variant
  persists through later modifications.

### Pattern 3: everything is config-driven, resolved by a three-tier cascade

**First principle: everything is config-driven.** A behaviour that could reasonably vary is a config
OPTION (an explicit, enumerated value with a sensible default), never a hardcoded decision. When the
design forces a "should it do X or Y?" choice, it is a config, not a baked-in branch. Examples:
`format: 'object' | 'string'`, `outOfRange: 'throw' | 'clamp'`, the hardening reaction
`'ignore' | 'warn' | 'fail'`. Every such option resolves by the three-tier cascade:

- A bundle factory takes ONE config object shaped `{ global?: <shared options>, <unitKey>?:
  <that unit's own config>, … }`: a `global` slot of shared options, plus one optional key per
  unit matching its name. Each unit resolves every setting in order: `its own keyed config` ->
  `the bundle's global` (where that option applies to the unit) -> `built-in default`.
- Set a value once in `global` and every applicable unit inherits it; a unit's own key
  overrides. Both bundle factories (`publishCompendium`, `createCalipersBundle`) implement the
  `global` slot + this cascade.
- **Same pattern all the way down; mirror `src/bundle.ts`.** Every grouping is the SAME
  bundle-factory shape, recursively: a lexicon family (e.g. `scalar` = integer/float/ratio), the
  codex, the compendium. A sub-factory can itself be a bundle (the codex composes a family bundle
  exactly as it composes a lexicon factory). `createCalipersBundle` in
  `lexicons/calipers/src/bundle.ts` is the ONE canonical implementation. Before designing or
  changing ANY factory, bundle, or NEW grouping / family factory, invoke the `config-cascade` +
  `smart-factory` skills and MIRROR `src/bundle.ts`; never design a bundle shape from memory. A
  grouping that does not take `global` and cascade is wrong.
- **A book self-instantiates its calipers dependency; it never requires a calipers config.** If a
  book needs a calipers lexicon configured a certain way, it builds its OWN calipers instance
  via the factory (`createCalipers` / `createColor`) internally, with the config it needs. It
  never asks the consumer to thread a calipers config through, and never hard-depends on a shared
  instance. This decouples books from calipers' config surface and shrinks the config a consumer
  supplies. (The compendium `calipers` slot configures the calipers LAYER used directly through
  the bundle; it is not a back-channel for a book's internal calipers needs.)

### Constraints, brands, and seal (the two systems)

A numeric lexicon's restrictions are TWO orthogonal systems, and every numeric lexicon (`i`, `f`,
`m`, `r`) gets BOTH:

- **System A, brands** (compile-time proof): the refinement quartet stamps a phantom brand
  (`InRange<0,50>`, `NonNegative`) into the type on success. Additive, dropped by arithmetic. This
  is the editor feedback (see THE THESIS above).
- **System B, the runtime bound** (stored `min`/`max`, `.constraints()`): carried through arithmetic,
  enforced by the `hardening` reaction. The data you clone and seal.

Surface: **bounded builders mint branded values** (`createInteger({ min, max })` -> `InRange<min,max>`);
**`clone(patch?)`** is a partial-patch copy that respects seals; **`sealed` is per boundary edge**
(config `sealedMin` / `sealedMax` / `sealedRange`, methods `sealMin()` / `sealMax()` / `sealRange()`).

- **`sealed` is CONTROL, not prevention.** A sealed edge is fixed against `clone`, but minting a
  fresh value from the number (`i(v.value(), { min, max })`) is always allowed and DOCUMENTED. A team
  that wants "sealed means sealed" adds the in-package ESLint rule at its edge (bookends: typed core,
  opt-in edge enforcement).
- **Terminology (absolute)**: the bound-lock is `sealed`, NEVER `immutable` (the value already is)
  and NEVER `hardening` (which stays the `'ignore' | 'warn' | 'fail'` reaction). The bound is
  `constraints`. Full model + the two-systems table in `docs/foundations.md`.

### Lazy / bound defaults (the zero-config path)

The lazy re-export is a convenience ON TOP of the factory, never a replacement (config still
goes through the factory). Each bundle ships its factory called at defaults, re-exported:

- calipers: `codex` DEFAULT-exports `createCalipersBundle` AND named-exports the full helper
  set bound at defaults (`m` / `r` / `i` / `f` / `color` + the factories).
- bookends: the compendium's main entry is `publishCompendium` (the configurable path); the
  bound-at-defaults bundle is the `@css-bookends/compendium/defaults` SUBPATH, re-exporting
  every book + lexicon by name. (`compendium` REPLACED the old `shelf` / `publishShelf`.)

## Rollout and commit priority (absolute)

Roll changes out — and commit them — in priority order: **spec → enforcement → foundational →
leaves → bookends**.

- **Spec first.** Document the target (these rules / `docs/` / skills) BEFORE any code, per
  test-first, and land it as its OWN commit once the user approves. Code never leads the spec.
- **Then code, foundational → leaves.** The shared machinery everything depends on (the core, the
  error / hardening infra, the bundle / cascade) before the individual lexicons / units that ride
  on it; the bookends layer last.
- **Descend when a step needs a lower level.** If a batch surfaces a deeper dependency, descend to
  that level, complete and commit it, then bump back UP and continue the cycle.
- Keep each commit green and reviewable; do not mix layers in one pile.

## Test-first, always (absolute)

When adding or changing behaviour that needs tests, write the tests FIRST and confirm
they genuinely FAIL against the current code before writing any implementation. The
failing test is the spec.

- NEVER use `it.skip` / `it.todo` / `xit`, or an always-passing assertion as a stand-in.
  A test that never fails proves nothing.
- If you must stub a test before its real assertion exists, make it FAIL on purpose
  (e.g. `expect.fail('not implemented')` or asserting `false`) so it stays RED and
  visible. A deliberately-failing stub is fine; a skipped or todo'd one is not.
- Report test status ACCURATELY: if anything is red (including a deliberate failing
  stub), say so plainly. NEVER report a suite as green, passing, or done while any test
  is failing.
- Confirm the red by running the test (or capturing its failing output) BEFORE writing
  the implementation.
- If the change is partly type-level (e.g. a widened signature that already works at
  runtime via coercion, so a runtime test passes regardless), the failing-first test
  MUST be a TYPE test (`tsd`) that does NOT compile against the old types. A runtime test
  that is green from the start does not validate a type-level change.
- Only once the test is truly red do you implement to make it green.

## No helpers in calipers (the css-values legacy is already removed)

- The per-property helpers now live in the BOOKS layer: the shared `@css-bookends/css-value-core`
  engine plus a per-property book package each (opacity, zIndex, fontWeight, …). That is their
  permanent home.
- The old `lexicons/calipers/src/css-values/` residue has ALREADY been removed; calipers keeps only
  the value lexicons. Do NOT add helpers to calipers, and do not present css-values as a calipers
  feature in its README/docs.
