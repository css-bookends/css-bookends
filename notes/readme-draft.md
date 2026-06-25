<!--
DRAFT FOR REVIEW. Not the live README. Author decisions / unverified items:

1. PACKAGE NAME / TITLE CASING. Prose H1 is "CSS-Calipers"; package id is
   `@css-bookends/css-calipers`. Skeleton open question 5.3 asks you to confirm
   that split (prose CSS-Calipers vs lowercase package id). Left as-is.

2. HELPER LAYER IS NOW REAL. The skeleton (open question 5.2) was written when the
   per-property helpers were deferred. They now SHIP (verified in
   src/css-values/index.ts: opacity, zIndex, fontWeight, lineHeight, etc., from
   createCssValues()). I promoted them from a "coming" note to a real quick-start
   section with runnable examples. Decide how prominent it should be (currently a
   peer section after hardening). The skeleton's "future helper layer" section is
   therefore RETIRED in favour of a real one.

3. COLOUR IS NOW A FIFTH PRIMITIVE. `color()` is verified exported from the root
   (src/index.ts) and from src/color/index.ts. I added it to the at-a-glance map
   (now five primitives) and gave it a short quick-start. Decide whether colour
   gets equal billing with m/r/i/f or stays a lighter mention.

4. COLOUR `.css()` OUTPUT NOT PINNED. `color('#3366cc').darken(0.2).css()` returns
   a hex string (default format priority is hex-first), but I did NOT hard-assert
   the exact hex digits in a comment, since the OKLCH round-trip output is
   sensitive to culori's conversion and I could not run it. If you want an exact
   `// "#..."` comment, run it once and paste the value. The call chain itself is
   verified.

5. COLOUR MATURITY. backlog.typedInputs.md flags colour as still excluded from
   lint/typecheck pending a culori-rewrite, with 11 modification methods as
   `it.todo` and 3 stale rgba tests. `.darken()` / `.css()` (shown here) ARE
   implemented, but you may want a "colour is newer than the scalar core" status
   line. Not added yet; your call.

6. `<ratio>` PROMINENCE (skeleton 5.6): presented as a peer of i/f, matching the
   number-space doc. Confirm.

7. AT-A-GLANCE MAP FORMAT (skeleton 5.4): rendered as a 5-row table. Switch to a
   list if you prefer lighter width.

8. SUBPATH for the helper layer / colour: the helpers are exported from the ROOT
   (verified). backlog notes a `./color` subpath exists but is currently unused by
   the workspace (classic resolution). I import everything from the root to stay
   safe. If you want to advertise `@css-bookends/css-calipers/color`, confirm it
   resolves for typical consumers first.

9. POSITIONING block (csstype complement, "synthesis not invention", named prior
   art) is in a new "Boundaries & philosophy" + a short positioning aside. Verify
   the named-competitor tone reads honest, not defensive.

10. `lineClamp` cssProperty is `WebkitLineClamp` in the spec; helper name is
    `lineClamp`. Not shown in examples, noted for accuracy.
-->

# CSS-Calipers

