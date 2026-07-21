# The calipers split (canonical spec)

The ONE reference for how `css-calipers` is split into installable pieces. If anything about the
split seems ambiguous, this file wins. Read it before touching the split.

## Principle: one source, many slices, any combination

`lexicons/calipers/src` is the **single source of truth** for every lexicon AND all the shared
machinery: **hardening, the restrictions / refinements, `scalar`, the measurement core, units, and
colour all live in calipers and never leave it.** There is **no separate `@css-bookends/core`
source package**, and no files move out of calipers.

The "split" is entirely a **publish-time** concern. From this one source we build **slices**: each
slice is a self-contained bundle produced from a chosen entry point. Because it is one source with
many entry points, **any combination of inclusion is possible** — just `measurement`, just `color`,
just the hardening / restriction tools, or any mix. Each slice bundles its own copy of exactly the
code its entry reaches, and declares only its external npm deps.

## The slices

`csstype` is always an external dep. `culori` is bundled ONLY when the entry reaches colour. No slice
depends on another `@css-bookends/*` package — each is self-contained, so there are **no cross-package
cycles**.

| Published slice | entry (calipers subpath) | bundles (the reachable subgraph) | external deps |
| --------------- | ------------------------ | -------------------------------- | ------------- |
| `@css-bookends/measurement` | `./measurements` | measurement core + units + scalar + hardening + integer/float | `csstype` |
| `@css-bookends/integer` | `./integer` | integer + scalar + hardening | `csstype` |
| `@css-bookends/float` | `./float` | float + integer + scalar + hardening | `csstype` |
| `@css-bookends/ratio` | `./ratio` | ratio + integer + float + scalar + hardening | `csstype` |
| `@css-bookends/color` | `./color` | colour + measurement (angle) + scalar + hardening | `csstype`, `culori` |
| `@css-bookends/hardening` | `./hardening` (+ refinements) | the bound / restrictions / refinements (System A brands + System B bound; a breach throws) | (none) |
| **`css-calipers` (the codex)** | `.` (everything) | the whole source | `csstype`, `culori` |

These are the canonical slices; the same principle allows any other entry or combination (e.g. a
measurement + colour slice) by picking a different entry. New entry points are added to calipers'
`exports` map as the slice boundaries.

## What this is NOT

- **Not a source reorganization.** No files move out of `lexicons/calipers/src`. No `@css-bookends/core`
  source package. Hardening and the restrictions stay in calipers.
- **No inter-package dependencies.** A slice never imports another `@css-bookends/*` slice; it bundles
  what it needs. So there are no type cycles to break and no shared-package versioning to manage.
- **The standalone `css-calipers` is untouched.** It stays the full, self-contained library (the mirror
  to `slafleche/css-calipers` is unaffected).

## Install story

- Just measurement: `npm i @css-bookends/measurement` — no `culori` in the graph.
- Just the hardening / restriction tools: `npm i @css-bookends/hardening`.
- Everything: `npm i css-calipers` (or `@css-bookends/css-calipers`) — the codex bundle.
- Anything in between is another slice, built the same way.

## Tooling (how a slice is built)

A bundler (rollup / tsup) runs once per slice:

- **entry** = the calipers subpath for that slice (`src/measurements.ts`, `src/color/index.ts`, …).
- **externals** = `csstype` always, plus `culori` for the colour slice; everything else is bundled in.
- **output** = a self-contained `dist` (CJS + ESM), tree-shaken so e.g. the measurement slice contains
  no colour/`culori` code.
- The slice's `package.json` lists only its external deps and points `main`/`module`/`types`/`exports`
  at its bundled `dist`.

The subpath exports that already exist inside calipers (`./measurements`, `./ratio`, `./integer`,
`./float`, `./color`, `./codex`, `./units`, `./factory`) are the existing slice boundaries; the split
turns each into its own published, self-contained package via this bundling, without moving any source.
