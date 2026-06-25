# Prior art vs CSS-Bookends: what (if anything) is actually different

An honest compare-and-contrast against the existing landscape (scan 2026-06-24), to see
what CSS-Bookends/Calipers genuinely offers versus what already exists. Bottom line up
front: **no single core capability here is novel; the differentiation is the synthesis,
the CSS-native end-to-end packaging, property-hardening, color, and the input/output
framing.** That is a real contribution (good infra is integration), but it is not
"invented something no one could."

## Compare and contrast

| Prior art | What it does | Overlap with Bookends | What Bookends adds / how it differs |
| --- | --- | --- | --- |
| **safe-units, ts-units, quantits** (general TS units-of-measure) | Compile-time dimensional analysis in TS; reject `px + deg`; general / SI unit systems | **Yes** — Bookends also rejects `px + deg` at compile time via branded units | CSS-native units (px/rem/vh/deg/ms/%), emits CSS via `.css()`, property-hardened helpers (opacity, z-index), color. These libs are general-physics, no CSS emit, no CSS-property awareness. The dimensional-safety idea is theirs. |
| **CSS Typed OM** (`CSSUnitValue`, `CSS.px()`, arithmetic) | Typed CSS values + arithmetic + unit conversion; **runtime DOM** API; standardized | Partial — typed values + arithmetic | **Build-time, not runtime.** Rejects `px + deg` at the type level (Typed OM defers mixed units to the browser as `CSSMathValue`, no compile error). Emits static plain CSS, no DOM coupling, works with any styling solution. This is the cleanest differentiator. |
| **csscalc, @karibash/pixel-units** (CSS-specific typed unit math in TS) | Typed CSS unit math / conversion (px↔rem, calc), some branded types | **Yes** on measurement math | Broader: a full input *layer* (numbers + color + property-hardened helpers + emit), not a calc/conversion utility. Differentiation is scope, not a different unit-math capability. |
| **csstype** | Types the CSS **output** surface; accepts any string via `string & {}` | None — complement | Types the **input** (typed construction). Pairs with csstype at the emit edge. The input-vs-output framing is the thesis, not a competitor. |
| **johanneslumpe/css-types** | TS CSS types + "value helpers" from MDN | Unknown — VERIFY | Closest in spirit. Must check how far its "value helpers" go before claiming differentiation. |

## What is genuinely different (the synthesis)

No single existing tool does all of this as one coherent layer:

1. **Property-hardened, branded helpers** — `opacity` = branded `Float[0,1]`, `zIndex` =
   branded `Int`, etc., whose result types carry "valid opacity," emitting
   csstype-compatible output. This specific combo (brand the input, emit the typed
   output) appears genuinely unoccupied.
2. **Build-time + static-CSS emit + compiler-agnostic** — vs Typed OM's runtime DOM
   coupling. Author-time errors, plain CSS out, works with vanilla-extract / CSS-in-JS /
   static CSS alike.
3. **Color as a first-class typed input** alongside measurement — the unit libraries do
   not touch color; that is a whole second primitive domain.
4. **Framed as the input complement to csstype** — the clean articulation of the gap.

## What is NOT novel (be honest)

- Compile-time dimensional safety / `px + deg` rejection: **safe-units** did it (general).
- Typed CSS unit math: **csscalc / pixel-units**.
- Typed CSS values + arithmetic: **CSS Typed OM** (at runtime).

## The cynic's view (so you are not blindsided)

Strip the framing and a skeptic calls it "CSS-flavored safe-units + culori + csstype
glue." That is unfair but not baseless: the differentiation is **integration + framing +
property-hardening + color**, not a novel algorithm. The honest defense is that this is
exactly what useful infrastructure is, the assembled, CSS-native, build-time,
property-hardened input layer does not exist elsewhere, even though every ingredient
does. Claim the synthesis, never the invention of a capability.

## Sources

- safe-units: https://github.com/jscheiny/safe-units
- ts-units: https://github.com/buge/ts-units
- CSS Typed OM (W3C): https://www.w3.org/TR/css-typed-om-1/ ; MDN: https://developer.mozilla.org/en-US/docs/Web/API/CSS_Typed_OM_API/Guide
- csscalc: https://github.com/Morglod/csscalc
- @karibash/pixel-units: https://karibash.medium.com/handle-css-units-system-in-a-type-safe-in-typescript-4c55ff325eec
- csstype: https://www.npmjs.com/package/csstype
- johanneslumpe/css-types: https://github.com/johanneslumpe/css-types (VERIFY before publishing)

Full landscape notes (for the blog angle) live in
`cv_stuff/blog/research/typed-css-input-landscape.md`.
