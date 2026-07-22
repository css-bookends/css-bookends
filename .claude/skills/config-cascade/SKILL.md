---
name: config-cascade
description: How configurable behaviour flows through CSS-Bookends - every unit (calipers lexicon / bookends book) has a factory config, units of a kind share an IDENTICAL config shape, and a bundle (codex / compendium) carries a `global` plus per-unit keys that resolve unit-key -> global -> factory default. Same pattern all the way down: any grouping (a lexicon family like `scalar`, the codex, the compendium) IS a bundle factory that mirrors `src/bundle.ts`. Use when adding or changing ANY config option, a unit factory, a bundle, or a NEW grouping / family factory. Always paired with failing-first tests.
---

# config-cascade

The rule for any behaviour that can vary across instances. It makes "everything is
config-driven" (see `docs/foundations.md`) concrete and uniform at both layers. This
is the cascade `createCalipersBundleFactory` (codex) and `publishCompendium` (compendium)
implement; copy it, never reinvent a per-feature scheme.

## The rules

- **Every unit has a FACTORY that takes a config.** A calipers lexicon: `createCalipersFactory`
  (`m`), `createIntegerFactory` (`i`), `createFloatFactory` (`f`), `createColorFactory`. A bookends book:
  `publishBook<Name>`. The factory bakes the config into the unit it produces. No bare
  pre-made instance is the configurable path.
- **Units of a KIND share an IDENTICAL config shape.** Every unit carries the same shared field for a
  cross-cutting option, typed from ONE shared type, never redefined. The live example is `errorConfig`:
  its shared type + config slice live once (`lexicons/calipers/src/internal/errors.ts`) and are imported
  by every unit factory. A new shared option is added to that one shared type, then it is automatically
  identical across the units. The config-bearing SCALARS (`i` / `f`) ALSO share a numeric config shape
  (the bound `min` / `max`, the modifier, and the per-edge `snap` reaction); `m` / `r` are CONTAINERS
  that embed a scalar, carry NO numeric config, and DELEGATE all of it (bound, modifier, snap) to the
  scalar they hold, cascading only their own non-numeric fields (`errorConfig`, plus `m`'s
  `unit` / `defaultUnit`).
- **A bundle exposes `global` PLUS one key per unit.** `CalipersBundleConfig` (codex):
  `{ global?, measurement?, integer?, float?, ratio?, color? }`. `CompendiumConfig`:
  `{ global?, <book keys>…, calipers?: CalipersBundleConfig }`. The bundle factory must
  return the CONFIGURED units (spread `createIntegerFactory(...)` / `createFloatFactory(...)` / … into the
  bundle object), so a `global` or per-unit key actually reaches the unit a consumer calls.
- **Resolution is `unit key -> bundle global -> factory default`** (most specific wins). In
  the user's words: set in BOTH the global and the unit key -> the unit key wins; only the
  global -> use the global; neither -> the factory default. One line per unit, e.g.
  `errorConfig: config.integer?.errorConfig ?? config.global?.errorConfig` (then the factory applies
  its built-in default when that is `undefined`).
- **Bundles NEST; the inner global overrides the outer.** The compendium carries the whole
  codex config under a `calipers` key and forwards it to `createCalipersBundleFactory`, merging so a
  lexicon resolves `own -> codex.global -> compendium.global -> default`. Build the codex
  global as `calipers.global.<opt> ?? compendium.global.<opt>` so codex-specific wins.
- **Reachability is mandatory.** No unit config the bundle factory cannot reach. If you add a
  unit option, you ALSO add it to the bundle config + cascade in the SAME change. An option
  that only works standalone is a bug.
