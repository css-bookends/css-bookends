import { describe, expect, it, vi } from 'vitest';

import { f, i, isInteger } from '../../support/calipers_tests.src';

describe('Integer primitive (src)', () => {
  it('creates an integer and renders it', () => {
    const n = i(42);
    expect(n.value()).toBe(42);
    expect(n.valueOf()).toBe(42);
    expect(n.css()).toBe('42');
    expect(n.toString()).toBe('42');
    expect(+n).toBe(42);
  });

  it('rejects non-integers and non-finite values', () => {
    expect(() => i(2.5)).toThrow(/expected an integer/);
    expect(() => i(Number.NaN)).toThrow(/finite/);
    expect(() => i(Number.POSITIVE_INFINITY)).toThrow(/finite/);
  });

  it('enforces range constraints', () => {
    expect(() => i(0, { min: 1 })).toThrow(/below the minimum/);
    expect(() => i(11, { max: 10 })).toThrow(/above the maximum/);
    expect(i(5, { min: 1, max: 10 }).value()).toBe(5);
    expect(() => i(5, { min: 10, max: 1 })).toThrow(
      /min .* must be <= max/,
    );
  });

  it('re-validates through arithmetic (hardening survives)', () => {
    expect(i(4).add(2).css()).toBe('6');
    expect(i(4).subtract(1).value()).toBe(3);
    expect(i(4).multiply(3).value()).toBe(12);
    expect(i(4).add(i(2)).value()).toBe(6);
    expect(() => i(5).multiply(0.5)).toThrow(/expected an integer/);
    expect(() => i(5, { max: 10 }).add(20)).toThrow(
      /above the maximum/,
    );
  });

  it('clamps within bounds', () => {
    expect(i(15).clamp(0, 10).value()).toBe(10);
    expect(i(-3).clamp(0, 10).value()).toBe(0);
    expect(() => i(5).clamp(10, 0)).toThrow(/min .* must be <= max/);
  });

  it('a per-value bound enforces reusable constraints (font-weight)', () => {
    const fontWeight = (v: number) => i(v, { min: 1, max: 1000 });
    expect(fontWeight(700).css()).toBe('700');
    expect(() => fontWeight(1200)).toThrow(/above the maximum/);
    expect(() => fontWeight(0)).toThrow(/below the minimum/);
  });

  it('a bounded value RE-VALIDATES its bound through arithmetic', () => {
    // a bounded value clones with the SAME constraints, so a result that leaves
    // [min, max] throws. This proves the bound survives arithmetic, not just .css().
    const fontWeight = (v: number) => i(v, { min: 1, max: 1000 });
    // in-range arithmetic still yields a hardened integer
    expect(fontWeight(700).add(100).value()).toBe(800);
    expect(fontWeight(500).multiply(2).value()).toBe(1000);
    // crossing the upper bound throws on the re-validation
    expect(() => fontWeight(900).add(200)).toThrow(
      /above the maximum/,
    );
    expect(() => fontWeight(600).multiply(2)).toThrow(
      /above the maximum/,
    );
    // crossing the lower bound throws too
    expect(() => fontWeight(100).subtract(200)).toThrow(
      /below the minimum/,
    );
    // a non-integer result still fails integer-ness even within range
    // (701 * 0.5 = 350.5, in range but not whole)
    expect(() => fontWeight(701).multiply(0.5)).toThrow(
      /expected an integer/,
    );
  });

  it('interoperates with typed scalar operands (i / f)', () => {
    // multiply by a typed integer or whole-valued float
    expect(i(4).multiply(i(2)).css()).toBe('8');
    expect(i(4).multiply(f(2)).css()).toBe('8');
    // a fractional float factor yields a non-integer result, which re-validates and throws
    expect(() => i(5).multiply(f(0.5))).toThrow(
      /expected an integer/,
    );
    // add / subtract accept the other typed scalar
    expect(i(4).add(i(3)).css()).toBe('7');
    expect(i(4).subtract(f(1)).css()).toBe('3');
  });

  it('divides and re-validates integer-ness', () => {
    expect(i(6).divide(2).css()).toBe('3');
    expect(i(6).divide(i(2)).css()).toBe('3');
    // a non-integer quotient re-validates through the constructor and throws
    expect(() => i(5).divide(2)).toThrow(/expected an integer/);
    // divide by zero throws (plain number and typed zero)
    expect(() => i(6).divide(0)).toThrow(/divide .* by zero/);
    expect(() => i(6).divide(i(0))).toThrow(/divide .* by zero/);
  });

  it('throws on a non-finite divide RESULT (overflow), before the integer re-validation', () => {
    // MAX_VALUE is a whole number, so it is a valid integer; dividing by a tiny
    // factor overflows to Infinity and hits the non-finite guard, not the
    // divide-by-zero guard and not the integer re-validation.
    expect(() => i(Number.MAX_VALUE).divide(1e-300)).toThrow(
      /non-finite result dividing/,
    );
    expect(() => i(Number.MAX_VALUE).divide(1e-300)).not.toThrow(
      /by zero/,
    );
  });

  it('reports its constraints via constraints()', () => {
    expect(i(5, { min: 1, max: 10 }).constraints()).toEqual({
      min: 1,
      max: 10,
    });
    expect(i(5).constraints()).toEqual({
      min: undefined,
      max: undefined,
    });
  });

  it('detects integers', () => {
    expect(isInteger(i(3))).toBe(true);
    expect(isInteger(3)).toBe(false);
    expect(isInteger({})).toBe(false);
    expect(isInteger(null)).toBe(false);
  });

  it('reports its kind() as "i"', () => {
    expect(i(5).kind()).toBe('i');
  });

  it('prefixes errors with a wrapper label when embedded (m(i): ...)', () => {
    // both the bound-breach and the integer-check errors carry the wrapper.
    expect(() => i(15, { wrapperLabel: 'm', max: 10 })).toThrow(
      /^m\(i\):/,
    );
    expect(() => i(2.5, { wrapperLabel: 'm' })).toThrow(
      /^m\(i\): expected an integer/,
    );
  });

  it('clone() copies the value and the bound', () => {
    const orig = i(700, { min: 100, max: 900 });
    const copy = orig.clone();
    expect(copy.value()).toBe(700);
    expect(copy.constraints()).toEqual(orig.constraints());
    expect(copy.constraints()).toEqual({ min: 100, max: 900 });
  });

  it('clone is independent: deriving from the ORIGINAL leaves the clone untouched', () => {
    // Scalars are immutable, so "editing" means deriving a new value. That derivation must
    // not leak into the clone. (Regression lock: green today, guards a future shared-state slip.)
    const orig = i(700, { min: 100, max: 900 });
    const copy = orig.clone();
    const derived = orig.withValue(300);
    expect(derived.value()).toBe(300); // the derived value did change
    expect(copy.value()).toBe(700); // the clone did NOT
    expect(copy.constraints()).toEqual({ min: 100, max: 900 });
  });

  it('clone is independent: deriving from the CLONE leaves the original untouched', () => {
    const orig = i(700, { min: 100, max: 900 });
    const copy = orig.clone();
    const derived = copy.multiply(1).withValue(300);
    expect(derived.value()).toBe(300);
    expect(orig.value()).toBe(700);
    expect(orig.constraints()).toEqual({ min: 100, max: 900 });
  });
});

