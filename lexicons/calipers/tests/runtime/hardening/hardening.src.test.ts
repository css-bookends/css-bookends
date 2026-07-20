// The full hardening spectrum: i/f imperative hardening (existing), m's quartet
// (existing), m CARRYING an ingested hardened scalar (new), and the config-driven
// reaction (`warn` / `fail`) when arithmetic breaks a carried bound (new).
//
// Per docs/foundations.md: the hardening reaction is config-driven via the shared
// `Hardening = 'warn' | 'fail'` type, set on the m() factory (and the
// codex / compendium bundle `global`). Default is `fail` (preserves i/f's throw).
// The i/f + quartet blocks are regression coverage; the carry + config blocks
// exercise the new m behaviour.
import { describe, expect, it, vi } from 'vitest';

import { createFloat, createInteger, f, i } from '../../../src';
import { createCalipers } from '../../../src/factory';
import {
  inRange,
  m,
  nonNegative,
} from '../../support/calipers_tests.src';

describe('hardening spectrum', () => {
  /* ---- i / f imperative hardening (existing behaviour; regression) ---- */
  describe('i / f bounded builders re-validate through arithmetic', () => {
    it('a bounded integer enforces its bound at construction', () => {
      const { i: fontWeight } = createInteger({ min: 1, max: 1000 });
      expect(fontWeight(700).value()).toBe(700);
      expect(() => fontWeight(0)).toThrow(/below the minimum/);
      expect(() => fontWeight(1200)).toThrow(/above the maximum/);
    });

    it('a bounded integer re-validates through arithmetic (throws on breach)', () => {
      const { i: bounded } = createInteger({ min: 0, max: 10 });
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
      const { f: alpha } = createFloat({ min: 0, max: 1 });
      expect(() => alpha(0.6).multiply(2)).toThrow(
        /above the maximum/,
      ); // 1.2 > 1
    });
  });

  /* ---- m direct hardening via the quartet (existing) ---- */
  describe('m quartet (nonNegative / inRange)', () => {
    it('ensure passes in-bounds and throws out-of-bounds', () => {
      expect(nonNegative.ensure(m(4)).css()).toBe('4px');
      expect(() => nonNegative.ensure(m(-1))).toThrow();
      expect(inRange(0, 10).ensure(m(5)).css()).toBe('5px');
      expect(() => inRange(0, 10).ensure(m(15))).toThrow();
    });
  });

  /* ---- NEW: m carries an ingested hardened scalar ---- */
  describe('m carries an ingested hardened scalar', () => {
    it('keeps the scalar bounds as m.constraints()', () => {
      expect(m(i(8, { min: 0, max: 10 })).constraints()).toEqual({
        min: 0,
        max: 10,
      });
    });

    it('an unhardened scalar carries no constraints', () => {
      expect(m(i(8)).constraints()).toEqual({});
    });
  });

  /* ---- NEW: config-driven reaction when math breaks a carried bound ---- */
  describe('hardening config when arithmetic breaks a carried bound', () => {
    // A PLAIN-number measurement takes the bundle / measurement hardening (an ingested
    // scalar would own its own reaction), so these exercise the measurement cascade.
    it("'warn' warns but proceeds", () => {
      const spy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const cal = createCalipers({ hardening: 'warn' });
      expect(cal.m(8, { min: 0, max: 10 }).multiply(2).css()).toBe(
        '16px',
      );
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("'fail' throws on the breaking operation", () => {
      const cal = createCalipers({ hardening: 'fail' });
      expect(() => cal.m(8, { min: 0, max: 10 }).multiply(2)).toThrow(
        /above the maximum/,
      );
    });

    it('an in-bounds operation never reacts, regardless of config', () => {
      const cal = createCalipers({ hardening: 'fail' });
      expect(cal.m(8, { min: 0, max: 10 }).multiply(1).css()).toBe(
        '8px',
      );
    });

    it('an unhardened scalar never reacts, regardless of config', () => {
      const cal = createCalipers({ hardening: 'fail' });
      expect(cal.m(i(8)).multiply(2).css()).toBe('16px');
    });
  });
});

describe('construction-time hardening reaction (i / f)', () => {
  it("'warn' drops the violated edge, keeps the valid one", () => {
    const spy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const v = i(50, { min: 0, max: 10, hardening: 'warn' });
    expect(spy).toHaveBeenCalled();
    expect(v.constraints()).toEqual({ min: 0 });
    spy.mockRestore();
  });

  it("'fail' throws (unchanged)", () => {
    expect(() =>
      i(50, { min: 0, max: 10, hardening: 'fail' }),
    ).toThrow(/above the maximum/);
  });

  it('float mirrors: warn drops the violated edge', () => {
    const spy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    expect(
      f(1.5, { min: 0, max: 1, hardening: 'warn' }).constraints(),
    ).toEqual({ min: 0 });
    spy.mockRestore();
  });
});