- **Cross-cutting vs unit-local.** `errorConfig` is CROSS-CUTTING: it lives in every `global` and
  reaches every error-producing unit; the per-edge `snap` policy is another cross-cutting scalar option
  (carried in every `global` as POLICY only, no bound `value`). The constraint bound (`min` / `max`) is
  UNIT-LOCAL, like `defaultUnit` / the colour config: set through a unit's own key (or on the value
  itself), never a shared `global`. Do NOT add a `global` tier for a unit-local option. A broken bound
  THROWS by default, or ABSORBS to the limit on an edge that opts into `snap`; the `hardening: 'warn' |
  'fail'` config was retired (2026-07-21). See `docs/foundations.md` ("Snap" + "The two constraint
  systems") and `docs/config-flow.md`.
- **The publishBook engine has no global tier.** `self-publish/src/publishBook.ts` merges only
  `defaults <- config`. So per-book global resolution happens INSIDE `publishCompendium` (merge
  the global-applicable fields under each book's own config before calling the factory), and a
  global field is applied only to books whose config actually has it.

## Same pattern all the way down (a grouping IS a bundle factory)

Every grouping is the SAME bundle-factory shape, recursively. `createCalipersBundleFactory` in
`lexicons/calipers/src/bundle.ts` is the ONE canonical implementation — MIRROR it, never
invent a new shape. A bundle factory always has the same four parts:

1. a `<Name>BundleConfig` with a `global?` slot PLUS one OPTIONAL key per sub-factory;
2. a `cascade(own)` helper that fills each shared option `own?.opt ?? config.global?.opt`;
3. a body that SPREADS every sub-factory, each called through `cascade`, into ONE bound object;
4. a `<Name>Bundle` return type intersecting the sub-factory APIs.

This RECURSES: a sub-factory can itself be a bundle. The codex composes lexicon factories
AND family bundles; a **family** bundle (e.g. `createScalarBundleFactory`, grouping `integer` /
`float` / `ratio`) is ITSELF a bundle factory of the same four parts, and the codex composes
it by spreading it under the cascade, exactly like any other sub-factory:

```ts
// src/scalar-bundle.ts — mirrors src/bundle.ts, one level down
export const createScalarBundleFactory = (config: ScalarBundleConfig = {}) => {
  const cascade = (own) => ({ ...own, errorConfig: own?.errorConfig ?? config.global?.errorConfig });
  return {
    ...createIntegerFactory(cascade(config.integer)),
    ...createFloatFactory(cascade(config.float)),
    ...createRatioFactory(cascade(config.ratio)), // ratio cascades errorConfig too
  };
};

// src/bundle.ts — the codex composes the family, same as any sub-factory
...createScalarBundleFactory({
  global: config.global,
  integer: config.integer, float: config.float, ratio: config.ratio,
}),
```

The test: when a "should this be its OWN shape?" question comes up, the answer is NO — it is
`createCalipersBundleFactory` one level in or out. Re-read `src/bundle.ts` and mirror it. A grouping
that does not take `global` and cascade is wrong.

## Tests are NOT optional

ANY config or cascade change ships **failing-first** tests (write them, watch them fail, then
implement — see `doc-test-code`). For a cascade, cover every rung, for each unit, at BOTH
bundle levels:

- **unit key wins** over the global,
- **global applies** when there is no unit key,
- **factory default** when neither is set,
- and (for nested bundles) the **inner global overrides the outer**.

Use a real worked option (today: `errorConfig.stackHints`) with an observable effect (`'on'` shows the
`stack=` block in a thrown error, `'off'` omits it). Assert on the real rendered message so a
`TypeError` from an unbuilt API cannot pass spuriously. Reference: codex cascade tests live in
`lexicons/calipers/tests/runtime/codex/codex.src.test.ts`.

## Reference

`lexicons/calipers/src/bundle.ts` (`createCalipersBundleFactory` = the canonical cascade — MIRROR
it for every new grouping; `src/codex.ts` only re-exports it);
`createIntegerFactory` / `createFloatFactory` in `lexicons/calipers/src/integer.ts` / `float.ts`;
the shared error-config type in `lexicons/calipers/src/internal/errors.ts`;
`packages/compendium/src/index.ts` (`publishCompendium`). Companion skills: `doc-test-code`
(build order), `smart-factory` (the factory itself), `output-shape` (the `format` option).
The concrete end-to-end MAP of every setting's path (compendium → codex → scalar family →
standalone lexicon + per-instance error store) is `docs/config-flow.md`.