describe('Integer modifier (value transform at intake)', () => {
  it('the default fails loudly: a non-integer throws and no modifier runs', () => {
    const spy = vi.fn((n: number) => Math.floor(n));
    // With no modifier, a non-integer throws right away; the modifier path is never entered.
    expect(() => i(8.7)).toThrow(/expected an integer/);
    expect(() => i(5).multiply(4.44455222333)).toThrow(
      /expected an integer/,
    );
    expect(spy).not.toHaveBeenCalled();
    // The modifier is strictly opt-in: supply one and it runs (rescues 8.7 -> 8).
    expect(i(8.7, { modifier: spy }).value()).toBe(8);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("the 'floor' shortcut rounds down via Math.floor", () => {
    // 5 * 4.44455222333 = 22.2227... -> 22
    expect(
      i(5, { modifier: 'floor' }).multiply(4.44455222333).value(),
    ).toBe(22);
    expect(i(8.7, { modifier: 'floor' }).value()).toBe(8);
  });

  it("the 'ceil' shortcut rounds up via Math.ceil", () => {
    expect(
      i(5, { modifier: 'ceil' }).multiply(4.44455222333).value(),
    ).toBe(23);
    expect(i(8.2, { modifier: 'ceil' }).value()).toBe(9);
  });

  it("the 'round' shortcut rounds to nearest via Math.round", () => {
    expect(
      i(5, { modifier: 'round' }).multiply(4.44455222333).value(),
    ).toBe(22);
    expect(i(8.5, { modifier: 'round' }).value()).toBe(9);
  });

  it('accepts a custom modifier function', () => {
    expect(i(8.9, { modifier: (n) => Math.trunc(n) }).value()).toBe(
      8,
    );
  });

  it('a custom modifier can snap to a grid (font-weight multiples of 100)', () => {
    const snap100 = (n: number) => Math.round(n / 100) * 100;
    const weight = i(100, { modifier: snap100 });
    // 100 * 2.2 = 220 -> nearest 100 -> 200 (an integer input still gets snapped)
    expect(weight.multiply(2.2).value()).toBe(200);
    expect(weight.multiply(2.6).value()).toBe(300);
  });

  it('throws if the modifier still yields a non-integer', () => {
    expect(() => i(5.5, { modifier: (n) => n })).toThrow(
      /expected an integer/,
    );
  });

  it('a rounding shortcut is a no-op on an already-integer value', () => {
    expect(i(8, { modifier: 'ceil' }).value()).toBe(8);
  });

  it('carries the modifier through arithmetic and clone', () => {
    const grid = i(10, { modifier: 'round' });
    expect(grid.multiply(1.25).value()).toBe(13); // 12.5 -> 13
    expect(grid.clone().multiply(0.14).value()).toBe(1); // 1.4 -> 1
  });

  it('applies the modifier BEFORE the integer check AND the bound (intake order lock)', () => {
    // Raw 10.7 is non-integer AND over the max, but floored 10 passes both. If the modifier ran
    // after the integer check it would throw "expected an integer"; if it ran after the bound it
    // would throw "above the maximum". So this pins the pipeline order: modifier -> validate -> bound.
    expect(
      i(10.7, { modifier: 'floor', min: 0, max: 10 }).value(),
    ).toBe(10);
    // Min-side mirror: raw 0.3 is non-integer AND under the min, but ceiled 1 clears both.
    expect(
      i(0.3, { modifier: 'ceil', min: 1, max: 10 }).value(),
    ).toBe(1);
  });
});

describe('Integer warnOnNonIntegerInput (dirty-input diagnostic)', () => {
  it('warns when a non-integer enters the modifier, then the modifier fixes it', () => {
    const warn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    try {
      // 5 * 4.44... = 22.22 enters the rebuild (a non-integer) -> warn, then floor -> 22
      const v = i(5, {
        modifier: 'floor',
        warnOnNonIntegerInput: true,
      }).multiply(4.44455222333);
      expect(v.value()).toBe(22);
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  it('does not warn when the input is already an integer (even if the modifier re-grids it)', () => {
    const warn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    try {
      const snap100 = (n: number) => Math.round(n / 100) * 100;
      // 220 is a clean integer input -> no warn, though the modifier still snaps it to 200
      const v = i(220, {
        modifier: snap100,
        warnOnNonIntegerInput: true,
      });
      expect(v.value()).toBe(200);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('is off by default (a non-integer input is silently modified)', () => {
    const warn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    try {
      i(5, { modifier: 'floor' }).multiply(4.44455222333);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});
