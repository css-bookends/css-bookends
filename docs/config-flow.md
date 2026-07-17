# Config flow: how settings cascade from the compendium down to a standalone lexicon

This maps every level a config setting passes through, from the top bundle
(`publishCompendium`) down to a single standalone factory (`createInteger`) and its
per-instance error store. It is the concrete companion to the `config-cascade` skill (the
rules) and `foundations.md` (the unit/bundle map).

One sentence: **every level is the same bundle-factory shape (`{ global?, <unitKey>? }`), and a
setting resolves `own unit key → this level's global → the outer level's global → the factory's
built-in default`.** The shape recurses, so learning one level teaches them all ("same pattern
all the way down").

## The map

```
publishCompendium(cfg)                        cfg = { global?, calipers?, color?, <book>?… }
│   global = { hardening, errorConfig }        ← BOOKENDS level
│
├── books  (opacity, borders, margin, …)       each: own <book> key → compendium.global → book default
│
└── calipers?  ─►  createCalipersBundle(cfg)   cfg = { global?, measurement?, integer?, float?,
    │   global = { hardening, errorConfig }              ratio?, color?, <13 unit-group> }
    │   (codex.global merges UNDER compendium.global:    ← CALIPERS level
    │    calipers.global.X ?? compendium.global.X)
    │
    ├── createCalipers(measurement)  ─► m      { hardening, errorConfig, defaultUnit }
    ├── create*Units × 13  (unit-group keys) ─► mPx, mVh, mPercent, …   { hardening, errorConfig }
    ├── createColor(color)            ─► color  { formats, output, strictness, transparent, omitOpaqueAlpha }
    └── createScalarBundle({ global, integer, float, ratio })          ← SCALAR FAMILY level
        │   global = { hardening, errorConfig }  (merges under codex.global)
        │
        ├── createInteger(integer)    ─► i      { hardening, errorConfig, min?, max?, sealedMin?, sealedMax? }
        ├── createFloat(float)        ─► f      { hardening, errorConfig, min?, max?, sealedMin?, sealedMax? }
        └── createRatio(ratio)        ─► r      { errorConfig, min?, max?, sealedMin?, sealedMax? }   (bound for parity; structural throws, no hardening)

  every factory above builds ONE per-instance error store from its resolved `errorConfig`
  (createErrorConfigStore → createErrorHelpers); `hardening` is baked into the bound helper.
  NO process-global config exists: the cascade is the only path in.
```

## The levels, package by package

Each level is its own npm package (or, for the scalar family, its own module inside
`css-calipers`). Each takes a config, exposes a level-scoped `global`, resolves its own units,
and forwards the relevant slice to the next level down.

| Level | Package / module | Factory | `global` carries | Forwards down via |
| --- | --- | --- | --- | --- |
| Bookends bundle | `@css-bookends/compendium` | `publishCompendium` | `hardening`, `errorConfig` | the `calipers?` key → codex |
| Calipers bundle (codex) | `@css-bookends/css-calipers` | `createCalipersBundle` | `hardening`, `errorConfig` | the `cascade()` helper → each lexicon + unit-group factory, and the `global` slice → scalar family |
| Scalar family | `css-calipers` `src/scalar-bundle.ts` | `createScalarBundle` | `hardening`, `errorConfig` | its `cascade()` → `createInteger` / `createFloat` / `createRatio` |
| Standalone lexicons | `@css-bookends/{measurement,integer,float,ratio}` + colour | `createCalipers`, `createInteger`, `createFloat`, `createRatio`, `createColor` | — (leaf factories) | build a per-instance error store; bake hardening into the bound helper |

The lexicon packages are thin slice re-exports of `css-calipers/src`, so a consumer can install
just `@css-bookends/integer` and call `createInteger({ … })` with the exact same config shape it
has inside the codex. Nothing at any level ships a pre-bound instance; the factory is the only way in.

## Resolution order (the cascade)

For any one setting, most specific wins:

```
own unit key  →  this level's global  →  the outer level's global  →  factory built-in default
```

- **own unit key** — e.g. `createCalipersBundle({ integer: { hardening: 'fail' } })`.
- **this level's global** — e.g. `createCalipersBundle({ global: { hardening: 'warn' } })` applies
  to every unit that has no own key.
- **outer level's global** — the compendium's `global` is merged UNDER the codex's `global` when
  the compendium forwards through `calipers`, built as `calipers.global.X ?? compendium.global.X`
  so a codex-specific value wins over a compendium-wide one.
- **factory built-in default** — when nothing above is set (`hardening` → `'fail'`,
  `errorConfig.stackHints` → `'auto'`, `defaultUnit` → `'px'`).

## The option catalogue

| Option | Values | Which globals carry it | Reaches | Built-in default |
| --- | --- | --- | --- | --- |
| `hardening` | `'ignore' \| 'warn' \| 'fail'` | compendium, codex, scalar | `m`, `i`, `f`, unit groups (the range-breach reaction) | `'fail'` |
| `errorConfig.stackHints` | `'auto' \| 'on' \| 'off'` | compendium, codex, scalar | every error-producing factory: `m`, `i`, `f`, `r`, unit groups | `'auto'` |
| `defaultUnit` | a CSS unit string | — (the codex `measurement` key only) | `m` | `'px'` |
| colour config | `formats`, `output`, `strictness`, `transparent`, `omitOpaqueAlpha` | — (the codex `color` key only) | `color` | `defaultColorConfig` |
| `format` | `'object' \| 'string'` | — (per-book key today) | books | `'object'` |
| constraint bound (`min`, `max`) | a `number` | — (the unit's own key `integer` / `float` / `ratio`, or per value) | `i`, `f`, `r`: a bounded builder brands the value `InRange<min,max>` (System A) and stores the bound (System B) | unbounded |
| `sealed` (`sealedMin`, `sealedMax`, `sealedRange`) | `boolean` per edge | — (the unit's own key, or on the value via `sealMin()` / `sealMax()`) | `i`, `f`, `m`, `r`: locks a bound edge against `clone` (control, not prevention) | sealed (bounds locked; opt out per edge with `sealedMin: false`) |

`hardening` and `errorConfig` are the two CROSS-CUTTING options: they live in every level's
`global` and reach every error-producing unit. `defaultUnit`, `formats`, `format`, the constraint
bound (`min` / `max`), and `sealed` are unit-local or per-value (set through a unit's own key or on
the value itself, never a shared global).

## Worked example, top to bottom

```ts
const bookends = publishCompendium({
  global: { hardening: 'warn', errorConfig: { stackHints: 'off' } },
  calipers: { global: { hardening: 'fail' } },   // codex-specific override
});
```

- `hardening` resolves per calipers lexicon as `own → codex.global('fail') → compendium.global('warn') → 'fail'`
  ⇒ **`'fail'`** (the codex global wins over the compendium global).
- `errorConfig.stackHints` has no codex global, so it resolves `own → codex.global(unset) →
  compendium.global('off') → 'auto'` ⇒ **`'off'`** (every calipers error omits the `stack=` block).
- A book with no own key inherits `hardening: 'warn'` from the compendium global.

The same settings on a standalone install:

```ts
import { createScalarBundle } from '@css-bookends/css-calipers';
const { i, f, r } = createScalarBundle({
  global: { hardening: 'warn', errorConfig: { stackHints: 'off' } },
  integer: { hardening: 'fail' },  // integer overrides the family global
});
// i uses hardening 'fail'; f uses 'warn'; all three render errors with stackHints 'off'.
```

## See also

- `config-cascade` skill — the RULES this map realizes (`global` + per-unit keys, reachability,
  same pattern all the way down).
- `docs/foundations.md` — the unit/bundle map (lexicon ↔ codex, book ↔ compendium).
- `docs/factory-first-pattern.md` — why construction goes through a factory at all.
