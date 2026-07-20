import { describe, expect, it } from 'vitest';

import { u } from '../../../src/internal/unspecified';

// `u` is the internal, NON-public "unspecified number" scalar: a sibling of i / f on the shared
// ScalarImpl base, used by `m` to wrap a plain number. It accepts any finite number (no integer
// check, like f), it is config-NEUTRAL (it carries only the options it is handed, never an i/f
// lexicon config), and it labels its own errors "u". It is never exported from the package.
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

  it('carries only the config it is handed (bound, modifier)', () => {
    expect(u(5, { min: 0, max: 10 }).constraints()).toEqual({
      min: 0,
      max: 10,
    });
    // a modifier the caller hands it still applies at intake
    expect(u(5.9, { modifier: 'floor' }).value()).toBe(5);
  });

  it('re-validates its bound through arithmetic', () => {
    expect(u(5, { max: 10 }).add(3).value()).toBe(8);
    expect(() => u(5, { max: 10 }).add(10)).toThrow(
      /above the maximum/,
    );
  });

  it('labels its own errors "u"', () => {
    expect(() => u(5, { max: 3 })).toThrow(/^u:/);
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

  it('clone() preserves value and bound', () => {
    const copy = u(5, { min: 0, max: 10 }).clone();
    expect(copy.value()).toBe(5);
    expect(copy.constraints()).toEqual({ min: 0, max: 10 });
  });
});
