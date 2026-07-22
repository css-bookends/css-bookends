// The bound spectrum: i/f imperative bounds, m's quartet, and m CARRYING an
// ingested bounded scalar. A bound is enforced by FAILING (throwing) when
// construction or arithmetic breaks it; there is no reaction knob (the old
// `hardening: 'warn' | 'fail'` config was retired 2026-07-21). If you do not want
// enforcement, use `u` (no bound); the planned `clamp` will absorb to the limit.
//
// Per docs/foundations.md: the bound lives on the config-bearing scalars i / f; a
// measurement enforces via the i / f it ingests, since m is a pure container.
import { describe, expect, it } from 'vitest';

import {
  createFloatFactory,
  createIntegerFactory,
  f,
  i,
} from '../../../src';
import {
  inRange,
  m,
  nonNegative,
} from '../../support/calipers_tests.src';

describe('bound spectrum', () => {
  /* ---- i / f imperative bounds (regression) ---- */
  describe('i / f bounded builders re-validate through arithmetic', () => {
    it('a bounded integer enforces its bound at construction', () => {
      const { i: fontWeight } = createIntegerFactory({
        min: 1,
        max: 1000,
      });
      expect(fontWeight(700).value()).toBe(700);
      expect(() => fontWeight(0)).toThrow(/below the minimum/);
      expect(() => fontWeight(1200)).toThrow(/above the maximum/);
    });

    it('a bounded integer re-validates through arithmetic (throws on breach)', () => {
      const { i: bounded } = createIntegerFactory({
        min: 0,
        max: 10,
      });
      expect(bounded(4).multiply(2).value()).toBe(8); // in bounds
      expect(() => bounded(8).multiply(2)).toThrow(
        /above the maximum/,
      ); // 16 > 10
    });

    it('exposes its bounds via .constraints()', () => {
      expect(i(4, { min: 0, max: 10 }).constraints()).toEqual({
        min: 0,
        max: 10,
      });
      expect(f(0.5, { min: 0, max: 1 }).constraints()).toEqual({
        min: 0,
        max: 1,
      });
    });

    it('a bounded float re-validates through arithmetic', () => {
      const { f: alpha } = createFloatFactory({ min: 0, max: 1 });
      expect(() => alpha(0.6).multiply(2)).toThrow(
        /above the maximum/,
      ); // 1.2 > 1
    });
  });

  /* ---- m direct bounds via the quartet ---- */
  describe('m quartet (nonNegative / inRange)', () => {
    it('ensure passes in-bounds and throws out-of-bounds', () => {
      expect(nonNegative.ensure(m(4)).css()).toBe('4px');
      expect(() => nonNegative.ensure(m(-1))).toThrow();
      expect(inRange(0, 10).ensure(m(5)).css()).toBe('5px');
      expect(() => inRange(0, 10).ensure(m(15))).toThrow();
    });
  });

  /* ---- m carries an ingested bounded scalar ---- */
  describe('m carries an ingested bounded scalar', () => {
    it('keeps the scalar bounds as m.constraints()', () => {
      expect(m(i(8, { min: 0, max: 10 })).constraints()).toEqual({
        min: 0,
        max: 10,
      });
    });

    it('an unbounded scalar carries no constraints', () => {
      expect(m(i(8)).constraints()).toEqual({});
    });
  });

  /* ---- m enforces the ingested scalar's bound (m holds no config) ---- */
  describe('a measurement enforces per the ingested scalar, not m', () => {
    // `m` is a pure container: it holds no bound of its own. The bound rides on the `i` / `f` handed
    // to `m()`, so a breach throws because the ingested scalar says so ("m ingests the scalar's
    // enforcement"). A plain-number measurement has no bound and never reacts.
    it('throws on the breaking operation', () => {
      expect(() => m(i(8, { min: 0, max: 10 })).multiply(2)).toThrow(
        /above the maximum/,
      );
    });

    it('an in-bounds operation never reacts', () => {
      expect(
        m(i(8, { min: 0, max: 10 }))
          .multiply(1)
          .css(),
      ).toBe('8px');
    });

    it('a plain-number or unbounded measurement never reacts', () => {
      expect(m(8).multiply(2).css()).toBe('16px');
      expect(m(i(8)).multiply(2).css()).toBe('16px');
    });
  });
});

describe('construction-time bound enforcement (i / f)', () => {
  it('an integer throws when the initial value is out of range', () => {
    expect(() => i(50, { min: 0, max: 10 })).toThrow(
      /above the maximum/,
    );
  });

  it('a float mirrors: throws when the initial value is out of range', () => {
    expect(() => f(1.5, { min: 0, max: 1 })).toThrow(
      /above the maximum/,
    );
  });
});
