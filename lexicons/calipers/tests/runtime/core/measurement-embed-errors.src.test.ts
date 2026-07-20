import { describe, expect, it } from 'vitest';

import { f, i, m } from '../../support/calipers_tests.src';

// SPEC for the ERROR-PREFIX step of the "m embeds a scalar" work (the wrapperLabel step). A failing
// operation reports the FULL chain: the measurement `m`, then the embedded subtype, then the specific
// error, e.g. `m(i): 5 is above the maximum 10`. A plain number embeds a `u` built with
// `wrapperLabel: 'm'`; an ingested scalar is stamped via `embedUnder('m')`, preserving its config.
describe('measurement errors report m, the subtype, and the specific error', () => {
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
    // the bound rides on the f (set-once: a direct bound on an ingested scalar throws), then
    // arithmetic breaks it.
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
});
