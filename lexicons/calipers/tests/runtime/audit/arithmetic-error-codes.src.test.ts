import { describe, expect, it } from 'vitest';

import { u } from '../../../src/internal/unspecified';
import { f, i, m } from '../../support/calipers_tests.src';

/*
 * REGRESSION FENCE: the scalar arithmetic-contract error codes, tested as a FULL MATRIX.
 *
 * Three codes are emitted by the scalar core:
 *   - CALIPERS_E_NONFINITE        (a value built from / operated to NaN or Infinity)
 *   - CALIPERS_E_NONFINITE_RESULT (an operation's finite inputs overflow to a non-finite result)
 *   - CALIPERS_E_DIVIDE_BY_ZERO   (divide by zero)
 *
 * Per `.claude/CLAUDE.md` "Full-matrix coverage", each code is asserted for EVERY scalar type
 * (u / i / f) and through the measurement container (m). Cells are NOT skipped as "unreachable":
 * add / multiply overflow re-enters the constructor (reported as NONFINITE, not _RESULT), and that
 * is asserted rather than assumed. Ratio's matrix lives in ratio-error-codes.src.test.ts.
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

describe('CALIPERS_E_DIVIDE_BY_ZERO — every scalar type', () => {
  it('u / i / f standalone divide by zero (plain and typed zero)', () => {
    expect(messageOf(() => u(5).divide(0))).toContain(
      'code=CALIPERS_E_DIVIDE_BY_ZERO',
    );
    expect(messageOf(() => i(5).divide(0))).toContain(
      'code=CALIPERS_E_DIVIDE_BY_ZERO',
    );
    expect(messageOf(() => i(5).divide(i(0)))).toContain(
      'code=CALIPERS_E_DIVIDE_BY_ZERO',
    );
    expect(messageOf(() => f(5).divide(0))).toContain(
      'code=CALIPERS_E_DIVIDE_BY_ZERO',
    );
    expect(messageOf(() => f(5).divide(f(0)))).toContain(
      'code=CALIPERS_E_DIVIDE_BY_ZERO',
    );
  });

  it('m (container) divide by zero, plain / i / f divisor', () => {
    expect(messageOf(() => m(10, 'px').divide(0))).toContain(
      'code=CALIPERS_E_DIVIDE_BY_ZERO',
    );
    expect(messageOf(() => m(10, 'px').divide(i(0)))).toContain(
      'code=CALIPERS_E_DIVIDE_BY_ZERO',
    );
    expect(messageOf(() => m(10, 'px').divide(f(0)))).toContain(
      'code=CALIPERS_E_DIVIDE_BY_ZERO',
    );
  });
});

describe('CALIPERS_E_NONFINITE — every scalar type (construction)', () => {
  it('u / i / f built from Infinity / -Infinity / NaN', () => {
    for (const bad of NONFINITE) {
      expect(messageOf(() => u(bad))).toContain(
        'code=CALIPERS_E_NONFINITE',
      );
      expect(messageOf(() => i(bad))).toContain(
        'code=CALIPERS_E_NONFINITE',
      );
      expect(messageOf(() => f(bad))).toContain(
        'code=CALIPERS_E_NONFINITE',
      );
    }
  });

  it('m built from, or operated to, a non-finite value', () => {
    expect(
      messageOf(() => m(Number.POSITIVE_INFINITY, 'px')),
    ).toContain('code=CALIPERS_E_NONFINITE');
    expect(
      messageOf(() => m(1, 'px').add(Number.POSITIVE_INFINITY)),
    ).toContain('code=CALIPERS_E_NONFINITE');
    // add / multiply overflow re-enters the constructor, so it reports NONFINITE (not _RESULT).
    expect(messageOf(() => m(1e308, 'px').multiply(1e308))).toContain(
      'code=CALIPERS_E_NONFINITE',
    );
  });
});

describe('CALIPERS_E_NONFINITE_RESULT — every scalar type', () => {
  it('u / i / f divide overflow to a non-finite result', () => {
    // MAX_VALUE / tiny overflows to Infinity; divide checks its result BEFORE the rebuild.
    expect(
      messageOf(() => u(Number.MAX_VALUE).divide(1e-300)),
    ).toContain('code=CALIPERS_E_NONFINITE_RESULT');
    expect(
      messageOf(() => i(Number.MAX_VALUE).divide(1e-300)),
    ).toContain('code=CALIPERS_E_NONFINITE_RESULT');
    expect(
      messageOf(() => f(Number.MAX_VALUE).divide(1e-300)),
    ).toContain('code=CALIPERS_E_NONFINITE_RESULT');
  });

  it('i / f modifier that yields a non-finite value (u has no modifier: type-forbidden)', () => {
    // u is the BARE scalar: its options type carries no `modifier`, so this NONFINITE_RESULT path
    // is structurally i / f only (the compiler rejects `u(5, { modifier })`, a stronger guarantee
    // than a runtime check). u's own NONFINITE_RESULT coverage is the divide-overflow case above.
    const toInfinity = () => Number.POSITIVE_INFINITY;
    expect(messageOf(() => i(5, { modifier: toInfinity }))).toContain(
      'code=CALIPERS_E_NONFINITE_RESULT',
    );
    expect(messageOf(() => f(5, { modifier: toInfinity }))).toContain(
      'code=CALIPERS_E_NONFINITE_RESULT',
    );
  });
});
