# CSS-Bookends backlog

The single list of outstanding work. Reorganised around the **next css-calipers beta**:
the checklists below are scoped to **Layer 1 lexicons only** (`m` / `r` / `i` / `f` / colour +
the corpus bundle). Books, compendium, and typesetter are OUT of scope for the beta and live in
the "Deferred" tail at the bottom, kept intact so nothing is lost.

**Release model (locked 2026-07-09):** the new work (hardening, cascade, unified value surface,
colour, and the split) stays on the `beta` tag; `latest` stays `1.0.0`. It does NOT graduate by
fiat — it earns "out of beta" only by being **battle-tested by building the books on top** (books
are the dogfood that surfaces bugs). The graduation VERSION (1.1 vs a full 2.0) and TIMING are
sized to scope and decided once it's proven, NOT now. The user pushes / publishes (they are in
the loop; the git-guard blocks the assistant regardless).

**Source of truth for the target shape:** `docs/foundations.md` (canonical lexicon from `m()`,
canonical book from `borders`, the "The map" topology, locked value-surface + validation
decisions). Architecture rules live in `.claude/CLAUDE.md` and `AGENTS.md`. Per-lexicon detail:
`lexicons/calipers/backlog.typedInputs.md`.

> ▶ **RESUME HERE (next css-calipers beta).** §A (verify current-state) is DONE. **Safety net,
> mostly in place (2026-07-09):** added the regression tests the split needs — exhaustive unit
> round-trip (`test:units`, 62), direct `createInteger`/`createFloat` (`test:scalar-factories`),
> and the bundle `color`-slot forwarding (in `test:corpus`) — plus examples for the colour format
> selectors, advanced modify (blend/ensureContrast/grayscale/invert/clone), the bundle colour
> slot, and the colour-free `/measurements` subpath. Full suite green. Optional net still open:
> ratio overload edge cases, construction-time hardening `warn`/`ignore`, error-config accessors.
> **NEXT: §B**, the per-lexicon package split (`@css-bookends/core` + `/measurement`, `/ratio`,
> `/integer`, `/float`, `/color`, with `css-calipers` becoming the corpus bundle) against that net.
> Then §C–§F. §G "release mechanics" means publishing the next BETA (not a `latest` promotion —
> that waits on books battle-testing). Everything below "Deferred" is out of scope for the beta.
> Published state: `css-calipers` `beta` = `1.1.0-beta.0`, `latest` = `1.0.0`.

---

## Status — what is already real (context, not outstanding)

- All ~55 `@css-bookends/*` packages published on npm `@beta`. `css-calipers`: `latest` **1.0.0**,
  `beta` **1.1.0-beta.0**.
- **Landed in the beta** (commit `44957df` + current tree):
  - Hardening, config cascade, and the unified value surface across the primitives.
  - Legacy `css-values` fully removed from calipers (the per-property helpers are Layer-2 books now).
  - Colour folded in as a first-class primitive: modification gaps filled, colour back in the
    lint / typecheck / test suite (the old `//temp-exclude` is gone).
  - Subpath exports already exist INSIDE the single package: `./measurements`, `./ratio`,
    `./integer`, `./float`, `./color`, `./corpus`, `./units`, `./factory`.
  - `corpus.ts` / `createCalipersBundle` present; `default.ts` single-construction path present.

The remaining 1.1 work is the **package split** (turning those subpaths into real per-primitive
packages), final primitive conformance, colour loose ends, docs, and release mechanics.

---

# css-calipers 1.1 — release checklists

## A. Verify current-state (do first, before building)  ✅ DONE (2026-07-09)
Recent commits CLAIM several conformance items are done; confirmed live in source + green suite.
- [x] Run the full calipers suite green: `pnpm --filter @css-bookends/css-calipers test`
      (build + core + refinement + ratio + integer + float + hardening + corpus + value-surface +
      factory + subpaths + color + audit + dist + types + tsc + lint + internal). All green
      (core 61, color 488, value-surface 15, corpus 11, dist CJS/ESM, tsd, tsc, lint, internal 12).
