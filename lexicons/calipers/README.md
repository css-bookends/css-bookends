# @css-bookends/css-calipers

The missing pieces of typed CSS input, build-time-validated: colour, measurements, integers, floats, and ratios.

A companion to the [Design Tokens Community Group (DTCG)](https://www.w3.org/community/design-tokens/) format: where DTCG is the vendor-neutral standard for _what_ your tokens are, calipers is the layer that turns them into real, build-time-validated types ([more below](#complementary-to-design-tokens-dtcg)).

> **Beta.** The expanded surface documented here (colour, ratios, the unified value surface, and the config cascade) ships under the `beta` tag; install with `@beta` and expect changes before it reaches a stable `1.x`. Only the original `m()` release is on `latest` (`1.0.0`).

## Quick start

```bash
npm i @css-bookends/css-calipers@beta
```

```ts
import { style } from '@vanilla-extract/css';
import { m, r, color } from '@css-bookends/css-calipers';

// Build typed, validated values; `.css()` emits plain CSS strings (or a style
// object). Shown here with vanilla-extract, but calipers is agnostic about the
// compiler: the output is plain CSS, so it drops into vanilla-extract, CSS
// Modules, any CSS-in-JS, or a plain stylesheet build just the same.
export const card = style({
  padding: m(16).css(),          // '16px'
  aspectRatio: r(16, 9).css(),   // '16/9'
  color: color('#3366cc').css(), // '#3366cc'
});
```

## The problem

CSS input values are untyped. A measurement is a string (`'8px'`), an opacity is a bare number, a colour is whatever string you typed. Nothing catches `opacity: 1.5`, a `px` value added to an `em`, or a `z-index` that is silently a float. The mistake surfaces in the browser, not the compiler.

That is by design: CSS is meant to fail silently in the browser. The missing half is failing loudly in the *build*, which matters more now that so much CSS is AI-written (an LLM will confidently ship an invalid `width: fit-parent` and never know). [The case for compiled, typed CSS](https://dev.to/slafleche/the-case-for-compiled-typed-css-blame-ai-8m8) makes the fuller argument.

There is a deeper reason the compiler stays quiet: TypeScript cannot check a numeric bound at the type level (there is no `50 > 10` in the type system). calipers does the check where it *can* run, in JavaScript, and brands the result, so a value that passes carries a proof the compiler enforces from then on: a function that demands a bounded value rejects an unproven one. The real check runs in JS; the type system enforces the proof. That is what build-time-validated means here.

## Highlights

`.css()` on a colour emits the simplest format that holds it without losing information:

```ts
import { color } from '@css-bookends/css-calipers';

color('#3366cc').css();             // '#3366cc'                  (opaque -> hex)
color('#3366cc').alpha(0.5).css();  // 'rgba(51, 102, 204, 0.5)'  (translucent -> rgba)
color('oklch(0.7 0.37 150)').css(); // 'oklch(0.7 0.37 150 / 1)'  (wide gamut -> oklch)
```

That ladder is the default and is reconfigurable: set your own output format or priority list, per call or per instance.

Measurements are branded by unit, so a `px` cannot be added to an `em`, and arithmetic re-validates:

```ts
import { m } from '@css-bookends/css-calipers';

m(8).add(m(4)).css();          // '12px'  (m() defaults to px)
m(2, 'rem').multiply(2).css(); // '4rem'
```

Ratios accept plain numbers or typed integers and floats on either side:

```ts
import { r, i, f } from '@css-bookends/css-calipers';

r(16, 9).css();        // '16/9'   (plain numbers)
r(i(16), i(9)).css();  // '16/9'   (typed integers)
r(f(1.5), i(2)).css(); // '1.5/2'  (a float and an integer, mixed)
```

Refinements turn a runtime check into a compile-time guarantee: the checked value is branded, so a function that demands a non-negative measurement cannot be handed an unchecked one.

```ts
import { m, nonNegative, inRange } from '@css-bookends/css-calipers';

// `ensure` runs the check, then hands the value back with a HARDENED type. The brand
// proves it passed, so anything typed NonNegativeMeasurement is known to be checked.
const width = nonNegative.ensure(m(8)); // type: NonNegativeMeasurement<'px'>  (throws if negative)

// `inRange` bakes its literal bounds into the type, so it is distinct from any other range.
const pct = inRange(0, 100).ensure(m(50, '%')); // type: InRangeMeasurement<'%', 0, 100>

// `hardenWith` always returns a valid, hardened value: if the input fails the check it
// falls back to a known-good one instead of throwing.
nonNegative.hardenWith(m(-4, 'px')).css(); // '0px'  (-4 fails the check, so it falls back to 0)
```

Integers (`i`), floats (`f`), and custom colour formats round out the set.

## Why csstype does not cover this

`csstype` is excellent and ships here as a dependency. It types CSS property names and their keywords well. What it leaves loose is open INPUT values: where a property accepts an open number or string, csstype falls back to `(number & {})`, so a bare `1.5`, a `px` added to an `em`, or a float `z-index` all pass. You cannot construct a validated value from that. calipers fills exactly that gap, and `.css()` renders to a string that still satisfies csstype on output. It complements csstype; it never replaces it. csstype types the property and keyword side, calipers types the value side, and the aim is a complete typed surface for CSS input, built from both.

calipers is standalone and complete on its own, and it is the lowest of three opt-in layers. Use it directly with no helpers, or reach up for the helpers ([CSS-Bookends](https://github.com/css-bookends/css-bookends), Layer 2) and the opinionated framework (CSS Squire, Layer 3, TBD) built on it, dropping back down whenever you want the control. Nothing above is ever required. See [Lower-level by design](https://github.com/css-bookends/css-bookends#lower-level-by-design-choose-your-altitude).

A note on the names, and on wrapping. The book metaphor (calipers, bookends, gilding, compendium) is deliberate, not just whimsy. Each name marks a ROLE, and intentionally hides the library currently filling it, because those internals are meant to be swappable. You import `color()`, not `culori`; the project's browser-compat finisher is `gilding`, not Lightning CSS. Swap the engine underneath and your call sites do not move.

That swappability reflects a principle calipers shares with the wider project: where a mature tool already solves a problem, we wrap it at the edge and credit it plainly rather than reinventing it. calipers leans on `culori` for colour conversions and satisfies `csstype` on output; what it adds is the typed authoring surface around those edges (branded, validated values in, a single `.css()` out), not a reimplementation of the wrapped tool. The fuller version of this argument is the [CSS-Bookends "Wrapping at the edges, not reinventing"](https://github.com/css-bookends/css-bookends#wrapping-at-the-edges-not-reinventing) philosophy.

## Coverage: a lexicon for every primitive input

Every quantitative CSS input token is one of four shapes, and calipers has a lexicon for each, plus `color()` for colour:

| CSS shape | example | lexicon |
| --------- | ------- | ------- |
| a plain whole number | `z-index: 3` | `i()` |
| a plain real number | `flex-grow: 2.5` | `f()` |
| a number with a unit (a dimension) | `8px` · `45deg` · `.3s` · `1fr` | `m()` |
| a number over a number (a ratio) | `16/9` | `r()` |

`m()` is generic over the unit (`m<Unit extends string>`), so ANY number-plus-unit is an `m()`, the named helpers (`mPx`, `mDeg`, …) are shortcuts, not the limit. Constraints (alpha `[0,1]`, counts `>= 1`, …) are added by hardening on those same lexicons. Together that closes the exact space csstype leaves open (`(number & {})` / `(string & {})`); string / identifier / url tokens stay csstype's `string`. The full proof, with every primitive CSS value type mapped to its lexicon, is [`docs/input-coverage.md`](./docs/input-coverage.md).

## Complementary to Design Tokens (DTCG)

The [Design Tokens Community Group](https://www.w3.org/community/design-tokens/) (DTCG), a W3C Community Group, maintains the [Design Tokens Format Module](https://design-tokens.github.io/community-group/format/): a vendor-neutral format for exchanging design tokens between tools, which reached its first stable version in 2025 with backing from major design-tool and platform vendors. It is the standard the ecosystem is converging on, it is important work, and calipers is built to complement it, not to compete with it.

The two solve different halves of one problem. A token document is the source-agnostic layer: the agreed description of what your tokens ARE, portable across tools. calipers is the layer that turns those values into real TypeScript types and real build-time validation for your project, so a token stops being a loose JSON value and becomes a checked, branded value that cannot be misused. From there it renders to whatever target you need through `.css()`: plain CSS, Sass, or the styles inside a component (React, Vue, and so on).

calipers stays deliberately agnostic about where the tokens come from. It types and validates the VALUES, and a separate conversion step feeds them in, handing each token to the matching lexicon (`m()`, `color()`, `i()`, `f()`). The token landscape is still plural (the W3C DTCG format alongside the Figma, Tokens Studio, and Style Dictionary shapes in the wild), and calipers does not bind to any one of them. Which source formats a converter accepts, and how, is an open design question in the wider [CSS-Bookends](https://github.com/css-bookends/css-bookends) project; calipers does not depend on the answer. A token in, a typed and validated value in the middle, a rendered value out in any format you target.

**An intentional border.** This project deliberately starts *after* you have design tokens. Getting authoritative tokens out of the design tool, validating that the design system and the tokens agree, catching design drift, is a real and separate problem, and it is not ours to solve. Others work that upstream edge well, for example Amrutha Kollu's [_Check Designs validates your Figma. What validates your code?_](https://dev.to/akollu72/check-designs-validates-your-figma-what-validates-your-code-38c2), which names exactly the code-side gap calipers fills. So the boundary is by design: standard tokens come in, and calipers answers the "what validates your code" half with typed, build-time-validated values.

## Install

```sh
npm install @css-bookends/css-calipers
```

Dependencies: `csstype` and `culori` (the colour engine). ESM and CommonJS are both published; the colour surface is reachable from the root import.

## Colour

`color(input, config?)` parses a CSS string, a structured `ColorObject` (one shape per colour space: `{ space: 'rgb', r, g, b, alpha? }`, hsl, hwb, lab, lch, oklab, oklch), a symbolic keyword (`currentColor`, a system colour, a cascade keyword), or an existing resolved colour. It normalizes to OKLCH internally and returns an immutable result.

Modifications return a new colour (the original is untouched) and thread the configured output format through: `darken`, `lighten`, `brighten`, `saturate`, `desaturate`, `setLightness`, `setChroma`, `setHue`, `hueShift`, `complement`, `mix`, `mixSolid`, `mixWithAlpha`, `alpha`, `solid`, `clone`, `contrast`. See `examples/color-modify.example.ts`.

**Output.** `.css()` takes no argument and walks the default ladder `[hex, rgba, oklch]` (the order is backed by usage data, see `docs/color-format-popularity.md`). Force a format with a named selector (`.hex()`, `.rgb()`, `.rgba()`, `.hexAlpha()`, `.hsl()`, `.hwb()`, `.lab()`, `.lch()`, `.oklab()`, `.oklch()`, `.displayP3()`) or `.formatAs(...)`. `omitOpaqueAlpha` drops the alpha slot for an opaque colour where it is optional (lossless, off by default).

**Strictness.** When a render cannot faithfully hold the colour (dropping a real alpha, out of sRGB gamut, modifying a symbolic colour), `strictness` decides: `auto` (default, throw in dev, warn in prod), `throw`, `warn`, or `silent`.

```ts
color('#3366cc80').rgb().css();                           // throws in dev (rgb carries no alpha)
color('#3366cc80', { strictness: 'silent' }).rgb().css(); // 'rgb(51, 102, 204)'  (alpha dropped)
```

**Transparency.** A fully transparent colour renders as the `transparent` keyword by default; configurable with `{ transparent: 'keyword' | 'white' | 'black' | 'preserve' }` or per render with `.transparentAs(mode)`. See `examples/transparency.example.ts`.

**Custom formats.** `createColor({ formats })` binds custom format plugins. A plugin bridges the input and output edges (storage stays canonical OKLCH) and gets a typed named selector; author one with `defineColorSpace`, and an optional `fallback` hook rewrites its output into browser-safe CSS. See `examples/custom-format.example.ts` (its "zoo" format is a deliberately silly extensibility demo, not a real format), `examples/plugin-fallback.example.ts`, and `docs/adding-a-color-format.md`.

**Browser support for modern formats.** To recap the output story: `.css()` defaults to the simplest format that can faithfully hold the colour (the `[hex, rgba, oklch]` ladder), and that default is fully configurable, per call (a selector or `.formatAs(...)`) or per instance (the factory `output` config). If you opt into a bleeding-edge format (`oklch`, `lab`, `display-p3`) that older browsers do not yet support, calipers still emits it faithfully and leaves the fallbacks to a post-processor at the output edge: [gilding](https://github.com/css-bookends/css-bookends) (the CSS-Bookends finisher that wraps [Lightning CSS](https://lightningcss.dev/)) if you are in the wider project, or [Lightning CSS](https://lightningcss.dev/) on its own if you use calipers standalone. calipers types and emits the value; browser compatibility is the post-processor's job.

## Measurements

`m(value, unit?)` builds a measurement (unit defaults to `px`, lower-cased). Arithmetic, `round`, and `clamp` return new measurements in the same unit. Per-unit helpers bind the unit (`mPx`, `mEm`, `mRem`, `mPercent`, `mCqw`, ...) across every unit family: absolute, font-relative, viewport, container, angle, time, frequency, resolution, and grid.

`m()` accepts a plain number OR a typed scalar (`m(i(8))`, `m(f(2.5), 'rem')`). The raw accessor is uniform across measurements, integers, and floats: `.value()` (the raw number) and `.unit()` (the unit string, empty for the unitless scalars); the old `.getValue()` / `.getUnit()` are removed (a breaking change). Recover a typed scalar with `.toTypedValue()` (returns `i()` when the value is integral, else `f()`), and query a value with `.isInt()` / `.isFloat()`. A measurement also reports its CSS category, `.category()` (e.g. `'length-absolute'`, `'percent'`, `'angle'`, or `undefined` for an unknown unit), plus `.isLength()` / `.isAbsolute()` / `.isRelative()` / `.isPercent()` / `.isAngle()`.

```ts
import { m, i } from '@css-bookends/css-calipers';

m(i(8)).css();          // '8px'              (m accepts i / f)
m(2.5, 'rem').value();  // 2.5
m(2.5, 'rem').unit();   // 'rem'
m(8).category();        // 'length-absolute'
m(8).isAbsolute();      // true
m(50, '%').isPercent(); // true
m(2.5).toTypedValue();  // f(2.5)             (integral -> i, fractional -> f)
```

## Integers and floats

`i()` (a whole number) and `f()` (a real number) are constrained scalars for the unitless number space CSS leaves untyped. Both validate at construction and re-validate on every operation, so a constrained value stays valid (or throws) through arithmetic. `clamp(min, max)` snaps into range instead of throwing; a per-value bound (`i(v, { min, max })`) or a named-domain factory bound (`const { i: fontWeight } = createInteger({ min: 100, max: 900 })`) sets range constraints. The `createInteger` / `createFloat` factories bake a `hardening` reaction (and an optional bound) into the `i` / `f` they return (see Hardening). See `examples/integers-floats.example.ts`.

## Ratios

`r(numerator, denominator?)` (denominator `1` when omitted) accepts typed integers and floats on either side, with helpers `simplifyRatio`, `reduceRatio`, `normalizeRatio`, and `parseRatio`. See `examples/ratio.example.ts`.

## Hardening and constraints

Refinements run a runtime check and return the same value branded with the constraint, so a function can demand "a non-negative measurement" and the compiler rejects anything unchecked (brands are keyed by a private symbol). The built-ins are `nonNegative`, `nonPositive`, and `inRange(min, max)`, each exposing `.is` / `.ensure` / `.check` / `.hardenWith`. `inRange` carries its literal bounds in the type. Build your own with `makeMeasurementRefinement`. The full model is in `docs/hardening.md`, with runnable examples in `examples/refinements.example.ts`.

**A measurement's bound (config-driven).** `m` takes its bound from ONE source: a DIRECT `m(v, { min, max })` checked at construction, an ingested hardened `i` / `f` (m carries its `.constraints()`), or `m`'s refinement quartet — a direct bound AND an ingested-scalar bound together throws (a bound is set once). `m` also takes a generic input `modifier: (n) => n` applied at intake, before validation and storage (modify-then-validate), and every unit helper can carry the same `{ min, max, modifier }` config. What happens when later arithmetic BREAKS the bound is one config knob, `hardening: 'warn' | 'fail'` (default `'fail'`): `fail` throws, `warn` warns and drops the bound. (There is no silent "ignore": dropping a bound silently is the same as never bounding the value.) The same knob governs `i` / `f`'s own re-validation. Set it per instance via `createCalipers({ hardening })` / `createInteger({ hardening })` / `createFloat({ hardening })`, or across the whole bundle via the cascade (see Factories).

```ts
import { m, i, createCalipersBundle } from '@css-bookends/css-calipers';

// a DIRECT bound on m, checked at construction
m(8, { min: 0, max: 10 }).constraints(); // { min: 0, max: 10 }
m(50, { min: 0, max: 10 });              // throws (out of range; default 'fail')

// or INGEST a hardened scalar's bound
const bounded = i(8, { min: 0, max: 10 });
m(bounded).multiply(2);                  // throws (16 breaks [0, 10]; default 'fail')

// configure the reaction via the bundle (createCalipers is on the /factory + /codex entries)
const lenient = createCalipersBundle({ measurement: { hardening: 'warn' } });
lenient.m(bounded).multiply(2).css();    // '16px' (bound dropped, proceeds)
```

## Per-property value helpers live in the books layer

calipers is the value-type primitives only (colour, measurements, integers, floats, ratios). The per-property value helpers (`opacity`, `zIndex`, `fontWeight`, ...) are NOT a calipers feature: they live one layer up, in the books layer. Each is a book that binds a calipers primitive to one CSS property, applies that property's bound and keyword companions, and types its `.css()` output against the matching csstype `Property.X`. The shared engine behind them is `@css-bookends/css-value-core`. For the full picture, the value-type side is mapped in `lexicons/calipers/surface.md` and the per-property side in `packages/css-value-core/surface.md`.

## Factories

The bare exports (`m`, `color`, the refinements, ...) are each a factory already called at its defaults, so the default instance and a custom instance share one construction path. The factory itself is the real configurable path and the override seam: `createCalipers({ errorConfig?, hardening? })` returns a measurement instance, `createInteger({ hardening? })` / `createFloat({ hardening? })` return the integer / float surface, and `createColor({ formats?, output?, strictness?, transparent? })` a colour instance carrying its full config (custom format plugins, the default output format, strictness, transparency); routing every consumer through a factory means you can rewrite or wrap any step (input, storage, output) with zero call-site changes. The master factory `createCalipersBundle({ global?, measurement?, integer?, float?, ratio?, color? })` (surfaced on the package root, and the default export of the `codex` entry) combines all of the above under one keyed config: a `global` slot of shared options plus one key per unit, where each setting resolves own key -> `global` -> factory default. So `createCalipersBundle({ global: { hardening: 'warn' }, integer: { hardening: 'fail' } })` warns everywhere except integers, which throw. `codex` is the lazy-defaults convenience entry: it default-exports that master factory and named-exports the same primitive set already bound at defaults, so you get everything wired without touching a factory yourself. (`codex` and the bookends `@css-bookends/compendium/defaults` subpath are the only two lazy-defaults entries in the project.) Binding a factory once in one of your own modules and re-exporting the bound helper from there also keeps the blast radius of a library change small: your code imports that helper from a single seam, so a major restructuring of the library's internal paths lands in that one file, not across the hundreds or thousands of call sites that use it. And because each factory call returns its own independent instance, several configurations coexist side by side with no shared global state to collide: a `createColor` that emits hex and another that emits oklch, or a strict instance next to a clamping one, all live at once, with no cascade or global state to fight (each instance is just a value in scope, not a stylesheet competing in the cascade). See the `examples/bind-once/` mini project (bind once, export, consume) and `examples/factory-wrapper.example.ts` (the override seam), and the full rationale in [the factory-first pattern](https://github.com/css-bookends/css-bookends/blob/main/docs/factory-first-pattern.md).

All of that power is opt-in. If you just want sensible defaults and none of the above, you never touch a factory: the bare `m` / `color` / refinement exports are ready as-is, and `codex` hands you the whole primitive set bound at defaults in one import.

## Documentation

Deeper dives live in `docs/`:

- `docs/input-coverage.md` - the coverage proof: a lexicon for every primitive CSS input token, and where the boundary is.
- `docs/number-space.md` - which scalar CSS values are worth typing, and why.
- `docs/hardening.md` - the refinement model, branded types, and custom refinements.
- `docs/custom-format-registration.md` and `docs/adding-a-color-format.md` - registering custom colour formats end to end.
- `docs/color-format-popularity.md` - the usage data behind the default output ladder.
- `docs/integration.md` - using calipers with a styling pipeline.
