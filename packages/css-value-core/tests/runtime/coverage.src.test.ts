import { describe, expect, it } from 'vitest';

import {
  animationIterationCount,
  borderImageOutset,
  borderImageSlice,
  borderImageWidth,
  columnCount,
  counterIncrement,
  counterReset,
  counterSet,
  createCssValues,
  fillOpacity,
  flexGrow,
  flexShrink,
  floodOpacity,
  fontSizeAdjust,
  fontWeight,
  gridColumnEnd,
  gridColumnStart,
  gridRowEnd,
  gridRowStart,
  lineClamp,
  lineHeight,
  maskBorderOutset,
  maskBorderSlice,
  maskBorderWidth,
  mathDepth,
  opacity,
  order,
  orphans,
  scale,
  shapeImageThreshold,
  span,
  stopOpacity,
  strokeDasharray,
  strokeDashoffset,
  strokeMiterlimit,
  strokeOpacity,
  strokeWidth,
  tabSize,
  widows,
  zIndex,
  zoom,
} from '../../src';

/**
 * INTENDED-BEHAVIOUR COVERAGE SWEEP.
 *
 * For every helper in the css-value layer this asserts the layer's documented
 * contract:
 *  - a number outside the property's bound throws by default; with
 *    `{ outOfRange: 'clamp' }` it clamps (single-value helpers with BOTH bounds);
 *  - non-finite inputs (`NaN`, `Infinity`) throw;
 *  - integer-kind helpers throw on a non-integer;
 *  - each helper accepts its keyword companions, and `.css()` returns the
 *    keyword unchanged;
 *  - an unknown keyword/string throws.
 *
 * This file is ADDITIVE: it changes no helper. Where a helper does not match
 * the intended behaviour, the case is recorded as `it.todo(...)` (a potential
 * bug for the author) instead of asserting the wrong behaviour. The suite stays
 * green.
 *
 * The helpers are heterogeneous (different keyword unions, single- vs
 * multi-value signatures, `.css()` return types that widen to `number`). To
 * drive them from data tables, each row's helper is stored behind a loose call
 * signature (`AnyHelper`) and the precise imported helper is adapted into it.
 * This only loosens the TEST-side view of an already-typed helper; it never
 * touches the helper implementations.
 */

/** A loose, render-only view of any css-value helper, for table-driven tests. */
type AnyHelper = (...args: readonly unknown[]) => {
  css: () => string | number;
};

/** Adapt a precisely-typed helper to the loose table view (test-side only). */
const loose = (helper: unknown): AnyHelper => helper as AnyHelper;

