# borders — design record

The reference implementation of the factory + 3-page model (see `/ARCHITECTURE.md`).
Running record of decisions, page by page. **Canonical types live in `src/types.ts`;**
this file records the decisions and status so they do not drift.

| Page | Status |
| --- | --- |
| 1. Input | **LOCKED** (compass coordinates, flat) |
| 2. Storage | Implemented (resolution + merge + precedence) |
| 3. Output | **Contract LOCKED**; `long` renderer done, `line` / `short` TBD |

---

## Page 1 — Input (LOCKED)

Grounded in 40+ real call sites from the portfolio borders helper, then cleaned up.
See `BordersInput` / `BordersSpec` in `src/types.ts`.

One flat namespace of coordinates + shorthands:

```
shorthands:  width  style  color  radius          (apply to all edges / all corners)
edges:       top right bottom left  x y            → Border | 'none'
corners:     n s e w  (pairs)   nw ne se sw        → CornerRadius
```

### Decisions baked in

- **`x` / `y`** replace horizontal/vertical (terser, well known). x = left+right, y = top+bottom.
- **Compass corners, flattened to root.** Cardinal `n/s/e/w` = pairs, diagonal
  `nw/ne/se/sw` = corners. Chosen over Tailwind letters (`t/r/b/l`, `tl/...`) and over
  CSS names (`topLeft`) as the more elegant, collision-free system: it gives pairs for
  free and never clashes with the edge keys.
- **No `all` keyword.** The bare shorthand already means "all"; `radius` is the
  all-corners shorthand (no `r` alias — too close to `right`).
- **No `true`, no `sides` wrapper.** Absent already means "use the shorthand", so a
  per-side `true` was a no-op. Per-side overrides live at the top level.
- **`'none'` omits an edge** (mirrors CSS `border-top: none`), e.g. `borders({ width: m(1), top: 'none' })`.
  `x: 'none'` / `y: 'none'` omit pairs for free. The framework "zero the width" pattern
  is still available as `top: { width: m(0) }`.
- **Colour is `ColorWrapper` only** — always whatever `color()` returns, never a raw string.
- **Radius** is a single value or elliptical `[x, y]` per corner; the ambiguous 3/4-value
  CSS array was dropped in favour of explicit coordinates.

## Page 2 — Storage (implemented)

Input resolves to a canonical store of 4 concrete edges + 4 concrete corners.

- **Merge, not replace.** A partial edge override (`top: { color }`) merges over the
  shorthand/default edge, keeping the other properties. This settles the parked
  merge-vs-replace question.
- **Edge precedence:** defaults/shorthand < axis (`x`/`y`) < concrete side.
- **Corner precedence:** `radius` (all) < pair (`n/s/e/w`) < corner (`nw/ne/se/sw`).
- **No-intent corners stay absent** (no key emitted), which kills the old `'0'` vs `'0px'`
  mess. An explicit `m(0)` renders `'0px'`.

## Page 3 — Output (contract LOCKED)

"Typed tokens in, plain CSS out." The output is always a plain style object. csstype's
`Property.*` types are the machine-readable CSS spec, so the contract is the full valid
surface. See `BorderLong` / `BorderLine` / `BorderShort` / `BorderOutput` in `src/types.ts`.

- **Three formats**, chosen via factory config (`output`, default `'long'`):
  - `long` — every longhand (`borderTopWidth`…), easiest to override. **Done.**
  - `line` — per-edge shorthand (`borderTop: '1px solid red'`) + `borderRadius`. **TBD.**
  - `short` — full `border` shorthand + `borderRadius`; only round-trips when all edges
    are identical, flagged risky in docs. **TBD.**
- **`BorderOutput` is the all-optional superset** of the three, so a consumer can read or
  spread any key without narrowing.
- **Navigable result.** `borders(x)` returns a `ResolvedBorders`: render the whole
  (`.css()`) or drill to a concrete coordinate, whose leaves are the lexicon values with
  their own `.css()` (`borders(x).top.width.css()`, `borders(x).nw.css()`). Input shorthands
  `x/y/n/s/e/w` are write-only; the read tree is the 8 concrete coordinates.
- The contract being csstype-wide means `thin/medium/thick` (width) and
  `currentColor`/`transparent` (color) are valid **output**; whether the **input** accepts
  them is a separate question (today `BorderWidth` is `IMeasurement`-only).

### Open / out of scope

- **Renderers:** `line` and `short` formats (+ radius shorthand collapsing, slash elliptical).
- **Input gaps to decide:** width keywords (`thin/medium/thick`), keyword colours
  (`currentColor`/`transparent`) via a `color()` passthrough.
- **`'unset'` keyword** output semantics still loose.
- **Out of scope** (valid CSS, not built): logical properties (`border-block/-inline`,
  `border-start-start-radius`), `border-image` (the `border` shorthand resets it to `none`),
  per-property global keywords beyond whole-border `'unset'`.