- [x] Confirmed the unified value accessor (`.value()` + `.unit()`) is live on measurement
      (`createCoreApi.ts:112,116`), integer (`integer.ts:104,108`), float (`float.ts:100,104`),
      with `.getValue()` / `.getUnit()` kept as deprecated aliases on measurement
      (`createCoreApi.ts:120,124`). Ratio / colour keep their own natural surfaces
      (numerator/denominator; channels) and pass `test:value-surface` (3 files).
- [x] Confirmed `m()` accepts `number | i | f` inputs — `core.ts:405` overloads take
      `value: Scalar`, `Scalar = number | IInteger | IFloat` coerced by `toNumber` (`scalar.ts`).
- [x] Confirmed `.toTypedValue()` (returns matching `i`/`f`) + `.isInt()` / `.isFloat()` exist on the
      value surface: measurement (`createCoreApi.ts:132,136,140`), integer (`integer.ts:33-35,120-128`),
      float (`float.ts:34-36,116-124`). Covered by `tests/runtime/value-surface/typed-value.src.test.ts`.

## B. Packaging split — per-primitive packages + corpus bundle  ← THE 1.1 GATE
Turn the in-package subpaths into real npm packages on a shared core. This is the largest chunk.
- [ ] New `@css-bookends/core`: shared internals only — `scalar`, `toPlainDecimal`, measurement
      infra, errors, `unitDefinitions`, the factory. No primitive surface of its own.
- [ ] `@css-bookends/measurement` (+ units) on `core`.
- [ ] `@css-bookends/integer` on `core`.
- [ ] `@css-bookends/float` on `core`.
- [ ] `@css-bookends/ratio` on `core` (+ deps on `integer` / `float`).
- [ ] `@css-bookends/color` on `core` (Layer-1 primitive; fold in the thin colour wrapper that only
      re-exports calipers colour; `culori` dependency lives ONLY here).
- [ ] `css-calipers` becomes the **corpus BUNDLE**: depends on + re-exports every primitive package,
      owns `createCalipersBundle` + the default bound instance. `m()` v1 stays on `latest` 1.0.0.
- [ ] Preserve the existing public surface: every current root export and subpath keeps resolving
      (add the api-surface + subpaths tests to the split so nothing regresses).
- [ ] Each new package: standard dual CJS/ESM build, eslint, tests, README, `files` includes README.
      (Use the `scaffold-package` skill.)

## C. Corpus bundle + config cascade (calipers side only)
- [ ] `createCalipersBundle` config shape = `{ global?, measurement?, ratio?, integer?, float?,
      color? }`; each setting resolves **own key -> bundle `global` -> built-in default**.
- [ ] Keep the lazy defaults path: `corpus` bound at defaults + the named default helpers
      (`m` / `r` / `i` / `f` / `color` + factories) exported from the root.
- [ ] Confirm the cascade is covered by `test:corpus` + a tsd test; add cases if thin.
      (Compendium-side cascade is Layer 2 — deferred.)

## D. Colour primitive — loose ends
- [ ] `./color` subpath (soon `@css-bookends/color`): the split makes it a real, independently
      installable package, resolving the "emitted but re-exported from root under classic Node
      resolution" note in `backlog.typedInputs.md`.
- [ ] Re-evaluate the deferred colour-doc gaps once colour ships as its own package: `omitOpaqueAlpha`,
      `strictness`, `ColorObject`, `brighten` / `clone`, out-of-gamut behaviour.
- [ ] Decide the product-default colour format priority and make it explicit (hex-first vs rgba).
      (The 3 stale `rgba(...)` red tests are in **books/shadows + compendium**, so they are a Layer-2
      cleanup, tracked under Deferred — but the DECISION on the default lives here.)

## E. Optional polish — better runtime errors (from `backlog.betterErrors.md`)
- [ ] Structured, context-labelled runtime errors when measurement / media inputs are undefined or
      invalid (e.g. `subtract` on undefined), on by default with an opt-out, minimal hot-path overhead.
      Fold into the hardening reaction config (`'ignore' | 'warn' | 'fail'`) if it fits. Optional for 1.1.

## F. Docs / READMEs (calipers packages only)
- [ ] A README for `@css-bookends/core` and each per-primitive package, plus an updated corpus README.
      Document the `createCalipersBundle` config + cascade and the standalone-usable framing (calipers
      reads complete on its own; the bookends pointer is secondary). Keep it small; link `docs/` for depth.
