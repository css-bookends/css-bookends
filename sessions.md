# Session handoff

A snapshot of where things stand and what's queued, so the next session can pick
up cleanly. Living document.

## Quick orientation

- The active project is **CSS-Bookends**, a pnpm monorepo at
  `/Users/stephane/GitHub/css-bookends`. CSS-Calipers now lives inside it at
  `packages/calipers` (full git history preserved via `git subtree add`).
- Roadmap priority: **CSS-Calipers to 1.0 first**, then spacing (next 1.x
  candidate, needs work), other helpers stay 0.x.
- The single public-identity asset is the npm name `css-calipers` (unscoped).
  All other books publish under the `@css-bookends/*` scope.

## Repo state (as of handoff)

### css-bookends (`/Users/stephane/GitHub/css-bookends`)

- HEAD: `94aebee` (subtree-add of calipers). Recent history:
  `Add 'packages/calipers/' ...`, `Porting over CSS-Calipers code to Book-Ends`
  (scaffold), `Release 0.14.0`, `fixing package-lock.json file`,
  `note about longer term vision`, `loosen Media query checks ...`,
  `Tighten typing checks ...`, `Removed scientific notation support ...`.
- Uncommitted at handoff: `README.md` (user added "Support" section with a
  buy-me-a-coffee link), `.github/FUNDING.yml` staged, `pnpm-lock.yaml` modified
  by `pnpm install` after the subtree add.
- Workspace packages seen by pnpm:
  - `@css-bookends/monorepo@0.0.0` (private root)
  - `css-calipers@0.14.0` (packages/calipers)
  - `@css-bookends/css-bookends@0.0.1` (packages/css-bookends, the placeholder
    that reserves the org name on npm)
- Scaffold present: `pnpm-workspace.yaml`, private root `package.json` with
  `packageManager: pnpm@11.0.9` and Changesets dev dep, `.gitignore`,
  `.changeset/config.json` (`access: public`, `baseBranch: main`),
  `.changeset/README.md`.
- Plan and vision docs at root: `MONOREPO_PLAN.md`, `README.md` with a Vision
  section.
- `pnpm --filter css-calipers test` passes from inside the monorepo (55 + 12 +
  66 runtime tests + dist variants + tsd + tsc + lint, all green).

### css-calipers (`/Users/stephane/GitHub/css-calipers`)

- HEAD: `e2d18b7` (Release 0.14.0). Clean and fully pushed to `origin/main`.
- Uncommitted at handoff: `README.md` (user-edited), `.github/FUNDING.yml`
  untracked.
- CI status: lockfile fix landed; CI passes via npm 10.8.2 on linux. The
  lockfile was regenerated inside a `node:20` Docker container so it contains
  the linux-only `@emnapi/core` and `@emnapi/runtime` nodes that the
  npm-11-on-macOS lockfile was pruning.

### portfolio (`/Users/stephane/GitHub/portfolio`)

- Source for future helper books. All helpers in
  `src/styles/helpers/*.helper.ts`, including:
  `colorWrap` (the colour helper), `borders`, `shadow`, `spacing`,
  `backdropFilter`, `background`, `cardGradient`, `easingCurves`, `fontConfig`,
  `glassy`, `gradients`, `nesting`, `noiseSVG`, `outlines`, `positioning`,
  `supportsFallback`, `transforms`, `typography`, `wordmark`, plus a few small
  utility helpers.
- All are 0.x. None are in `css-calipers`.

## What this session accomplished

### Math core hardening in CSS-Calipers (0.14.0)

- Tightened the typed contract for `add`, `subtract`, `clamp`,
  `measurementMin`/`measurementMax`. They now require the receiver's unit at
  compile time. `paddingBase.add(rotation)` lights up in VS Code with a red
  squiggle, strict mode, no extra config. The fix was switching to method-style
  signatures rather than property-arrow signatures to preserve variance.
- Tightened `equals` / `compare` with overloads: default flags a unit mismatch
  at compile time, while `strict: false` still allows explicit cross-unit
  comparison.
- Strengthened the unit brand: `UnitBrand` is now keyed by a module-private
  `unique symbol`, so the tag cannot be named or forged structurally from
  outside. Only a deliberate `as` cast escapes (and the runtime check still
  catches that).
- Renamed `BrandedMeasurement` to `InscribedMeasurement`. `BrandedMeasurement`
  is kept as a `@deprecated` alias for one release.
- New tests: a type-level matrix (`tests/types/unit-safety.test-d.ts`) and a
  runtime `it.each` matrix (in `core.shared.ts`) covering coupled ops across
  many unit pairs and directions. Also a demo at `demo/unit-mismatch.ts` that
  you can open in VS Code to see the squiggle live.

### Output: scientific notation eliminated from `.css()`

- We explored adding a first-class `ISciNotation` primitive (mirroring
  `IRatio`) for symbolic coefficient/exponent values. After thinking through
  it, this was scrapped. The actual user-facing problem was only that
  `Number.toString()` emits exponential form in two bands (magnitude `>= 1e21`
  and `< 1e-6`).
