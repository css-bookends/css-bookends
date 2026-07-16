---
name: config-cascade
description: How configurable behaviour flows through CSS-Bookends - every unit (calipers lexicon / bookends book) has a factory config, units of a kind share an IDENTICAL config shape, and a bundle (codex / compendium) carries a `global` plus per-unit keys that resolve unit-key -> global -> factory default. Same pattern all the way down: any grouping (a lexicon family like `scalar`, the codex, the compendium) IS a bundle factory that mirrors `src/bundle.ts`. Use when adding or changing ANY config option, a unit factory, a bundle, or a NEW grouping / family factory. Always paired with failing-first tests.
---

# config-cascade

The rule for any behaviour that can vary across instances. It makes "everything is
config-driven" (see `docs/foundations.md`) concrete and uniform at both layers. This
is the cascade `createCalipersBundle` (codex) and `publishCompendium` (compendium)
implement; copy it, never reinvent a per-feature scheme.

## The rules

- **Every unit has a FACTORY that takes a config.** A calipers lexicon: `createCalipers`
  (`m`), `createInteger` (`i`), `createFloat` (`f`), `createColor`. A bookends book:
  `publishBook<Name>`. The factory bakes the config into the unit it produces. No bare
  pre-made instance is the configurable path.
- **Units of a KIND share an IDENTICAL config shape.** `m` / `i` / `f` all carry the same
  shared field(s) for a cross-cutting option, typed from ONE shared type, never redefined.
  Example: `Hardening = 'ignore' | 'warn' | 'fail'` + `HardeningConfig` live once in
  `lexicons/calipers/src/hardening.ts` and are imported by the `m` / `i` / `f` factory
  configs. A new shared option is added to that one shared type, then it is automatically
  identical across the units.
- **A bundle exposes `global` PLUS one key per unit.** `CalipersBundleConfig` (codex):
  `{ global?, measurement?, integer?, float?, ratio?, color? }`. `CompendiumConfig`:
  `{ global?, <book keys>…, calipers?: CalipersBundleConfig }`. The bundle factory must
  return the CONFIGURED units (spread `createInteger(...)` / `createFloat(...)` / … into the
  bundle object), so a `global` or per-unit key actually reaches the unit a consumer calls.
- **Resolution is `unit key -> bundle global -> factory default`** (most specific wins). In
  the user's words: set in BOTH the global and the unit key -> the unit key wins; only the
  global -> use the global; neither -> the factory default. One line per unit, e.g.
  `hardening: config.integer?.hardening ?? config.global?.hardening` (then the factory applies
  its built-in default when that is `undefined`).
- **Bundles NEST; the inner global overrides the outer.** The compendium carries the whole
  codex config under a `calipers` key and forwards it to `createCalipersBundle`, merging so a
  lexicon resolves `own -> codex.global -> compendium.global -> default`. Build the codex
  global as `calipers.global.<opt> ?? compendium.global.<opt>` so codex-specific wins.
- **Reachability is mandatory.** No unit config the bundle factory cannot reach. If you add a
  unit option, you ALSO add it to the bundle config + cascade in the SAME change. An option
  that only works standalone is a bug.
- **The publishBook engine has no global tier.** `self-publish/src/publishBook.ts` merges only
  `defaults <- config`. So per-book global resolution happens INSIDE `publishCompendium` (merge
  the global-applicable fields under each book's own config before calling the factory), and a
  global field is applied only to books whose config actually has it.

## Same pattern all the way down (a grouping IS a bundle factory)

Every grouping is the SAME bundle-factory shape, recursively. `createCalipersBundle` in
`lexicons/calipers/src/bundle.ts` is the ONE canonical implementation — MIRROR it, never
invent a new shape. A bundle factory always has the same four parts:

1. a `<Name>BundleConfig` with a `global?` slot PLUS one OPTIONAL key per sub-factory;
2. a `cascade(own)` helper that fills each shared option `own?.opt ?? config.global?.opt`;
3. a body that SPREADS every sub-factory, each called through `cascade`, into ONE bound object;
4. a `<Name>Bundle` return type intersecting the sub-factory APIs.

This RECURSES: a sub-factory can itself be a bundle. The codex composes lexicon factories
AND family bundles; a **family** bundle (e.g. `createScalarBundle`, grouping `integer` /
`float` / `ratio`) is ITSELF a bundle factory of the same four parts, and the codex composes
it by spreading it under the cascade, exactly like any other sub-factory:

```ts
// src/scalar-bundle.ts — mirrors src/bundle.ts, one level down
export const createScalarBundle = (config: ScalarBundleConfig = {}) => {
  const cascade = (own) => ({ ...own, hardening: own?.hardening ?? config.global?.hardening });
  return {
    ...createInteger(cascade(config.integer)),
    ...createFloat(cascade(config.float)),
    ...createRatio(config.ratio), // ratio has no hardening; passes through
  };
};

// src/bundle.ts — the codex composes the family, same as any sub-factory
...createScalarBundle({
  global: config.global,
  integer: config.integer, float: config.float, ratio: config.ratio,
}),
```

The test: when a "should this be its OWN shape?" question comes up, the answer is NO — it is
`createCalipersBundle` one level in or out. Re-read `src/bundle.ts` and mirror it. A grouping
that does not take `global` and cascade is wrong.

## Tests are NOT optional

ANY config or cascade change ships **failing-first** tests (write them, watch them fail, then
implement — see `doc-test-code`). For a cascade, cover every rung, for each unit, at BOTH
bundle levels:

- **unit key wins** over the global,
- **global applies** when there is no unit key,
- **factory default** when neither is set,
- and (for nested bundles) the **inner global overrides the outer**.

Use a real worked option (today: `hardening`) with an observable effect (`ignore` proceeds,
`fail` throws). Tighten throw-assertions to the real message (e.g. `toThrow(/maximum/)`) so a
`TypeError` from an unbuilt API cannot pass spuriously. Reference: codex cascade tests live in
`lexicons/calipers/tests/runtime/codex/codex.src.test.ts`.

## Reference

`lexicons/calipers/src/bundle.ts` (`createCalipersBundle` = the canonical cascade — MIRROR
it for every new grouping; `src/codex.ts` only re-exports it);
`createInteger` / `createFloat` in `lexicons/calipers/src/integer.ts` / `float.ts`;
the shared `Hardening` / `HardeningConfig` in `lexicons/calipers/src/hardening.ts`;
`packages/compendium/src/index.ts` (`publishCompendium`). Companion skills: `doc-test-code`
(build order), `smart-factory` (the factory itself), `output-shape` (the `format` option).
The concrete end-to-end MAP of every setting's path (compendium → codex → scalar family →
standalone lexicon + per-instance error store) is `docs/config-flow.md`.