- [ ] Ensure every calipers package `files` array includes `"README.md"` (calipers root already does).
- [ ] Reconcile stale calipers docs after the split: `CHANGELOG.md` (currently shows a stale `0.15.0`),
      `surface.md`, `README_MEASUREMENT.md`, `VISION.md` roadmap.

## G. Release mechanics (1.1.0-beta.0 -> 1.1.0)
- [ ] Changesets for the split (new packages at `0.x` `@beta`; `css-calipers` bump beta -> `1.1.0`).
- [ ] Build all, publish the new primitive packages + core `@beta`, promote `css-calipers` to `1.1.0`
      on `latest` once green. (User-run git / publish.)
- [ ] Standalone `css-calipers` git mirror -> `slafleche/css-calipers` (user-run, git only; `mirror.sh`).

---

# Deferred — NOT part of calipers 1.1

Kept intact for the paper trail. These are Layer-2 (books / compendium) or later-layer concerns.

## Layer 2 — books (conform to the `borders` gold standard)
- [ ] Navigable result surface on every book: drill-in nodes with `.css()` at each, leaves are
      lexicon values. Per-property: `result.css()`, `result.value` (typed `i`/`f`), `result.style.css()`.
- [ ] Wire `format: 'object' | 'string'` (default `'object'`) into every book config + output step.
- [ ] Fix the borders bug: its `output` step drops `cfg`, so `output: 'long'|'line'|'short'` is
      ignored. Wire `cfg` through; implement `line` / `short`.
- [ ] Per-property validation per the CSS spec: clamp where the spec clamps (opacity, calc-context),
      otherwise fail fast.
- [ ] Bring the vibe-coded books to the borders structure (parse-don't-validate input -> canonical
      store; navigable result; `design.md`; comprehensive tests). The 5 composed-book namespaces
      (shadows / positioning / supports-fallback / backdrop-filter / transforms) stay namespaces.
- [ ] **3 stale `rgba(...)` red tests** (`books/shadows` x1, `packages/compendium` x2): flip to the
      actual hex-first output, or set those books' colour config to `output: colorFormats.rgba`, per
      the colour default decided in D above.
- [ ] Full ~600-entry MDN property sweep for belt-and-suspenders per-property coverage (books, not
      calipers). Plus the deferred per-property grammars: border-image / mask-border multipliers,
      the stroke tier, `readingOrder` (blocked on csstype gaining `Property.ReadingOrder`).

## Bundles — compendium-side cascade (Layer 2)
- [ ] `publishCompendium` config = `{ global?, <book keys>…, calipers?: CorpusConfig }`, forwarding
      the `calipers` config into `createCalipersBundle` and merging its own `global` under `corpus.global`.
- [ ] Keep the `@css-bookends/compendium/defaults` bound-at-defaults subpath.

## Misc / later
- [ ] Deprecate `@css-bookends/media-queries` on npm (live at `0.1.1` on `latest`, frozen/legacy). User-run.
- [ ] css-value-core coverage gaps + convert remaining `todo` stubs + add tsd interop type tests —
      re-evaluate when the per-property books are conformed.

## typesetter — spec it as an onion wrapper around style-dictionary (no code yet)
The bespoke typesetter + its token docs were deleted (junk, 2026-06-29) and stay deleted. The future
typesetter WRAPS **style-dictionary** (swappable core) with its own factory + props, like `gilding`
wraps Lightning CSS. NEXT STEP IS A SPEC, not code.
- [ ] Write `docs/typesetter-spec.md`: how style-dictionary works (tokens -> transforms -> formats),
      its DTCG support, how the typesetter onion-wraps it (`createTypesetter(config)`: evergreen config +
      swappable `core` defaulting to a style-dictionary adapter + `coreOptions`), the seam feeding
      calipers Layer-1 primitives, and the open trade-offs.
- [ ] (LATER, after the user has an opinion) implement per the spec.
- [ ] Deprecate the published `@css-bookends/typesetter@0.1.0` on npm (`npm deprecate`, user-run).
- [ ] Scrub remaining `typesetter` mentions in `ARCHITECTURE.md` / READMEs / `AGENTS.md` / `.claude/CLAUDE.md`.