[![npm](https://img.shields.io/npm/v/@css-bookends/css-calipers.svg)](https://www.npmjs.com/package/@css-bookends/css-calipers)
[![types](https://img.shields.io/npm/types/@css-bookends/css-calipers.svg)](https://www.npmjs.com/package/@css-bookends/css-calipers)
[![license](https://img.shields.io/npm/l/@css-bookends/css-calipers.svg)](./LICENSE.txt)

**csstype types the property. CSS-Calipers types the value.**

csstype types CSS property names and their keyword values. For an open numeric
value it falls back to `number & {}`, which accepts any number. So `opacity: 1.5`,
`zIndex: 2.7`, and `flexGrow: -1` all type-check clean. CSS-Calipers types that
value layer: the numeric inputs csstype waves through, validated at build time, so
the mistakes surface in your editor and not in the browser.

```ts
// Before: pull the number AND the unit apart, do the math, glue them back
const match = base.match(/^(-?\d*\.?\d+)([a-z%]+)$/i);
if (!match) throw new Error(`Bad measurement: ${base}`);
const [, numStr, unit] = match;
const pad = `${parseFloat(numStr) + 4}${unit}`; // nobody checked that `unit` is what the caller expects

// After: typed math, units enforced by the compiler
const base = m(8);                 // or m(8, "rem"), m(1.5, "em"), etc.
const pad = base.add(4).css();     // type error if units don't match
```

CSS-Calipers is the typed-input complement to csstype. Build CSS values with typed
arithmetic and constrained primitives, let the compiler catch unit and range
mistakes, and emit a CSS string only at the edge.

## Install

```bash
npm install @css-bookends/css-calipers
```

## The primitives at a glance

Five typed primitives cover the CSS value space. Each owns one CSS shape.

| Primitive | CSS shape it owns | Example |
| --- | --- | --- |
| `m()` | a measurement: number plus unit (`px`, `rem`, `deg`, `ms`, `%`, `fr`) | `m(8, "rem")` |
| `r()` | a ratio: `aspect-ratio` and the `<ratio>` type | `r(16, 9)` |
| `i()` | an integer: `z-index`, `order`, `column-count` | `i(3)` |
| `f()` | a float: a finite unitless real (`opacity`, `line-height`, `flex-grow`) | `f(0.5)` |
| `color()` | a colour: parse, modify, and emit any CSS colour | `color("#3366cc")` |

On top of the primitives, a per-property helper layer names the common cases
(`opacity`, `zIndex`, `fontWeight`, ...), each a constrained scalar whose `.css()`
is typed against the matching csstype property. The sections below are the
territory; this table is the map.

## Quick start: measurements (`m`)

The mature core. `m()` defaults to `px`, every standard CSS unit has a named helper
(`mPx`, `mRem`, `mEm`, `mDeg`, `mMs`, `mFr`, `mPercent`, `mVw`, ...), arithmetic is
unit-safe, and `.css()` renders at the edge.

```ts
import { m } from "@css-bookends/css-calipers";

const paddingBase = m(4);          // defaults to px (typed as a px measurement)
const rotation = m(45, "deg");     // equivalent to mDeg(45)

// Unit-safe arithmetic
const offset = paddingBase.add(paddingBase.add(4)).multiply(2).subtract(1);

// Emit CSS only at the edge
const style = {
  padding: paddingBase.css(),                        // "4px"
  transform: `rotate(${rotation.double().css()})`,   // "90deg"
};
```

Unit helpers import from the root, from `@css-bookends/css-calipers/units`, or per
family subpaths. Full measurement API, conversions, and worked examples:
**[Measurements core](README_MEASUREMENT.md)**.

## Ratios and plain numbers (`r`, `i`, `f`)

Not every CSS value carries a unit. Aspect ratios, opacity, z-index, line-height,
and font-weight are plain numbers, and csstype waves any number through.
CSS-Calipers types those too.

```ts
import { r, i, f, hardenFloat, hardenInteger } from "@css-bookends/css-calipers";

r(16, 9).css();   // "16/9"  aspect-ratio
i(3).css();       // "3"     a whole number
f(0.5).css();     // "0.5"   a real number

// Harden once, reuse: bind a constraint and get a bound factory
const opacity = hardenFloat({ min: 0, max: 1 });
opacity(1.5);                 // throws: 1.5 is above the maximum 1
opacity(0.4).css();           // "0.4"

const fontWeight = hardenInteger({ min: 1, max: 1000 });
fontWeight(700).css();        // "700"

// ratio composes from the primitives and respects their hardening
r(i(16), i(9)).css();         // "16/9"
```

`i()` rejects non-integers, `f()` rejects non-finite values, and both enforce
optional `{ min, max }` bounds that survive arithmetic. A result that breaks the
constraint throws. See **[The number space](docs/number-space.md)** for which CSS
values map to which primitive.

## Per-property helpers (`opacity`, `zIndex`, `fontWeight`, ...)

The semantic top of the stack. A named helper for a single-value CSS property is a
constrained scalar under the hood, plus that property's keyword companions, with a
`.css()` typed against the matching csstype property. The property name comes from
csstype; the value rule comes from CSS-Calipers.

```ts
import { opacity, zIndex, fontWeight } from "@css-bookends/css-calipers";

opacity(0.5).css();           // "0.5"
opacity(1.5);                 // throws: 1.5 is above the maximum 1
zIndex("auto").css();         // "auto"  (a keyword companion passes through)
fontWeight(700).css();        // "700"
```

By default an out-of-range number throws. Pass `{ outOfRange: 'clamp' }` to clamp
into the property's range instead. Clamping applies only where the property has
both bounds (opacity is `[0, 1]`; an open-ended bound has nothing to clamp on that
side).

```ts
opacity(1.5, { outOfRange: 'clamp' }).css();   // "1"
```

The bare `opacity` / `zIndex` / ... exports are `createCssValues()` at its
defaults (`outOfRange: 'throw'`). Call `createCssValues({ outOfRange: 'clamp' })`
for an instance whose helpers clamp by default. The helpers cover the clean
single-value scalars (the opacity family, `lineHeight`, `flexGrow`, `flexShrink`,
`fontWeight`, `zIndex`, `order`, `columnCount`, and more). See
**[The number space](docs/number-space.md)** for the full property mapping.

## Colour (`color`)

A native colour input alongside `m` / `r` / `i` / `f`. Parse any CSS colour,
modify it in a perceptually-uniform space, and emit a CSS string.

```ts
import { color } from "@css-bookends/css-calipers";

color("#3366cc").darken(0.2).css();   // a darker hex string
color("#3366cc").alpha(0.5).css();    // the same colour at 50% alpha
```

`color()` parses the input, normalizes to OKLCH, and resolves to an immutable
value. Modifiers (`.darken()`, `.lighten()`, `.saturate()`, `.mix()`, `.alpha()`,
`.hueShift()`, ...) each return a new colour; `.css()` renders it. By default
`.css()` emits the simplest faithful format, escalating only when a format cannot
hold the colour (for example to `hexAlpha` when alpha is present). Pick a format
explicitly with `.hex()`, `.rgb()`, `.oklch()`, and the other format selectors.

## Value hardening

Many CSS values have a restricted domain (padding `>= 0`, opacity `0..1`).
Refinements enforce the restriction at runtime AND harden the TypeScript type, so a
function can demand a checked value and the compiler rejects anything unchecked.

```ts
import { m, nonNegative, inRange } from "@css-bookends/css-calipers";

nonNegative.ensure(m(-4));               // throws: value must be >= 0
nonNegative.hardenWith(m(apiValue));     // out of range -> falls back to 0, never throws
const opacity = inRange(0, 1).ensure(m(value)); // typed as in-range [0, 1]
```

Built-ins: `nonNegative`, `nonPositive`, `inRange(min, max)` (bounds carried in the
type). Each exposes `is` / `ensure` / `check` / `hardenWith`. Two hardening
vocabularies coexist: measurement refinements (shown here) and the scalar
bound-factories (`hardenFloat` / `hardenInteger`). Both narrow the type. Full
guide: **[Value hardening](docs/hardening.md)**.

## Features

- **Typed CSS inputs across the board.** Measurements, ratios, integers, floats,
  and colour, each a constrained primitive that emits a CSS string.
- **Compile-time unit validation.** Prevents mixing incompatible units; conversions
  are explicit.
- **Range and integer safety.** Scalars carry optional `{ min, max }` bounds that
  survive arithmetic; non-integers and non-finite values are rejected.
- **Per-property helpers.** `opacity`, `zIndex`, `fontWeight`, and more, each typed
  against its csstype property, with a throw-or-clamp out-of-range policy.
- **Value hardening.** Runtime constraints (non-negative, ranges) that also narrow
  the type.
- **Explicit emission.** `.css()` outputs a typed string only when needed.
- **Light runtime footprint, framework-agnostic.** Works anywhere TypeScript does;
  near-zero cost when emitted at build time.

## Should I use this?

A good fit if you use TypeScript and want compile-time guarantees around CSS values:
units, numeric ranges, integer-ness, and colour. It pays off most in a design
system, where layout math, unit conversions, and value invariants matter. Probably
overkill if your project has little custom value math, relies mostly on utility
classes, or does not use TypeScript.

## Errors

Operations are fail-fast. Invalid input (mismatched units, non-finite values, bad
clamp bounds, failed constraints) throws a normal `Error` with the operation name,
the values, and a structured code (for example `CALIPERS_E_UNIT_MISMATCH`). You
choose where to place assertions and whether to catch. Stack hints and per-code
detail: **[Errors](docs/errors.md)**.

## Factory entrypoint (optional)

For instance-scoped configuration and a single re-export surface:

```ts
import { createCalipers } from "@css-bookends/css-calipers/factory";

const calipers = createCalipers({ errorConfig: { stackHints: "on" } });
export const { m, mPx, units } = calipers;
```

See [examples/factory-wrapper.example.ts](examples/factory-wrapper.example.ts).

## Boundaries & philosophy

CSS-Calipers types CSS inputs; string composition lives elsewhere. `.css()` is an
edge, not a habit. Plain numbers that ARE CSS values (opacity, z-index, ratios) are
typed via the scalars and the per-property helpers; a number used only as an
arithmetic operand needs no wrapper. Keywords, `var(--token)`, `calc(...)`, and
shorthand strings stay as explicit strings in your styling layer. Details and
integration patterns: **[Integration & philosophy](docs/integration.md)**.

On positioning, honestly: none of the underlying ideas is new. Compile-time
dimensional safety exists in general unit libraries like safe-units; typed CSS
values with arithmetic exist at runtime in the CSS Typed OM. The nearest neighbour
in spirit is johanneslumpe/css-types, which generates CSS value types from MDN but
ships types only, with the branded value helpers left unimplemented. What does not
exist elsewhere is the assembled layer: CSS-native primitives, build-time (not
runtime DOM) validation, property-range hardening, and colour, framed as the input
complement to csstype's output types. CSS-Calipers claims that synthesis and that
realization, not the invention of any one capability.

## Media queries

Media queries are not part of CSS-Calipers. They live in
[`@css-bookends/media-queries`](https://www.npmjs.com/package/@css-bookends/media-queries).
**Upgrading to v1?** The only change is media queries; if you never used the
media-query helper, v1 is a drop-in.

## Status & support

- Stable `1.0` core: measurements, ratios, and the integer / float scalars, plus
  the per-property helper layer, part of the
  [CSS-Bookends](https://github.com/css-bookends/css-bookends) umbrella.
- Colour is the newest primitive and still settling; the core scalar and
  measurement surface is the most mature.
- Tested with TypeScript 5.6+ on Node 18+.
- Solo, early-stage project. If it saves you time, you can
  [buy me a coffee](https://buymeacoffee.com/slafleche).

<a href="https://www.buymeacoffee.com/slafleche" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="48"></a>

## Docs

- [Measurements core](README_MEASUREMENT.md) — the measurement API in depth.
- [The number space](docs/number-space.md) — which CSS values map to integer / float / ratio, and the per-property helpers.
- [Value hardening](docs/hardening.md) — non-negative, non-positive, and typed ranges.
- [Errors](docs/errors.md) — error behaviour, common codes, stack hints.
- [Integration & philosophy](docs/integration.md) — worked example, patterns, boundaries.
- [Testing](TESTING.md) — testing patterns and dev-only guards.

## Examples

The `examples/` folder contains non-published usage sketches:

- [hardening-fallback](examples/hardening-fallback.example.ts) — harden an API value with
  `ensure` / `is` / `hardenWith`.
- [hardening-range](examples/hardening-range.example.ts) — a typed `inRange` bound flowing
  into a function that demands it.
- [lineHeight-normalizer](examples/lineHeight-normalizer.example.ts) — mixed-input
  normalization (numbers, strings, CSS variables) into a value with `.css()`.
- [validation-unit-tests](examples/validation-unit-tests.example.ts) — enforcing spacing
  token invariants in tests.
- [validation-and-runtime-checks](examples/validation-and-runtime-checks.example.ts) —
  dev-only validation across two consumers using the same measurement.
- [factory-wrapper](examples/factory-wrapper.example.ts) — instance-scoped factory wrapper.