- The committed fix is a small `toPlainDecimal` formatter inside `css()` that
  expands the exponential digit string to plain decimal. Stored values stay
  plain numbers. Output is always valid CSS, no exponent.
- Runtime tests cover normal values, zero, large magnitudes (`1e21`), tiny
  magnitudes (down to `1e-300`), and negative cases. They assert no `e` ever
  appears in the output string.

### Media queries: loosened the mixed-unit restriction

- `min-width: 320px` with `max-width: 60em` is valid CSS. The library was
  throwing on mismatched units in the min/max width, height, and resolution
  pairs purely because it wanted to do a numeric `min <= max` ordering check.
- `validation.ts` now allows mixed units everywhere, and only runs the ordering
  check when the units actually match. The `assertMatchingUnits` import and
  wiring were removed from this module.
- New tests cover mixed-unit width and resolution acceptance plus same-unit
  ordering still being enforced under throw mode.

### Type-safety audit (which holes remain inherent)

- `equals` / `compare` cross-unit: fixed (overloads, see above).
- Open `IMeasurement` (no unit param): inherent. `IMeasurement<string>` means
  "any unit," so the guard cannot apply. Documented as expected.
- Raw-number extraction: `px.add(em.getValue())` compiles because numbers are
  documented operands. Intentional opt-out; no action.
- Dynamic unit string (`m(5, someString)` widens to `IMeasurement<string>`):
  same root as the open type. Runtime still catches a real mismatch. No action.

### Vision and roadmap docs

- `css-calipers/VISION.md` (in calipers): long-term direction, CSS-Bookends as
  the umbrella, calipers as the measurement layer aiming for 1.0, mediaQueries
  intentionally scoped (no full-spec rewrite for now).
- `css-bookends/MONOREPO_PLAN.md`: pnpm workspaces layout, Changesets,
  naming/access strategy, split-mirror CI, migration steps, gotchas.
- `css-bookends/README.md`: short Vision section above Concepts, framed on the
  "contract a compiler can enforce / strict edges, loose middle, full spec"
  thesis from the blog post.

### David J. Mack reply

- Drafted a warm reply acknowledging his diagnosis (the `add()` signature was
  accepting `IMeasurement<string>` instead of constraining to the receiver's
  unit), confirming the fix lands in 0.14.0, pointing at `VISION.md`, and
  inviting him to contribute. User indicated they would send it.

### Tiny minor dep bumps in CSS-Calipers

- Bumped within-range: `@typescript-eslint/*` to `^8.60`, vitest + coverage-v8
  to `^4.1.7`, `@vanilla-extract/css` to `^1.20.1`, `tsd` to `^0.33.0`.
- Deferred majors: TypeScript 6, ESLint 10, `@types/node` 25.

### CI fix for css-calipers

- The `npm ci` failure on CI was a missing `@emnapi/core`/`@emnapi/runtime`
  pair in `package-lock.json` (Linux-only WASM-fallback optional deps that
  npm prunes when generating the lockfile on macOS). Local `npm ci --dry-run`
  was passing because the dev machine runs npm 11 / node 24 and is more lenient.
- Fix: regenerated `package-lock.json` inside a `node:20` Docker container so
  it carries the exact optional tree CI's npm 10.8.2 expects. CI then went
  green.

### CSS-Bookends monorepo scaffold and calipers import

- pnpm chosen over npm workspaces.
- Scaffold landed: `pnpm-workspace.yaml`, private root with Changesets, `.gitignore`, `.changeset/` config and README.
- The original placeholder package was relocated from the repo root into
  `packages/css-bookends/` so the `@css-bookends/css-bookends` reservation
  survives. Root is now private and never publishes.
- `git subtree add --prefix=packages/calipers /Users/stephane/GitHub/css-calipers main`
  brought CSS-Calipers in with its full commit history. Tests pass under pnpm.

## Decisions locked

- **Monorepo, not polyrepo.** One source of truth.
- **pnpm workspaces.** Sidesteps the npm cross-platform optional-dep lockfile
  pain we hit, plus it is the better tool for many packages.
- **Changesets** for per-package independent versioning and publishing.
- **`css-calipers` stays unscoped on npm.** This protects the existing
  downloads, the npm page, badges, and the David thread. Deliberate exception.
- **All other books publish under `@css-bookends/*`.** They will need
  `"publishConfig": { "access": "public" }` because scoped is private by default
  on npm.
- **Standalone repos are read-only mirrors.** A future `mirror.yml` workflow
  splits each established book out to its own repo (the `slafleche/css-calipers`
  repo continues as the mirror), preserving the URL, stars, issues, and giving
  per-book git tags / GitHub Releases. npm publish stays single-source from the
  monorepo. No double publishes, no two-way sync.
- **Roadmap order:** css-calipers to 1.0 first, then spacing (which needs work)
  to 1.x. Other helpers stay 0.x as they come over from portfolio.
- **`mediaQueries`:** stays useful-if-you-want-it. A full CSS-spec rewrite is
  out of scope. It will eventually extract into its own book
  (`@css-bookends/media-queries`) but not before calipers reaches 1.0.

