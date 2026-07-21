// The full hardening spectrum: i/f imperative hardening (existing), m's quartet
// (existing), m CARRYING an ingested hardened scalar (new), and the config-driven
// reaction (`warn` / `fail`) when arithmetic breaks a carried bound (new).
//
// Per docs/foundations.md: the hardening reaction is config-driven via the shared
// `Hardening = 'warn' | 'fail'` type, set on the i() / f() factories (and the
// codex / compendium bundle `global`); a measurement reacts via the i / f it
// ingests, since m is a pure container. Default is `fail` (preserves i/f's throw).
// The i/f + quartet blocks are regression coverage; the carry + config blocks
// exercise the new m behaviour.
import { describe, expect, it, vi } from 'vitest';

import { createFloat, createInteger, f, i } from '../../../src';
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

  /* ---- m carries the ingested scalar's OWN reaction (m holds no config) ---- */
  describe('a measurement reacts per the ingested scalar, not m', () => {
    // `m` is a pure container: it holds no bound or hardening of its own. A bound + its reaction ride
    // on the `i` / `f` handed to `m()`, so the reaction is the ingested scalar's ("m ingests the
    // hardening"). A plain-number measurement has no bound and never reacts.
    it("'warn' warns but proceeds", () => {
      const spy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      expect(
        m(i(8, { min: 0, max: 10, hardening: 'warn' }))
          .multiply(2)
          .css(),
      ).toBe('16px');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it("'fail' throws on the breaking operation", () => {
      expect(() =>
        m(i(8, { min: 0, max: 10, hardening: 'fail' })).multiply(2),
      ).toThrow(/above the maximum/);
    });

    it('an in-bounds operation never reacts, regardless of config', () => {
      expect(
        m(i(8, { min: 0, max: 10, hardening: 'fail' }))
          .multiply(1)
          .css(),
      ).toBe('8px');
    });

    it('a plain-number or unhardened measurement never reacts', () => {
      expect(m(8).multiply(2).css()).toBe('16px');
      expect(m(i(8)).multiply(2).css()).toBe('16px');
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
