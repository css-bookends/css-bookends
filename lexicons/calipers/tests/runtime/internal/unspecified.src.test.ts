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

  it('clone() preserves value and bound', () => {
    const copy = u(5, { min: 0, max: 10 }).clone();
    expect(copy.value()).toBe(5);
    expect(copy.constraints()).toEqual({ min: 0, max: 10 });
  });
});