## Open threads, in priority order

1. **Cleanup in `packages/calipers`:** delete the redundant
   `package-lock.json` (this is now a pnpm workspace, the npm lockfile is dead
   weight). Possibly also delete the calipers-local `RELEASING.md` if the
   release flow moves entirely to Changesets at the root.
2. **CI workflows for css-bookends:**
   - `ci.yml`: install pnpm, run `pnpm -r build && pnpm -r test` on PR and push.
   - `release.yml`: `changesets/action@v1` running `pnpm version` and
     `pnpm release`. Needs `NPM_TOKEN` and `GITHUB_TOKEN` secrets.
   - `mirror.yml`: split-mirror for `packages/calipers` to
     `slafleche/css-calipers` (and any other book that gets a standalone repo).
     Uses `symplify/monorepo-split-github-action@v2.3.0` or `splitsh/lite`.
     Needs a `MIRROR_TOKEN` PAT with push to the target.
4. **Take css-calipers to 1.0:**
   - Create a major changeset for `css-calipers` (`pnpm changeset`, pick
     `major`, write release notes covering: the brand-name rename and
     deprecation, the unit-mismatch type tightening, equals/compare overloads,
     symbol brand, mediaQueries mixed-unit acceptance, `.css()` plain-decimal
     output, dropped scientific notation experiment).
   - Decide whether mediaQueries leaves the calipers package before 1.0 or
     stays for 1.0 and extracts in a `1.x` minor with a deprecation period for
     the `css-calipers/mediaQueries` subpath. Current docs assume it extracts
     after 1.0.
5. **Extract `mediaQueries`** into `packages/media-queries` as
   `@css-bookends/media-queries`. Internal dep on `css-calipers` via
   `workspace:*`. Ship a `css-calipers` release that deprecates the old
   `css-calipers/mediaQueries` subpath.
6. **Begin helper imports from portfolio**, starting with **spacing** (next
   1.x candidate, needs work). Each helper lands at `packages/<book>` and
   publishes as `@css-bookends/<book>`. Bring tests over with each.
7. **Standalone css-calipers repo:** decide whether to leave its current
   contents in place until the mirror workflow first runs (then the mirror
   overwrites `main`), or archive a `pre-monorepo` branch first. Either is
   fine, but worth a deliberate choice before the first mirror run.

## Gotchas to remember

- **Scoped packages publish as private by default.** Every `@css-bookends/*`
  package needs `"publishConfig": { "access": "public" }` or
  `npm publish --access public`. Changesets respects `access: "public"` in its
  config and we already set that.
- **`workspace:*` must be rewritten on publish.** Changesets and pnpm handle
  this automatically. Do not publish with the literal `workspace:*` range.
- **Do not publish the same package from both the monorepo and a mirror.**
  Mirror is git-only.
- **Mirror must stay read-only.** Two-way sync invites pain. Code flows out of
  the monorepo, never back in.
- **Modernize CI Node.** Either node 20 (the calipers CI today) or move
  forward; the npm-lock cross-platform pain is sidestepped under pnpm anyway.
- **Strict git rules apply.** No `git commit` / `push` / `merge` / `rebase` /
  `reset` etc. without the literal trigger word in the user's most recent
  message. Bare "go" or "ok" is not enough.
- **No emdashes in user-facing content.** This applies to README, VISION,
  CHANGELOG, npm descriptions, and the David thread. Conversational replies in
  the assistant turn are fine to use them.

## Key file locations

- Monorepo plan: `css-bookends/MONOREPO_PLAN.md`
- Vision (calipers-local): `css-calipers/VISION.md`
- Calipers (in monorepo): `css-bookends/packages/calipers`
- Calipers (standalone, was the original repo): `css-calipers/` (will become
  the read-only mirror target)
- Blog post the vision is anchored on:
  `cv_stuff/blog/posts/we-still-dont-have-proper-css-frameworks.md`
- Future helper sources: `portfolio/src/styles/helpers/*.helper.ts`
- VS Code squiggle demo: `css-calipers/demo/unit-mismatch.ts` (also present at
  `css-bookends/packages/calipers/demo/unit-mismatch.ts` after the subtree
  add).

## Future skills to spec out

Two harness skills to design later, not to build now. They would automate what
we did by hand in this session.

- **save-session**: capture the current working context into a `sessions.md`
  (or equivalent) handoff doc. Snapshot git state of the relevant repos
  (HEAD, uncommitted files, recent log), the active decisions and open
  threads from the conversation, key file locations, gotchas, and any in-flight
  edits. The output is the kind of long-form handoff this file already is, but
  produced consistently and quickly.
- **restore-session**: at the start of a session, read the saved handoff and
  prime the assistant with it. Should rehydrate the priority order, decisions
  locked, open threads, and where the user left off, so the next turn can pick
  up cleanly without reconstructing context from logs.

Both should be plain, scoped skills (not full agents). The goal is the manual
handoff workflow becoming a one-line command at the start and end of a session.

