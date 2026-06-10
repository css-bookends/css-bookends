# borders — design record

The reference implementation of the factory + 3-page model (see `/ARCHITECTURE.md`).
This file is the running record of design decisions, page by page.

| Page | Status |
| --- | --- |
| 1. Input | **LOCKED** 2026-06-10 (revisitable) |
| 2. Internal store | TBD |
| 3. Output | TBD |

---

## Page 1 — Input (LOCKED)

The full set of shapes a caller can pass. Grounded in 40+ real call sites from the
portfolio borders helper, then cleaned up.

```ts
import type { IMeasurement } from '@css-bookends/css-calipers';
import type { ColorWrapper } from '@css-bookends/colours';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */
export type BorderColor = ColorWrapper | { css(): string } | Property.BorderColor;
export type BorderWidth = IMeasurement | 0 | null;
export type BorderStyle = Property.BorderStyle;

/* ---------- sides (x = left+right, y = top+bottom) ---------- */
export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Axis = 'x' | 'y';
/** Per side/axis. No `all` — a bare value (the shorthand) is the all-sides case. */
export type BySide<T> = Partial<Record<Side | Axis, T>>;

/* ---------- corners / radius ---------- */
export type Corner = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';
export type CornerAlias = 'nw' | 'ne' | 'se' | 'sw';
/** n = top corners, s = bottom, e = right, w = left. */
export type CornerZone = 'n' | 's' | 'e' | 'w';
export type CornerRadius = IMeasurement | readonly [IMeasurement, IMeasurement];
export type ByCorner = Partial<Record<CornerZone | CornerAlias | Corner, CornerRadius>>;
/** one value (all corners) · 1-4 array (CSS shorthand) · per-corner map · 0 / null. */
export type BorderRadius = CornerRadius | readonly CornerRadius[] | ByCorner | 0 | null;

/* ---------- a single border ---------- */
export interface Border {
  width?: BorderWidth;
  style?: BorderStyle;
  color?: BorderColor;
}

/* ---------- the input ---------- */
export type BordersInput = 'none' | 'unset' | BordersSpec;

/**
 * Shorthand (width/style/color/radius) applies to all sides; per-side keys
 * (top/right/bottom/left/x/y) override with a Border (or `true` = use shorthand).
 * Each property can itself be a per-side map.
 */
export interface BordersSpec extends Partial<Record<Side | Axis, Border | true>> {
  width?: BorderWidth | BySide<BorderWidth>;
  style?: BorderStyle | BySide<BorderStyle>;
  color?: BorderColor | BySide<BorderColor>;
  radius?: BorderRadius;
}
```

### Decisions baked in

- **`x` / `y` replace `horizontal` / `vertical`** (Tailwind-style, terser, well known).
  `x` = left + right, `y` = top + bottom.
- **No `all` keyword.** The bare shorthand value already means "all sides", so a
  separate `all` was redundant. Pattern: shorthand = all base, a named side key
  makes one side different, e.g. `borders({ width: m(1), style: 'solid', color, left: { width: m(2) } })`.
- **Per-side full borders stay at the top level** (`{ left: { width } }`), not under
  a `sides` wrapper. The wrapper was rejected as too verbose.
- **Colour** accepts a colours `ColorWrapper`, anything with `.css()`, or a raw CSS
  string. **Width** is a measurement or `0`/`null`. **Radius** covers single value,
  1-4 value array shorthand, per-corner/zone map (n/s/e/w, nw/ne/se/sw, named
  corners), and `0`/`null`.

### Parked for later pages

- **Merge vs replace:** when a side key names only some properties
  (`left: { width: m(2) }`), does that side inherit the shorthand's style/color
  (merge) or drop them (replace)? "All these, plus one side different" implies
  **merge** — decide on the Internal-store page.
