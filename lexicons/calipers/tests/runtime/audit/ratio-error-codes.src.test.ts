import { describe, expect, it } from 'vitest';

import { f, i, r } from '../../support/calipers_tests.src';

/*
 * REGRESSION FENCE: ratio's arithmetic-contract error codes, as a FULL MATRIX.
 *
 * Ratio embeds each operand as a scalar under the `r` wrapper (mirrors m), so its errors read
 * `r(<subtype>): ...` and carry the same codes as the scalar core. Per `.claude/CLAUDE.md`
 * "Full-matrix coverage", the codes are asserted for every operand TYPE (u / i / f) in BOTH
 * positions (numerator / denominator) and via both entry points (construction / withNumerator /
 * withDenominator). Cells caught upstream (a non-finite i / f rejected at its OWN construction,
 * before r sees it) are asserted anyway, so dropping one guard cannot regress the contract.
 */

const messageOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (err) {
    return (err as Error).message;
  }
  throw new Error('expected the call to throw, but it did not');
};

const NONFINITE = [
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
  Number.NaN,
];

describe('ratio — DIVIDE_BY_ZERO for every denominator type, both entry points', () => {
  it('r(_, 0 | i(0) | f(0)) at construction, prefixed r(<subtype>)', () => {
    expect(messageOf(() => r(1, 0))).toContain(
      'code=CALIPERS_E_DIVIDE_BY_ZERO',
    );
    expect(messageOf(() => r(1, 0))).toMatch(
      /r\(u\): denominator cannot be zero/,
    );
    expect(messageOf(() => r(1, i(0)))).toMatch(
      /r\(i\): denominator cannot be zero .*code=CALIPERS_E_DIVIDE_BY_ZERO/,
    );
    expect(messageOf(() => r(1, f(0)))).toMatch(
      /r\(f\): denominator cannot be zero .*code=CALIPERS_E_DIVIDE_BY_ZERO/,
    );
  });

  it('r(_, _).withDenominator(0 | i(0) | f(0))', () => {
    expect(messageOf(() => r(1, 2).withDenominator(0))).toContain(
      'code=CALIPERS_E_DIVIDE_BY_ZERO',
    );
    expect(messageOf(() => r(1, 2).withDenominator(i(0)))).toContain(
      'code=CALIPERS_E_DIVIDE_BY_ZERO',
    );
    expect(messageOf(() => r(1, 2).withDenominator(f(0)))).toContain(
      'code=CALIPERS_E_DIVIDE_BY_ZERO',
    );
  });
});

describe('ratio — NONFINITE for every operand type and position', () => {
  it('raw (u) non-finite numerator / denominator, prefixed r(u)', () => {
    for (const bad of NONFINITE) {
      expect(messageOf(() => r(bad, 2))).toMatch(
        /r\(u\): expected a finite number .*code=CALIPERS_E_NONFINITE/,
      );
      expect(messageOf(() => r(1, bad))).toContain(
        'code=CALIPERS_E_NONFINITE',
      );
      expect(messageOf(() => r(1, 2).withNumerator(bad))).toContain(
        'code=CALIPERS_E_NONFINITE',
      );
      expect(messageOf(() => r(1, 2).withDenominator(bad))).toContain(
        'code=CALIPERS_E_NONFINITE',
      );
    }
  });

  it('i / f non-finite operands: caught at their OWN construction, code still fires', () => {
    // The i() / f() constructor rejects the non-finite value before r ever sees it. Per the
    // full-matrix rule we assert the code fires anyway, so removing that upstream guard AND the
    // ratio guard would break this cell.
    for (const bad of NONFINITE) {
      expect(messageOf(() => i(bad))).toContain(
        'code=CALIPERS_E_NONFINITE',
      );
      expect(messageOf(() => f(bad))).toContain(
        'code=CALIPERS_E_NONFINITE',
      );
    }
  });
});
