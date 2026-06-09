# CSS-Bookends TODO

Canonical task list. We always work off this file. Check items as they land.
Detail lives in `gameplan.md`; structure in `MONOREPO_PLAN.md`.

## Step 1: CSS-Calipers parity in CSS-Bookends (current)

Goal: `lexicons/calipers` behaves identically to standalone calipers for
measurement, fully green and publishable, with media queries already split out.
Going live on the pure package avoids a publish-then-break later.

### Layout
- [ ] Set `pnpm-workspace.yaml` to `lexicons/*`, `books/*`, `packages/*`
- [ ] Remove the old subtree copy at `packages/calipers`

### Bring calipers in as a lexicon (`lexicons/calipers`, npm `css-calipers`)
- [ ] Clean copy of calipers source (exclude `.git`, `node_modules`, `dist`, `coverage`)
- [ ] Drop npm lockfile (`package-lock.json`)
- [ ] Drop release machinery: `scripts/release.mjs`, `scripts/pre-commit.sh`, `RELEASING.md`
- [ ] Strip `release`, `release:dry`, `prepublishOnly` scripts and the `RELEASING.md` entry in `files` from `package.json`
- [ ] Keep `scripts/emit-esm-package.mjs` (build needs it), `ratio`, `units`, `core`

### Split media queries out of calipers
- [ ] Remove `src/mediaQueries/**` from the calipers lexicon
- [ ] Delete `src/internal/createMediaQueriesApi.ts`; strip the `.mediaQueries` namespace from `src/factory.ts`
- [ ] Remove the `./mediaQueries` export, the MQ build/test scripts, `tests/runtime/mediaQueries/**`, and MQ type tests from calipers
- [ ] Trim the media-queries section from the calipers README

### Land media queries as a book (`books/media-queries`, npm `@css-bookends/media-queries`)
- [ ] Move `src/mediaQueries/**` + its tests + `README_MEDIAQUERIES.md` here
- [ ] `package.json`: scoped name, `publishConfig.access = public`, depend on `css-calipers` via `workspace:*`
- [ ] Gets it building and resolving against calipers (0.x experimental, does not block "live")

### Parity gate
- [ ] `pnpm install` regenerates `pnpm-lock.yaml` clean
- [ ] Fix tsconfig path resolution if pnpm self-symlink fights the `css-calipers` path maps
- [ ] `pnpm --filter css-calipers test` green
- [ ] Zero `mediaQueries` references left in `lexicons/calipers`
- [ ] Calipers builds a publishable artifact (cjs + esm + types)

### Wrap
- [ ] Update `MONOREPO_PLAN.md` layout note (`packages/*` -> `lexicons/*` + `books/*`)
- [ ] Stop, leave uncommitted for review (no commit without the trigger word)

## Step 2: Bring the other helpers in from portfolio
- [ ] Port helpers from `portfolio/src/styles/helpers/*.helper.ts` as books/lexicons
- [ ] Decide book vs lexicon per helper (e.g. `spacing` as a lexicon)
- [ ] Bring each helper's tests over with it

## Step 3: Clean-split gate (tests)
- [ ] Prove `css-calipers` extracts with nothing else attached (no inward deps, builds + tests standalone)
- [ ] Dry-run the mirror split; install the output; run its tests

## Step 4: Release CSS-Bookends v0.0 (experimental)
- [ ] Changesets wired; books publish independently
- [ ] First umbrella release tagged 0.x

## Step 5: Mirror CSS-Calipers out and ship v1
- [ ] Publish/mirror workflow mirrors `lexicons/calipers` to `slafleche/css-calipers`
- [ ] New README with the migration note (in `gameplan.md`)
- [ ] Tag and publish `css-calipers` v1
</content>
