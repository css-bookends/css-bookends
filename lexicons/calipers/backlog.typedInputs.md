# Backlog: typed CSS inputs (the full-inputs-package work)

Tracking loose ends from making css-calipers the full typed-CSS-inputs package
(measurements, ratios, integers, floats, colour, per-property atoms). Captured
2026-06-24.

## Colour fold loose ends (from Phase 1)

- **3 pre-existing red tests** (`books/shadows` x1, `packages/shelf` x2) assert
  `rgba(...)`, but the default colour priority is hex-first
  (`defaultFormatPriority = [hex, rgb, hexAlpha, rgba, ...]`). A 0.5-alpha colour
  renders `#5b419980` (hexAlpha), never reaching rgba. Stale assertions that
  predate the fold (verified failing at HEAD). Resolve one of three ways: flip the
  assertions to the actual hex output, set those books'/shelf's colour config to
  `output: colorFormats.rgba` if rgba is the intended product default, or fold it
  into the colour culori-rewrite. See the root `package.json` `//temp-exclude` note.
- **11 colour modification methods are `it.todo`** in
  `tests/runtime/color/color.matrix.src.test.ts` (were `expect(false)` markers,
  converted to `it.todo` so calipers stays green after the move). The gap list is
  preserved; implement/verify these modifications.
- **`./color` subpath is emitted but unused by the workspace.** Calipers'
  `package.json` exports `./color` and the build emits `dist/*/color/**`, but the
  colour surface is re-exported from the calipers ROOT because colour's tsconfig
  uses classic `Node` resolution (ignores `exports`). Switch to the `./color`
  subpath import if/when consumers move to `node16`/`bundler` resolution.
- **Colour is still excluded from lint/typecheck** (root `//temp-exclude`,
  "pending its documented culori-rewrite gaps"). Restore once the rewrite lands
  (delete the `--filter='!...'` flags + the matching set in `lint-staged.config.mts`).

## Phase 2 deferred properties (per-property helpers not in v1)

v1 covered the clean single-value scalars; the multi-part grammars are now mostly built.

**Built (task #15, green), in `src/css-values/multi.ts`:** the counter trio
(`<custom-ident> <integer>` pairs + `none`), grid line numbers
(`<integer>` | `span <integer>` | named line | `auto`, via a `span()` builder),
multi-value `scale` (1 to 3 number factors | `none`), and `tab-size` (the `<number>`
form, plus a length supplied as an `IMeasurement`).

**Still deferred:**
- **Border-image / mask-border multipliers:** `border-image-width/outset/slice`,
  `mask-border-width/outset/slice` (number multiplier OR length/percentage, 1 to 4 values).
- **Stroke tier** (number form is a unitless SVG-user-unit input; length form is `m()`'s):
  `stroke-width`, `stroke-dashoffset`, `stroke-dasharray`.
- **`readingOrder`** (found by the MDN sweep, task #16): a bare unbounded `<integer>`, same
  group as `order`. Deferred because csstype 3.2.3 has no `Property.ReadingOrder` key
  (CSS Display L4 is too new); add the helper once csstype gains the key.
- **Skipped (font-defined / weak bound):** `font-variation-settings`, `font-feature-settings`.

**Recheck (MDN 404 during the sweep, grammars unconfirmed):** `baseline-shift`, `column-height`.

## Research / docs gates

- **Full ~600-entry MDN property sweep** for belt-and-suspenders coverage (v1 built
  from the ~43 verified properties in `docs/css-number-value-types.md`).
- **`johanneslumpe/css-types` VERIFIED (2026-06-24), gate cleared.** Closest prior
  art, and it ships TYPES ONLY (generated from MDN, for styled-props). Its README
  states the branded value helpers are NOT implemented: "functions are aliased to
  `string`, instead of auto-generated helper functions which return branded types."
  No CSS emission, no property-range hardening, no arithmetic, no colour. Positioning
  consequence: ACKNOWLEDGE it as the nearest neighbour (it named the same aspiration),
  then claim the REALIZATION, not the idea: the built, hardened, CSS-emitting,
  colour-inclusive runtime input layer does not exist elsewhere. Source:
  github.com/johanneslumpe/css-types.
- **Full ~600-entry MDN property sweep** for belt-and-suspenders coverage (still open).
