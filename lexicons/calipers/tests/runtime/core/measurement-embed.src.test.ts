import { describe, expect, it } from 'vitest';

import { f, i, m } from '../../support/calipers_tests.src';

// SPEC for the "m embeds a scalar" delegation: m's math runs THROUGH the embedded scalar (i / f / u),
// so the scalar's rules (integer-ness, modifier, bound) hold across m's arithmetic, rounding, and
// clone. This file is wired into the main `test` run (script `test:embed`). The separate error-PREFIX
// spec (a measurement naming its subtype, `m(i): ...`) lives in `measurement-embed-errors.src.test.ts`
// and stays out of the run until the wrapperLabel step lands.
describe('measurement math delegates to the embedded scalar', () => {
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

// The rounding / scaling methods also run THROUGH the embedded scalar, so an integer-backed
// measurement stays integer through them and a plain / float measurement is unrestricted. Mostly
// GREEN today (they must STAY green through the rewire); the integer-preservation is the real point.
describe('measurement rounding + scaling methods delegate to the embedded scalar', () => {
  it('double / negation keep an integer-backed measurement integer', () => {
    expect(m(i(4)).double().value()).toBe(8);
    expect(m(i(4)).negation().value()).toBe(-4);
  });

  it('round / floor / ceil of an integer-backed measurement stay integer', () => {
    expect(m(i(5)).round().value()).toBe(5);
    expect(m(i(5)).floor().value()).toBe(5);
    expect(m(i(5)).ceil().value()).toBe(5);
  });

  it('round / floor / ceil snap a plain-number measurement', () => {
    expect(m(2.4).round().value()).toBe(2);
    expect(m(2.4).floor().value()).toBe(2);
    expect(m(2.4).ceil().value()).toBe(3);
  });

  it('double a plain-number measurement is unrestricted', () => {
    expect(m(5).double().value()).toBe(10);
  });
});

// `.half()` is `divide(2)` routed through the embedded scalar, so on an integer-backed measurement a
// fractional half must THROW (the `i` rejects a non-integer). DECIDED: keep this strict, do NOT widen
// an integer to a float. A plain / float measurement halves freely. RED today: `m(i(5)).half()`
// currently returns `2.5px`.
describe('.half() on a measurement respects the embedded scalar', () => {
  it('throws on an integer-backed measurement whose half is fractional', () => {
    expect(() => m(i(5)).half()).toThrow(/expected an integer/);
  });

  it('halves an even integer-backed measurement to a whole value', () => {
    expect(m(i(8)).half().value()).toBe(4);
  });

  it('halves a plain-number / float-backed measurement freely', () => {
    expect(m(5).half().value()).toBe(2.5);
    expect(m(f(5)).half().value()).toBe(2.5);
  });
});

// A direct `min` / `max` on `m` is no longer a runtime concern: `m` is a pure container and carries
// NO numeric config, so passing a bound to `m` (whether the value is a plain number or an ingested
// scalar) is a COMPILE-TIME error. That is locked as a type test in tests/types/m.test-d.ts
// (`expectError(m(10, { max: 10 }))` and `expectError(m(i(5), { max: 10 }))`); there is nothing left
// to assert at runtime here. A bounded measurement is built as `m(i(5, { max: 10 }), unit)`.
