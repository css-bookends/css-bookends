import { describe, expect, it } from 'vitest';

import { f, i, m } from '../../support/calipers_tests.src';

// SPEC for the ERROR-PREFIX step of the "m embeds a scalar" work (the wrapperLabel step). A failing
// operation reports the FULL chain: the measurement `m`, then the embedded subtype, then the specific
// error, e.g. `m(i): 5 is above the maximum 10`. A plain number embeds a `u` built with
// `wrapperLabel: 'm'`; an ingested scalar is stamped via `embedUnder('m', <m's context>)`, preserving
// its config AND chaining m's context onto the scalar's own, so the error CONTEXT shows the full stack:
// `[outer > inner]` (outer m -> inner scalar), or `[outer]` / `[inner]` when only one is set.
describe('measurement errors report m, the subtype, and the specific error', () => {
  it('a plain-number measurement: m(u) + the specific error', () => {
    // `m` is a pure container with no bound, so the plain-number construction error is a finiteness
    // violation; it still names BOTH the wrapper and the embedded subtype (`m(u): ...`).
    expect(() => m(Number.NaN)).toThrow(/m\(u\).*finite/);
  });

  it('an integer-backed measurement: m(i) + the specific error', () => {
    // in-range at construction, then arithmetic breaks the ingested bound.
    expect(() => m(i(5, { max: 10 })).add(10)).toThrow(
      /m\(i\).*above the maximum/,
    );
  });

  it('a float-backed measurement: m(f) + the specific error', () => {
    // the bound rides on the f (m is a pure container), then arithmetic breaks it.
    expect(() => m(f(5, { max: 10 })).add(10)).toThrow(
      /m\(f\).*above the maximum/,
    );
  });

  it('names the subtype on a non-bound error too (divide by zero)', () => {
    expect(() => m(5).divide(0)).toThrow(/m\(u\).*cannot divide/);
  });

  it('the wrapper survives clone (a cloned measurement still names its subtype)', () => {
    expect(() =>
      m(i(5, { max: 10 }))
        .clone()
        .add(10),
    ).toThrow(/m\(i\).*above the maximum/);
  });

  it('chains m and the ingested scalar context into the full trace', () => {
    // the i carries context 'inner'; m adds context 'outer'; a breach shows BOTH, outer > inner.
    expect(() =>
      m(i(5, { max: 10, context: 'inner' }), 'px', 'outer').add(10),
    ).toThrow(/m\(i\).*above the maximum.*\[outer > inner\]/);
  });

  it("m's context shows even when the ingested scalar has none", () => {
    // previously m's context was dropped for an ingested scalar; now it renders.
    expect(() => m(i(5, { max: 10 }), 'px', 'outer').add(10)).toThrow(
      /m\(i\).*above the maximum.*\[outer\]/,
    );
  });
});
