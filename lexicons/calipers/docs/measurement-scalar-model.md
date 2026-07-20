# The measurement + scalar config model

> **Decision record, 2026-07-20.** The target model for how configuration is split across `m`, `u`,
> `i`, and `f`. This is the TARGET: code reconciles to this doc, not the other way round. It supersedes
> the old "remove hardening from `m`" task and will be woven into `scalars.md`, `measurements.md`,
> `foundations.md`, and the `CLAUDE.md` / `AGENTS.md` architecture rules during the refactor.

**One line:** all numeric checking lives on `i` / `f`; `m` and `u` carry none. You either opt in to a
checked system (`i` / `f`), or you don't (`u`, plain math).

## The decisions

### `m` (and its unit helpers) are pure containers
A measurement is a scalar (`u` / `i` / `f`) plus a unit, and the interface that unites them. It holds
NO numeric config and nothing cascades into it. `m`'s options are only `{ unit?, context? }`. A stray
`min` / `max` / `modifier` is not part of `m`'s type; `m` never looks at numeric config.

A bounded or modified measurement is built by handing `m` a configured scalar:
`m(i(700, { min: 1, max: 900 }), 'px')`. Plain `m(5)` is an unbounded `u`.

### `u` is the "didn't opt in" scalar
`u` is the internal, unspecified finite number. It is what `m` wraps a plain number in. Its whole
purpose is to be neutral, so it carries no typed-input machinery.

- **Keeps:** the finiteness guard (never `NaN` / `Infinity`, at construction and on every derived
  value); one-shot math (`add` / `subtract` / `multiply` / `divide`, `clamp(min, max)`, `round` /
  `floor` / `ceil`, `negation`, `absolute`); introspection (`value` / `valueOf` / `css` / `kind` /
  `isInt` / `isFloat`, `constraints()` returning `{}`); `withValue` / `clone`; and the error plumbing it
  needs to live inside `m` (`errorStore`, `wrapperLabel`, `context`).
- **Drops:** the stored bound (`min` / `max`), the modifier, and the hardening reaction. With no bound
  there is no breach, so hardening is moot.

`clamp` / `round` / `floor` / `ceil` stay because they are one-shot computations on explicit arguments,
not a stored, re-validating bound.

### `i` / `f` are the opt-in systems
All checking lives here: the stored bound, the hardening reaction, the modifier, integer-ness, and the
compile-time brands (System A). If you care about any of it, you reach for `i` / `f`.

### The two-level scalar base
The class hierarchy encodes the opt-in model so a bound on `u` is impossible, not merely discouraged:

- **Bare base** (`u` extends this): value + finiteness, error plumbing, one-shot math, introspection,
  `withValue` / `clone` / `embedUnder`, and the abstract kind hooks (`label`, `validateInput`,
  `rebuildWith`).
- **Checked base** (extends the bare base; `i` / `f` extend it): adds the stored bound + real
  `constraints()`, the hardening reaction, the modifier, the integer-input diagnostic, the
  refinement / brand hooks, and the branded `clamp` override.

The intake pipeline (`modify -> validate(kind) -> enforce-bound`) is not split by `super()` layering:
the checked constructor applies the modifier inline in its `super(...)` argument, the bare base runs
finiteness + `validateInput` + store, and the checked body enforces the bound after `super()`. So `u`'s
`super()` just does the plain thing, and order is preserved.

### A measurement gets config only by ingestion
Because `m` holds a scalar and delegates, an ingested `i` / `f`'s own config governs through `m`:
`m(i(8, { min: 0, max: 10, hardening: 'warn' })).multiply(2)` warns because the `i` says so. That is
"`m` ingests the hardening". A plain-number measurement (a `u`) has no bound, so it never reacts.

### Unit helpers = like `m`, for now
`mDeg`, `mPx`, etc. are `m` with a preset unit and are config-free for now: `mDeg(numberOrScalar)`
attaches `deg`, nothing else. `UnitHelperConfig` goes away. Whether a helper may later carry a preset
that lands on the scalar is a parked open question (below).

## Why

- **Opt in, or you don't.** `u` is unspecified by definition; hanging config on it defeated its
  purpose. The split makes "plain number" and "checked value" two clearly different things.
- **Self-enforcing.** The two-level base makes it structurally impossible to give `u` a bound, rather
  than relying on a narrowed options type to hide it.
- **It untangles `clamp` branding.** The bare base has a plain `clamp`; the checked base overrides with
  the branded one. That replaces the earlier "base method vs subclass branded method" workaround.

## Consequences (what changes in code)

- `MeasurementCreateOptions` loses `min` / `max` / `modifier`; `buildMeasurement` builds a plain `u`
  with only error plumbing. The `m`-level set-once guard (`CALIPERS_E_CONSTRAINT` on a direct bound)
  disappears; there are no numeric options left to conflict.
- Hardening leaves `createCalipers` / `createCoreApi` (the `hardening` param) and the bundle:
  `CalipersBundleConfig.measurement` loses `hardening`, and `global.hardening` no longer reaches
  measurements (it still governs `integer` / `float` / `ratio`).
- The `config-cascade` skill and `config-flow.md` move their worked cascade example from `m` to the
  scalar family (`i` / `f` / `ratio`).
- Roughly a third of the 3b.1 / 3b.2 construction logic comes back out (the bounded-`u` path, `m`'s
  numeric options, the plain-number hardening path). What survives: the embed itself (`m` holds a
  scalar and delegates), ingestion of a passed `i` / `f`, and the `wrapperLabel` / `embedUnder` error
  naming. This is done as forward commits, not a revert.
- `ratio` is unaffected: it already wraps bare operands as `u(value)` with no options.
- Tests / docs: remove the `m` bound / modifier / hardening-cascade tests, the unit-helper config
  tests, and `u`'s bound / modifier tests; migrate bounded-measurement examples to `m(i / f(...))`.

## Parked open question: configured unit helpers

May a unit helper carry a preset that lands on the scalar it builds (so `mDeg` could preset, say, a
0..360 bound onto the `i` / `f` it wraps)? If so, two hard sub-questions follow, both deferred:

1. **Plain number + configured helper:** which scalar does `mDeg(45)` build, an `f` by default, or does
   the preset name the type?
2. **Pre-built scalar + configured helper:** does the helper's config merge into a passed
   `i` / `f` (which reopens config-merging, against the set-once / mint-fresh rule), or is a passed
   scalar always taken as-is?

Deferred because it drags the set-once rule back open. For now, helpers are config-free (like `m`).

## Supersedes

Absorbs the earlier "remove hardening from `m` entirely" task: that is now one facet of this larger,
single model rather than its own step.
