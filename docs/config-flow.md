# Config flow: how settings cascade from the compendium down to a standalone lexicon

This maps every level a config setting passes through, from the top bundle
(`publishCompendium`) down to a single standalone factory (`createIntegerFactory`) and its
per-instance error store. It is the concrete companion to the `config-cascade` skill (the
rules) and `foundations.md` (the unit/bundle map).

One sentence: **every level is the same bundle-factory shape (`{ global?, <unitKey>? }`), and a
setting resolves `own unit key → this level's global → the outer level's global → the factory's
built-in default`.** The shape recurses, so learning one level teaches them all ("same pattern
all the way down").

## The map

```
publishCompendium(cfg)                        cfg = { global?, calipers?, color?, <book>?… }
│   global = { errorConfig }                   ← BOOKENDS level
│
├── books  (opacity, borders, margin, …)       each: own <book> key → compendium.global → book default
│
└── calipers?  ─►  createCalipersBundleFactory(cfg)   cfg = { global?, measurement?, integer?, float?,
    │   global = { errorConfig }                        ratio?, color?, <13 unit-group> }
    │   (codex.global merges UNDER compendium.global:    ← CALIPERS level
    │    calipers.global.X ?? compendium.global.X)
    │
    ├── createCalipersFactory(measurement)  ─► m      { errorConfig, defaultUnit }   (container: numeric config rides on the embedded scalar)
    ├── create*Units × 13  (unit-group keys) ─► mPx, mVh, mPercent, …   { errorConfig }   (containers)
    ├── createColorFactory(color)            ─► color  { formats, output, strictness, transparent, omitOpaqueAlpha }
    └── createScalarBundleFactory({ global, integer, float, ratio })          ← SCALAR FAMILY level
        │   global = { errorConfig }  (merges under codex.global)
        │
        ├── createIntegerFactory(integer)    ─► i      { errorConfig, min?, max? }
        ├── createFloatFactory(float)        ─► f      { errorConfig, min?, max? }
        └── createRatioFactory(ratio)        ─► r      { errorConfig }   (config-free container: two scalars; divide-by-zero throws; no bound)

  every factory above builds ONE per-instance error store from its resolved `errorConfig`
  (createErrorConfigStore → createErrorHelpers); the scalars (`i` / `f`) bake their bound (`min` / `max`)
  into a bound helper that THROWS on breach. NO process-global config exists: the cascade is the only path in.
```

## The levels, package by package

Each level is its own npm package (or, for the scalar family, its own module inside
`css-calipers`). Each takes a config, exposes a level-scoped `global`, resolves its own units,
and forwards the relevant slice to the next level down.

| Level | Package / module | Factory | `global` carries | Forwards down via |
| --- | --- | --- | --- | --- |
| Bookends bundle | `@css-bookends/compendium` | `publishCompendium` | `errorConfig` | the `calipers?` key → codex |
| Calipers bundle (codex) | `@css-bookends/css-calipers` | `createCalipersBundleFactory` | `errorConfig` | the `cascade()` helper → each lexicon + unit-group factory, and the `global` slice → scalar family |
| Scalar family | `css-calipers` `src/scalar-bundle.ts` | `createScalarBundleFactory` | `errorConfig` | its `cascade()` → `createIntegerFactory` / `createFloatFactory` / `createRatioFactory` |
| Standalone lexicons | `@css-bookends/{measurement,integer,float,ratio}` + colour | `createCalipersFactory`, `createIntegerFactory`, `createFloatFactory`, `createRatioFactory`, `createColorFactory` | — (leaf factories) | build a per-instance error store; the scalars (`i` / `f`) bake their bound into a throw-on-breach helper |

The lexicon packages are thin slice re-exports of `css-calipers/src`, so a consumer can install
just `@css-bookends/integer` and call `createIntegerFactory({ … })` with the exact same config shape it
has inside the codex. Nothing at any level ships a pre-bound instance; the factory is the only way in.

## Resolution order (the cascade)

For any one setting, most specific wins:

```
own unit key  →  this level's global  →  the outer level's global  →  factory built-in default
```

- **own unit key** — e.g. `createCalipersBundleFactory({ integer: { errorConfig: { stackHints: 'on' } } })`.
- **this level's global** — e.g. `createCalipersBundleFactory({ global: { errorConfig: { stackHints: 'off' } } })`
  applies to every unit that has no own key.
- **outer level's global** — the compendium's `global` is merged UNDER the codex's `global` when
  the compendium forwards through `calipers`, built as `calipers.global.X ?? compendium.global.X`
  so a codex-specific value wins over a compendium-wide one.
- **factory built-in default** — when nothing above is set (`errorConfig.stackHints` → `'auto'`,
  `defaultUnit` → `'px'`).

## The option catalogue

| Option | Values | Which globals carry it | Reaches | Built-in default |
| --- | --- | --- | --- | --- |
| `errorConfig.stackHints` | `'auto' \| 'on' \| 'off'` | compendium, codex, scalar | every error-producing factory: `m`, `i`, `f`, `r`, unit groups | `'auto'` |
| `defaultUnit` | a CSS unit string | — (the codex `measurement` key only) | `m` | `'px'` |
| colour config | `formats`, `output`, `strictness`, `transparent`, `omitOpaqueAlpha` | — (the codex `color` key only) | `color` | `defaultColorConfig` |
| `format` | `'object' \| 'string'` | — (per-book key today) | books | `'object'` |
| constraint bound (`min`, `max`) | a `number` | — (the scalar's own key `integer` / `float`, or per value) | `i`, `f`: a bounded builder brands the value `InRange<min,max>` (System A) and stores the bound (System B). `m` / `r` are containers with no bound of their own: a measurement's bound rides on the `i` / `f` it embeds (`m(i(v, {min,max}))`), surfaced via `.constraints()`; ratio has no bound. Set once at construction, then immutable; mint a fresh scalar to change it | unbounded |
| input `modifier` | `(n: number) => number` | — (the scalar's own key `integer` / `float`, or per value) | `i`, `f`: transforms the raw value at intake, before validate/store (modify-then-validate). A measurement gets it via the `i` / `f` it embeds. Generic mechanism; specific normalization (e.g. cyclic-angle modulo) lives on a purpose-built scalar or helper | none |
| `snap` (per-edge + blanket) | per edge via `min`/`max: { snap: boolean }`, or blanket `snap: boolean` | compendium, codex, scalar — POLICY only, the globals carry no bound `value` | `i`, `f`: makes a breach on that edge ABSORB to the limit (silent) instead of throwing; per-edge, cascades most-specific-wins, blanket governs both edges. A dead blanket (both edges override it) is a COMPILE error. `m` gets it via the embedded `i` / `f` | `false` (throws) |

`errorConfig` reaches every error-producing unit and is carried in every level's `global`. A broken
bound THROWS by default; the per-edge `snap` policy (above) is the shared scalar option that makes it
ABSORB to the limit instead, and it cascades through every level's `global` (policy only, never a bound
`value`). `defaultUnit`, `formats`, `format`, the constraint bound (`min` / `max`),
and the scalar `modifier` are unit-local or per-value (set through a unit's own key or a per-value
option, never a shared global).

## Worked example, top to bottom

```ts
const bookends = publishCompendium({
  global: { errorConfig: { stackHints: 'off' } },
  calipers: { global: { errorConfig: { stackHints: 'on' } } },   // codex-specific override
});
```

- `errorConfig.stackHints` resolves per calipers unit as `own → codex.global('on') →
  compendium.global('off') → 'auto'` ⇒ **`'on'`** (the codex global wins over the compendium global, so
  every calipers error shows the `stack=` block).
- A book is not a calipers unit, so it has no codex global and resolves `own → compendium.global('off')
  → book default` ⇒ **`'off'`** (its errors omit the `stack=` block).

The same idea on a standalone install, `errorConfig` cascading through the scalar family:

```ts
import { createScalarBundleFactory } from '@css-bookends/css-calipers';
const { i, f, r } = createScalarBundleFactory({
  global: { errorConfig: { stackHints: 'off' } },
  integer: { errorConfig: { stackHints: 'on' } },  // integer overrides the family global
});
// i renders errors with stackHints 'on'; f and r use 'off' from the family global.
```

## See also

- `config-cascade` skill — the RULES this map realizes (`global` + per-unit keys, reachability,
  same pattern all the way down).
- `docs/foundations.md` — the unit/bundle map (lexicon ↔ codex, book ↔ compendium).
- `docs/factory-first-pattern.md` — why construction goes through a factory at all.
