# Measurements: `m()`

> **STATUS: working doc.** Right now this is the CHECKLIST for the "a measurement embeds a scalar"
> refactor. Once the refactor lands, replace the checklist with the reference prose below (updated for
> the embed model). Tick the boxes as each small step lands.

## The refactor, in brief

A measurement becomes literally "a scalar + a unit": it EMBEDS a scalar (`i`/`f`/`u`) as its numeric
core and DELEGATES every numeric op to it, while owning the unit side (unit-safety, CSS rendering,
categories). The number rules (bound, hardening, modifier, integer-ness) then come from the embedded
scalar for free. A plain number embeds a config-neutral `u` (so `m(5)` never inherits an `f` lexicon's
modifier or default). Errors read `m(<subtype>): <specific>`. There is NO m-level modifier (the
modifier is a scalar concern). Config is set once; to change it, mint a fresh value.

Design details, method map, and house-style precedents live in the research write-up; the failing
spec is `tests/runtime/core/measurement-embed.src.test.ts` (6 red delegation/error cases, 2 green
`u`/`f` locks), currently NOT wired into `pnpm test`.

## Checklist (small steps, test-first)

- [x] **1. Expose the scalar's subtype.** A public `kind()` on `ScalarImpl` (returns `'i'`/`'f'`/`'u'`
  from `label()`), declared on `IInteger`/`IFloat`/`IUnspecified`, so a measurement can read it for the
  `m(<subtype>)` error and for `isInt`. *(done 2026-07-20)*
- [ ] **2. Error wrapper label.** Let a scalar's throw carry a caller-supplied wrapper, so a scalar
  embedded in `m` renders `m(<subtype>): <specific>` instead of `<subtype>: <specific>`. Drives the
  measurement-embed ERROR specs.
- [ ] **3. `Measurement` holds `#scalar` + `#unit` and delegates.** Embed the scalar; delegate the
  numeric methods (value/valueOf/constraints/isInt/add/subtract/multiply/divide/clamp/round/floor/
  ceil/clone/…); keep the unit methods (unit/category/css/unit-safe add-subtract-clamp-equals-compare);
  delete the bespoke `#clone` bound logic. The core step, split if it grows.
- [ ] **4. `m()` builds / embeds the scalar.** `m(5)` embeds a neutral `u` (only m's config); `m(i/f)`
  embeds the passed scalar; thread the wrapper label `'m'`. Set-once bound conflict stays.
- [ ] **5. Unit helpers embed a scalar.** `createUnitHelper` / `makeUnitHelperFromDefinition` build and
  embed a scalar, forwarding the helper's bound/modifier to it.
- [ ] **6. Wire + green the spec.** Add a `test:*` script for `measurement-embed.src.test.ts`, make
  every case green, verify full `pnpm test` + compendium tsc, migrate any existing measurement test
  that assumed the old internals.
- [ ] **7. Finalize this doc.** Replace this checklist with the reference below, updated for the embed
  model, and wire the README + example pointers to it.

---

## Target: the finished `m()` reference (DRAFT, finalize after the refactor)

`m()` is calipers' unit-bearing value: a NUMBER plus a UNIT (`8px`, `45deg`, `50%`). It fills the CSS
space that needs a typed number carrying a unit, the counterpart to the unitless scalars (`i`/`f`) and
to ratios (`r`).

### A measurement is a number + a unit

- **The number side** follows the SCALAR model (bounds, hardening, modifier, integer-ness). This doc
  keeps that SHORT; the full story is in [`scalars.md`](./scalars.md).
- **The unit side** is measurement-only: the unit string, unit-safe arithmetic, CSS rendering, and the
  unit's CSS category.

### Constructing

```ts
m(8);                                   // 8px  (px default)
m(45, 'deg');                           // 45deg (unit-string sugar)
m(8, { unit: 'rem', min: 0, max: 10 }); // the options form
mPx(8); mDeg(45); mPercent(50);         // named unit helpers
```

Named helpers come from `makeUnitHelperFromDefinition`, which can bake per-unit config (a bound, a
modifier) into a helper. A plain number embeds a `u`; a typed `m(i(8))` / `m(f(8.5))` embeds that
scalar, so its bound and modifier ride along.

### The number side (short, see [`scalars.md`](./scalars.md))

A bound (`min`/`max`) checked at construction and re-validated through arithmetic; the hardening
reaction (`'warn' | 'fail'`); an intake modifier. A bound is set ONCE. Full detail:
[`scalars.md`](./scalars.md), [`value-modifier.md`](./value-modifier.md),
[`hardening.md`](./hardening.md).

### The unit side (measurement-only)

- **Identity:** `unit()`, `isUnit(u)`, `assertUnit(u)`.
- **Category:** `category()`, `isLength()`, `isAbsolute()`, `isRelative()`, `isPercent()`, `isAngle()`.
- **Render:** `css()` produces `` `${number}${unit}` `` (the number is the scalar's own rendering).
- **Unit-safe arithmetic:** `add`/`subtract`/`clamp`/`equals`/`compare` assert matching units, so you
  cannot add `8px` to `45deg`. Changing the unit is conversion, a separate concern.

### See also

- [`scalars.md`](./scalars.md) — the number side in full (`i`/`f`/`u`, bounds, modifier, brands).
- [`value-modifier.md`](./value-modifier.md), [`hardening.md`](./hardening.md) — the deep-dives.
- [`input-coverage.md`](./input-coverage.md) — the CSS-value → lexicon map.
