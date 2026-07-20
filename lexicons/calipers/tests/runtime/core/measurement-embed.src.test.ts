import { describe, expect, it } from 'vitest';

import { f, i, m } from '../../support/calipers_tests.src';

// SPEC for the "m embeds a scalar" work (todo item 1). Currently RED and DELIBERATELY so: today `m`
// does not embed the scalar nor name the subtype in its errors. When `m` embeds u / i / f, a failing
// operation must report the FULL chain: the measurement `m`, then the embedded subtype, then the
// specific error, e.g. `m(i): 5 is above the maximum 10`. More info, not less. The exact `m(...)`
// punctuation is adjustable at build time; what these pin is m -> subtype -> the specific error, all
// present. This file is NOT wired into the main `test` run yet; it is the driver for the embed phase.
describe('measurement errors report m, the subtype, and the specific error (PENDING embed work)', () => {
  it('a plain-number measurement: m(u) + the specific error', () => {
    // 5 is above the max of 3, so it throws at construction.
    expect(() => m(5, { max: 3 })).toThrow(
      /m\(u\).*above the maximum/,
    );
  });

  it('an integer-backed measurement: m(i) + the specific error', () => {
    // in-range at construction, then arithmetic breaks the ingested bound.
    expect(() => m(i(5, { max: 10 })).add(10)).toThrow(
      /m\(i\).*above the maximum/,
    );
  });

  it('a float-backed measurement: m(f) + the specific error', () => {
    expect(() => m(f(5), { max: 10 }).add(10)).toThrow(
      /m\(f\).*above the maximum/,
    );
  });
});

// The core of the rewire: m's math runs THROUGH the embedded scalar, so the scalar's rules
// (integer-ness, modifier, bound) hold across m's arithmetic and clone. Integer / modifier / clone
// cases are RED today (m drops that info); the u / f cases are GREEN locks the rewire must keep.
describe('measurement math delegates to the embedded scalar (PENDING embed work)', () => {
  it('an integer-backed measurement stays an integer through arithmetic', () => {
    expect(m(i(4)).multiply(2).value()).toBe(8);
    // a fractional result must throw: the embedded `i` rejects a non-integer
    expect(() => m(i(5)).multiply(0.5)).toThrow(
      /expected an integer/,
    );
  });

  it('an integer-backed measurement honours the embedded modifier', () => {
    const gridInt = i(10, { modifier: 'round' });
    // 10 * 1.25 = 12.5 -> the embedded modifier rounds -> 13
    expect(m(gridInt).multiply(1.25).value()).toBe(13);
  });

  it('a plain-number measurement accepts any finite result (no integer rule)', () => {
    expect(m(5).multiply(0.5).value()).toBe(2.5);
  });

  it('a float-backed measurement accepts any finite result (no integer rule)', () => {
    expect(m(f(5)).multiply(0.5).value()).toBe(2.5);
  });

  it('clone preserves the embedded scalar (integer-ness survives the copy)', () => {
    const copy = m(i(5, { max: 10 })).clone();
    expect(copy.value()).toBe(5);
    expect(() => copy.multiply(0.5)).toThrow(/expected an integer/);
  });
});
