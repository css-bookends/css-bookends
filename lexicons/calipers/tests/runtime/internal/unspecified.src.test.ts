import { describe, expect, it } from 'vitest';

import { u } from '../../../src/internal/unspecified';

// `u` is the internal, NON-public "unspecified number" scalar. Unlike i / f (which extend the checked
// ScalarRestricted base), `u` extends the BARE ScalarBase, so it carries NO numeric config at all: no
// bound, no modifier, no hardening. It is `m`'s neutral wrap for a plain number: it accepts any finite
// number (no integer check, like f), takes only error plumbing, and labels its own errors "u". It is
// never exported from the package.
describe('u (internal unspecified number)', () => {
  it('accepts any finite number, integer or fractional (no integer check)', () => {
    expect(u(5).value()).toBe(5);
    expect(u(5.5).value()).toBe(5.5);
    expect(u(5).css()).toBe('5');
    expect(u(5.5).css()).toBe('5.5');
  });

  it('rejects non-finite values', () => {
    expect(() => u(Number.NaN)).toThrow(/finite/);
    expect(() => u(Number.POSITIVE_INFINITY)).toThrow(/finite/);
  });

  it('carries NO stored bound or modifier: it is the deliberately unspecified scalar', () => {
    // `u` accepts any finite value and stores no numeric config, so constraints() is always empty.
    // A bound / modifier is a TYPE error on `u` (locked structurally: `u` extends the bare base).
    expect(u(5).value()).toBe(5);
    expect(u(-42.5).value()).toBe(-42.5);
    expect(u(5).constraints()).toEqual({
      min: undefined,
      max: undefined,
    });
    expect(u(-42.5).constraints()).toEqual({
      min: undefined,
      max: undefined,
    });
  });

  it('arithmetic is unrestricted (no stored bound to breach) but stays finite', () => {
    // With no bound, arithmetic never reacts; the only guard left is finiteness.
    expect(u(5).add(3).value()).toBe(8);
    expect(u(5).add(100).value()).toBe(105);
    expect(u(5).multiply(2).constraints()).toEqual({
      min: undefined,
      max: undefined,
    });
    expect(() => u(5).divide(0)).toThrow(/zero/);
  });

  it('clamps within bounds via a public clamp() (unbranded, u stays unspecified)', () => {
    // A measurement delegates clamp() to whatever scalar it embeds, so `u` exposes a public clamp().
    // Unlike i/f it carries no InRange brand: `u` is the deliberately unspecified scalar.
    // integer values and bounds
    expect(u(15).clamp(0, 10).value()).toBe(10);
    expect(u(-3).clamp(0, 10).value()).toBe(0);
    expect(u(5).clamp(0, 10).value()).toBe(5);
    // `u` accepts any finite number, so clamp works on fractional values AND fractional bounds
    expect(u(15.7).clamp(0, 10.5).value()).toBe(10.5);
    expect(u(-3.2).clamp(0.5, 10).value()).toBe(0.5);
    expect(u(5.25).clamp(0.5, 10.5).value()).toBe(5.25);
    expect(() => u(5).clamp(10, 0)).toThrow(/min .* must be <= max/);
  });

  it('labels its own errors "u"', () => {
    // `u` has no bound to breach, so a finiteness violation is the construction error that names it.
    expect(() => u(Number.NaN)).toThrow(/^u:/);
  });

  it('prefixes errors with a wrapper label when embedded (m(u): ...)', () => {
    // A measurement passes wrapperLabel: 'm' when it embeds a scalar, so the throw names BOTH the
    // wrapper and the kind. Without a wrapper it stays "u: ...".
    expect(() => u(Number.NaN, { wrapperLabel: 'm' })).toThrow(
      /^m\(u\):/,
    );
    expect(() => u(Number.NaN)).toThrow(/^u:/);
  });

  it('reports whether its CURRENT value is whole or fractional (value-based)', () => {
    // `u` is unspecified, but you can still ask what the value currently is.
    expect(u(5).isInt()).toBe(true);
    expect(u(5).isFloat()).toBe(false);
    expect(u(5.5).isInt()).toBe(false);
    expect(u(5.5).isFloat()).toBe(true);
  });

  it('reports its kind() as "u"', () => {
    expect(u(5).kind()).toBe('u');
  });

  it('is immutable: an operation returns a NEW value and never mutates the source (isInt cannot go stale)', () => {
    // Regression lock: green today because scalars are immutable, but it fails the moment any
    // operation writes to `this`, which would let value() / isInt() on the source go stale.
    const orig = u(5); // whole -> isInt() true
    const half = orig.multiply(0.1); // a NEW u: 0.5, fractional
    expect(half.value()).toBe(0.5);
    expect(half.isInt()).toBe(false);
    // the source is untouched by the derivation
    expect(orig.value()).toBe(5);
    expect(orig.isInt()).toBe(true);
    // a second derivation also leaves the source alone
    expect(orig.multiply(2).value()).toBe(10);
    expect(orig.value()).toBe(5);
    expect(orig.isInt()).toBe(true);
  });

  it('clone() preserves the value (and the empty constraints)', () => {
    const copy = u(5).clone();
    expect(copy.value()).toBe(5);
    expect(copy.constraints()).toEqual({
      min: undefined,
      max: undefined,
    });
  });
});