describe('css-value layer: intended-behaviour coverage sweep', () => {
  // --- Single-value spec helpers: both-bounds (clamp-capable) -------------

  describe('opacity family + fontWeight (both bounds: throw vs clamp)', () => {
    const bounded: ReadonlyArray<{
      name: string;
      helper: AnyHelper;
      inRange: number;
      belowMin: number;
      aboveMax: number;
      clampedLow: string;
      clampedHigh: string;
    }> = [
      {
        name: 'opacity',
        helper: loose(opacity),
        inRange: 0.5,
        belowMin: -0.5,
        aboveMax: 1.5,
        clampedLow: '0',
        clampedHigh: '1',
      },
      {
        name: 'fillOpacity',
        helper: loose(fillOpacity),
        inRange: 0.25,
        belowMin: -1,
        aboveMax: 2,
        clampedLow: '0',
        clampedHigh: '1',
      },
      {
        name: 'strokeOpacity',
        helper: loose(strokeOpacity),
        inRange: 0.25,
        belowMin: -1,
        aboveMax: 2,
        clampedLow: '0',
        clampedHigh: '1',
      },
      {
        name: 'stopOpacity',
        helper: loose(stopOpacity),
        inRange: 0.25,
        belowMin: -1,
        aboveMax: 2,
        clampedLow: '0',
        clampedHigh: '1',
      },
      {
        name: 'floodOpacity',
        helper: loose(floodOpacity),
        inRange: 0.25,
        belowMin: -1,
        aboveMax: 2,
        clampedLow: '0',
        clampedHigh: '1',
      },
      {
        name: 'shapeImageThreshold',
        helper: loose(shapeImageThreshold),
        inRange: 0.25,
        belowMin: -1,
        aboveMax: 2,
        clampedLow: '0',
        clampedHigh: '1',
      },
      {
        name: 'fontWeight',
        helper: loose(fontWeight),
        inRange: 700,
        belowMin: 0,
        aboveMax: 1200,
        clampedLow: '1',
        clampedHigh: '1000',
      },
    ];

    for (const row of bounded) {
      describe(row.name, () => {
        it('renders an in-range number', () => {
          expect(row.helper(row.inRange).css()).toBe(
            String(row.inRange),
          );
        });

        it('throws on out-of-range by default', () => {
          expect(() => row.helper(row.belowMin)).toThrow(
            /below the minimum/,
          );
          expect(() => row.helper(row.aboveMax)).toThrow(
            /above the maximum/,
          );
        });

        it('clamps out-of-range with { outOfRange: clamp }', () => {
          expect(
            row.helper(row.belowMin, { outOfRange: 'clamp' }).css(),
          ).toBe(row.clampedLow);
          expect(
            row.helper(row.aboveMax, { outOfRange: 'clamp' }).css(),
          ).toBe(row.clampedHigh);
        });

        it('throws on non-finite inputs (NaN, Infinity)', () => {
          expect(() => row.helper(Number.NaN)).toThrow(/finite/);
          expect(() => row.helper(Number.POSITIVE_INFINITY)).toThrow(
            /finite/,
          );
          expect(() => row.helper(Number.NEGATIVE_INFINITY)).toThrow(
            /finite/,
          );
        });
      });
    }
  });

  // --- Single-value spec helpers: open-bound (no clamp) -------------------

  describe('open-bound floats (min only, no max: throw-only)', () => {
    const openFloats: ReadonlyArray<{
      name: string;
      helper: AnyHelper;
      belowMin: number;
    }> = [
      { name: 'lineHeight', helper: loose(lineHeight), belowMin: -1 },
      { name: 'flexGrow', helper: loose(flexGrow), belowMin: -1 },
      { name: 'flexShrink', helper: loose(flexShrink), belowMin: -1 },
      {
        name: 'animationIterationCount',
        helper: loose(animationIterationCount),
        belowMin: -1,
      },
      {
        name: 'fontSizeAdjust',
        helper: loose(fontSizeAdjust),
        belowMin: -1,
      },
      { name: 'zoom', helper: loose(zoom), belowMin: -1 },
      // strokeMiterlimit has min 1.
      {
        name: 'strokeMiterlimit',
        helper: loose(strokeMiterlimit),
        belowMin: 0,
      },
    ];

    for (const row of openFloats) {
      describe(row.name, () => {
        it('renders an in-range number', () => {
          expect(row.helper(2).css()).toBe('2');
        });

        it('throws below the minimum', () => {
          expect(() => row.helper(row.belowMin)).toThrow(
            /below the minimum/,
          );
        });

        it('throws on non-finite inputs (NaN, Infinity)', () => {
          expect(() => row.helper(Number.NaN)).toThrow(/finite/);
          expect(() => row.helper(Number.POSITIVE_INFINITY)).toThrow(
            /finite/,
          );
        });
      });
    }
  });

  // --- Single-value spec helpers: integer rows ---------------------------

  describe('integer rows (reject non-integers)', () => {
    const intRows: ReadonlyArray<{
      name: string;
      helper: AnyHelper;
      ok: number;
      belowMin?: number;
    }> = [
      { name: 'zIndex', helper: loose(zIndex), ok: 5 },
      { name: 'order', helper: loose(order), ok: -3 },
      { name: 'mathDepth', helper: loose(mathDepth), ok: 2 },
      {
        name: 'columnCount',
        helper: loose(columnCount),
        ok: 3,
        belowMin: 0,
      },
      { name: 'orphans', helper: loose(orphans), ok: 2, belowMin: 0 },
      { name: 'widows', helper: loose(widows), ok: 2, belowMin: 0 },
      {
        name: 'lineClamp',
        helper: loose(lineClamp),
        ok: 3,
        belowMin: 0,
      },
    ];

    for (const row of intRows) {
      describe(row.name, () => {
        it('renders an integer', () => {
          expect(row.helper(row.ok).css()).toBe(String(row.ok));
        });

        it('throws on a non-integer', () => {
          expect(() => row.helper(2.5)).toThrow(
            /expected an integer/,
          );
        });

        it('throws on non-finite inputs (NaN, Infinity)', () => {
          expect(() => row.helper(Number.NaN)).toThrow(/finite/);
          expect(() => row.helper(Number.POSITIVE_INFINITY)).toThrow(
            /finite/,
          );
        });

        if (row.belowMin !== undefined) {
          it('throws below the minimum', () => {
            expect(() => row.helper(row.belowMin)).toThrow(
              /below the minimum/,
            );
          });
        }
      });
    }
  });

  // --- Keyword companions: pass through; unknown keyword throws ----------

  describe('keyword companions pass through; unknown keyword throws', () => {
    const keyworded: ReadonlyArray<{
      name: string;
      helper: AnyHelper;
      keyword: string;
    }> = [
      {
        name: 'lineHeight',
        helper: loose(lineHeight),
        keyword: 'normal',
      },
      {
        name: 'animationIterationCount',
        helper: loose(animationIterationCount),
        keyword: 'infinite',
      },
      {
        name: 'fontSizeAdjust',
        helper: loose(fontSizeAdjust),
        keyword: 'none',
      },
      {
        name: 'fontSizeAdjust (from-font)',
        helper: loose(fontSizeAdjust),
        keyword: 'from-font',
      },
      {
        name: 'fontWeight',
        helper: loose(fontWeight),
        keyword: 'bold',
      },
      {
        name: 'fontWeight (lighter)',
        helper: loose(fontWeight),
        keyword: 'lighter',
      },
      { name: 'zIndex', helper: loose(zIndex), keyword: 'auto' },
      {
        name: 'mathDepth',
        helper: loose(mathDepth),
        keyword: 'auto-add',
      },
      {
        name: 'columnCount',
        helper: loose(columnCount),
        keyword: 'auto',
      },
      {
        name: 'lineClamp',
        helper: loose(lineClamp),
        keyword: 'none',
      },
    ];

    for (const row of keyworded) {
      describe(row.name, () => {
        it('passes the keyword through unchanged via .css()', () => {
          expect(row.helper(row.keyword).css()).toBe(row.keyword);
        });

        it('throws on an unknown keyword', () => {
          expect(() =>
            row.helper('definitely-not-a-keyword'),
          ).toThrow(/not a valid keyword/);
        });
      });
    }

    it('keywordless helpers reject any string', () => {
      // opacity (and the rest of the opacity family) declare no keywords, so
      // every string is rejected.
      expect(() => loose(opacity)('auto')).toThrow(
        /not a valid keyword/,
      );
      expect(() => loose(flexGrow)('none')).toThrow(
        /not a valid keyword/,
      );
      expect(() => loose(order)('auto')).toThrow(
        /not a valid keyword/,
      );
    });
  });

  // --- Instance-level clamp default vs throw ------------------------------

  describe('instance-wide outOfRange default', () => {
    it('a clamp instance clamps both-bound helpers', () => {
      const clamped = createCssValues({ outOfRange: 'clamp' });
      expect(clamped.opacity(2).css()).toBe('1');
      expect(clamped.fontWeight(0).css()).toBe('1');
      expect(clamped.fontWeight(5000).css()).toBe('1000');
    });

    it('clamps the bounded side of a single-bound helper, leaves the open side', () => {
      const clamped = createCssValues({ outOfRange: 'clamp' });
      // flexGrow has only a min: a large value has no max to clamp to and stays
      // untouched, while a below-min value is pulled up to the min (one-way).
      expect(clamped.flexGrow(9).css()).toBe('9');
      expect(clamped.flexGrow(-1).css()).toBe('0');
    });
  });

  // --- Multi-value helpers: counters -------------------------------------

  describe('counters (counterReset / counterIncrement / counterSet)', () => {
    const counters: ReadonlyArray<{
      name: string;
      helper: AnyHelper;
      defaultRender: string;
    }> = [
      {
        name: 'counterReset',
        helper: loose(counterReset),
        defaultRender: 'page 0',
      },
      {
        name: 'counterIncrement',
        helper: loose(counterIncrement),
        defaultRender: 'page 1',
      },
      {
        name: 'counterSet',
        helper: loose(counterSet),
        defaultRender: 'page 0',
      },
    ];

    for (const row of counters) {
      describe(row.name, () => {
        it('renders an ident with the default integer', () => {
          expect(row.helper('page').css()).toBe(row.defaultRender);
        });

        it('passes the none keyword through unchanged', () => {
          expect(row.helper('none').css()).toBe('none');
        });

        it('throws on a non-integer counter value', () => {
          expect(() =>
            row.helper([
              'page',
              1.5,
            ]),
          ).toThrow(/expected an integer/);
        });

        it('throws on a non-finite counter value', () => {
          expect(() =>
            row.helper([
              'page',
              Number.POSITIVE_INFINITY,
            ]),
          ).toThrow(/finite/);
          expect(() =>
            row.helper([
              'page',
              Number.NaN,
            ]),
          ).toThrow(/finite/);
        });

        it('throws on an invalid custom-ident', () => {
          expect(() => row.helper('1bad')).toThrow(
            /not a valid <custom-ident>/,
          );
        });
      });
    }
  });

  // --- Multi-value helpers: grid lines -----------------------------------

  describe('grid lines (gridRow/Column Start/End)', () => {
    const gridHelpers: ReadonlyArray<{
      name: string;
      helper: AnyHelper;
    }> = [
      { name: 'gridRowStart', helper: loose(gridRowStart) },
      { name: 'gridRowEnd', helper: loose(gridRowEnd) },
      { name: 'gridColumnStart', helper: loose(gridColumnStart) },
      { name: 'gridColumnEnd', helper: loose(gridColumnEnd) },
    ];

    for (const row of gridHelpers) {
      describe(row.name, () => {
        it('renders a nonzero integer line', () => {
          expect(row.helper(2).css()).toBe('2');
          expect(row.helper(-1).css()).toBe('-1');
        });

        it('passes the auto keyword through unchanged', () => {
          expect(row.helper('auto').css()).toBe('auto');
        });

        it('renders a span N value', () => {
          expect(row.helper(span(2)).css()).toBe('span 2');
        });

        it('throws on a non-integer line', () => {
          expect(() => row.helper(1.5)).toThrow(
            /expected an integer/,
          );
        });

        it('throws on a non-finite line', () => {
          expect(() => row.helper(Number.POSITIVE_INFINITY)).toThrow(
            /finite/,
          );
        });

        it('throws on span below 1 (out of bound)', () => {
          expect(() => row.helper(span(0))).toThrow(
            /below the minimum/,
          );
        });

        it('throws on an invalid named line', () => {
          expect(() => row.helper('1bad')).toThrow(
            /not a valid <custom-ident>/,
          );
        });
      });
    }
  });

  // --- Multi-value helpers: scale ----------------------------------------

  describe('scale', () => {
    it('renders one to three factors', () => {
      expect(scale(2).css()).toBe('2');
      expect(scale(1, 2, 3).css()).toBe('1 2 3');
    });

    it('passes the none keyword through unchanged', () => {
      expect(scale('none').css()).toBe('none');
    });

    it('throws on a non-finite factor', () => {
      expect(() => scale(Number.POSITIVE_INFINITY)).toThrow(/finite/);
      expect(() => scale(1, Number.NaN)).toThrow(/finite/);
    });
  });

  // --- Multi-value helpers: tab-size -------------------------------------

  describe('tabSize', () => {
    it('renders a non-negative number (integer not required)', () => {
      expect(tabSize(4).css()).toBe('4');
      expect(tabSize(2.5).css()).toBe('2.5');
    });

    it('throws below the minimum (negative)', () => {
      expect(() => tabSize(-1)).toThrow(/below the minimum/);
    });

    it('throws on a non-finite number', () => {
      expect(() => tabSize(Number.POSITIVE_INFINITY)).toThrow(
        /finite/,
      );
      expect(() => tabSize(Number.NaN)).toThrow(/finite/);
    });
  });

  // --- Multi-value helpers: border-image / mask-border multipliers -------

  describe('border-image / mask-border edge-quad helpers', () => {
    const edgeQuads: ReadonlyArray<{
      name: string;
      helper: AnyHelper;
      hasAuto: boolean;
    }> = [
      {
        name: 'borderImageWidth',
        helper: loose(borderImageWidth),
        hasAuto: true,
      },
      {
        name: 'borderImageOutset',
        helper: loose(borderImageOutset),
        hasAuto: false,
      },
      {
        name: 'maskBorderWidth',
        helper: loose(maskBorderWidth),
        hasAuto: true,
      },
      {
        name: 'maskBorderOutset',
        helper: loose(maskBorderOutset),
        hasAuto: false,
      },
    ];

    for (const row of edgeQuads) {
      describe(row.name, () => {
        it('renders one to four numbers', () => {
          expect(row.helper(1).css()).toBe('1');
          expect(row.helper(1, 2, 3, 4).css()).toBe('1 2 3 4');
        });

        it('throws below the minimum (negative)', () => {
          expect(() => row.helper(-1)).toThrow(/below the minimum/);
        });

        it('throws on a non-finite number', () => {
          expect(() => row.helper(Number.POSITIVE_INFINITY)).toThrow(
            /finite/,
          );
        });

        if (row.hasAuto) {
          it('passes the auto keyword through unchanged', () => {
            expect(row.helper('auto').css()).toBe('auto');
          });
        }

        it('throws on an unknown keyword', () => {
          expect(() => row.helper('bogus')).toThrow(
            /not a valid keyword/,
          );
        });
      });
    }
  });

  // --- Multi-value helpers: slice tier -----------------------------------

  describe('border-image-slice / mask-border-slice', () => {
    const sliceHelpers: ReadonlyArray<{
      name: string;
      helper: AnyHelper;
    }> = [
      { name: 'borderImageSlice', helper: loose(borderImageSlice) },
      { name: 'maskBorderSlice', helper: loose(maskBorderSlice) },
    ];

    for (const row of sliceHelpers) {
      describe(row.name, () => {
        it('renders one to four numbers', () => {
          expect(row.helper(30).css()).toBe('30');
          expect(row.helper(10, 20, 30, 40).css()).toBe(
            '10 20 30 40',
          );
        });

        it('passes the trailing fill keyword through unchanged', () => {
          expect(row.helper(30, 'fill').css()).toBe('30 fill');
        });

        it('throws below the minimum (negative)', () => {
          expect(() => row.helper(-1)).toThrow(/below the minimum/);
        });

        it('throws on a non-finite number', () => {
          expect(() => row.helper(Number.POSITIVE_INFINITY)).toThrow(
            /finite/,
          );
        });
      });
    }
  });

  // --- Multi-value helpers: stroke number-or-length tier -----------------

  describe('stroke tier (strokeWidth / strokeDashoffset / strokeDasharray)', () => {
    it('strokeWidth renders a non-negative number and throws otherwise', () => {
      expect(strokeWidth(2).css()).toBe('2');
      expect(() => strokeWidth(-1)).toThrow(/below the minimum/);
      expect(() => strokeWidth(Number.POSITIVE_INFINITY)).toThrow(
        /finite/,
      );
    });

    it('strokeDashoffset renders any finite number and throws on non-finite', () => {
      expect(strokeDashoffset(5).css()).toBe('5');
      expect(strokeDashoffset(-5).css()).toBe('-5');
      expect(() => strokeDashoffset(Number.NaN)).toThrow(/finite/);
      expect(() =>
        strokeDashoffset(Number.POSITIVE_INFINITY),
      ).toThrow(/finite/);
    });

    it('strokeDasharray renders a list and passes none through', () => {
      expect(strokeDasharray(4, 2).css()).toBe('4 2');
      expect(strokeDasharray('none').css()).toBe('none');
    });

    it('strokeDasharray throws below the minimum and on non-finite', () => {
      expect(() => strokeDasharray(-1)).toThrow(/below the minimum/);
      expect(() => strokeDasharray(Number.POSITIVE_INFINITY)).toThrow(
        /finite/,
      );
    });
  });
});
