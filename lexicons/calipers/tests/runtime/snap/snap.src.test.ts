// Snap: the opt-in reaction that ABSORBS a bound breach to the limit instead of throwing. A snapped
// edge pulls an out-of-range value TO its limit (silently); an un-snapped edge still throws. snap is
// per-EDGE (min / max react independently), runs AFTER the modifier, and keeps the bound (so
// `.constraints()` is unchanged). Per docs/foundations.md ("Snap: absorb a breach to the limit").
//
// RED-FIRST: snap is not implemented yet, so every "snaps to the limit" case currently THROWS (or
// leaves the value un-absorbed); each such assertion fails until the code lands.
import { describe, expect, it } from 'vitest';

import {
  createFloatFactory,
  createIntegerFactory,
  f,
  i,
} from '../../../src';

describe('snap absorbs a breach to the limit', () => {
  /* ---- blanket snap governs BOTH edges ---- */
  describe('blanket snap: true', () => {
    it('snaps an above-max construction value down to max', () => {
      expect(i(50, { min: 0, max: 10, snap: true }).value()).toBe(10);
    });

    it('snaps a below-min construction value up to min', () => {
      expect(i(-5, { min: 0, max: 10, snap: true }).value()).toBe(0);
    });

    it('snaps an above-max ARITHMETIC result down to max', () => {
      const { i: bounded } = createIntegerFactory({
        min: 0,
        max: 10,
        snap: true,
      });
      expect(bounded(8).multiply(2).value()).toBe(10); // 16 -> 10
    });

    it('leaves an in-bounds value untouched', () => {
      expect(i(7, { min: 0, max: 10, snap: true }).value()).toBe(7);
    });
  });

  /* ---- per-edge snap: min and max react independently ---- */
  describe('per-edge snap (min / max independent)', () => {
    it('snaps the snapped edge, THROWS on the un-snapped edge', () => {
      const opts = {
        min: { value: 0, snap: true },
        max: { value: 10, snap: false },
      };
      expect(i(-5, opts).value()).toBe(0); // min absorbs
      expect(() => i(50, opts)).toThrow(/above the maximum/); // max throws
    });

    it('the mirror: max snaps, min throws', () => {
      const opts = {
        min: { value: 0, snap: false },
        max: { value: 10, snap: true },
      };
      expect(i(50, opts).value()).toBe(10);
      expect(() => i(-5, opts)).toThrow(/below the minimum/);
    });
  });

  /* ---- blanket + one edge opting out ---- */
  it('blanket true, one edge snap:false: that edge throws, the other snaps', () => {
    const opts = {
      min: 0,
      max: { value: 10, snap: false },
      snap: true,
    };
    expect(i(-5, opts).value()).toBe(0); // blanket governs min -> snaps
    expect(() => i(50, opts)).toThrow(/above the maximum/); // max opts out
  });

  /* ---- single-edge snap ---- */
  it('snaps a single bounded edge, leaves the open side unbounded', () => {
    expect(i(50, { max: { value: 10, snap: true } }).value()).toBe(
      10,
    );
    expect(i(-999, { max: { value: 10, snap: true } }).value()).toBe(
      -999,
    ); // no min
  });

  /* ---- pipeline: modifier THEN snap ---- */
  it('snap catches an out-of-range value the modifier produced', () => {
    const v = i(5, {
      max: { value: 10, snap: true },
      modifier: () => 100,
    });
    expect(v.value()).toBe(10); // modifier -> 100, snap -> 10
  });

  /* ---- snap keeps the bound ---- */
  it('a snapped value keeps its bound (constraints unchanged)', () => {
    expect(
      i(50, { min: 0, max: 10, snap: true }).constraints(),
    ).toEqual({ min: 0, max: 10 });
  });

  /* ---- no snap (default) still throws ---- */
  it('an un-snapped bound still throws (the default)', () => {
    expect(() => i(50, { min: 0, max: 10 })).toThrow(
      /above the maximum/,
    );
  });

  /* ---- float mirrors ---- */
  it('float snaps the same way', () => {
    const { f: alpha } = createFloatFactory({
      min: 0,
      max: 1,
      snap: true,
    });
    expect(alpha(0.6).multiply(2).value()).toBe(1); // 1.2 -> 1
    expect(f(2, { min: 0, max: 1, snap: true }).value()).toBe(1);
  });
});
