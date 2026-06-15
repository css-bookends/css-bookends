import { describe, expect, it } from 'vitest';

import {
  m,
  mPercent,
  validateGreaterOrEqualToZero,
  validateSmallerOrEqualToZero,
} from '../../../src';

/*
 * Type-hardening pass-through validators. Each runs a measurement through a runtime value
 * check and (at the type level, covered in tests/types/m.test-d.ts) narrows it to the
 * matching constraint brand. Behavior: the value is unchanged - the same instance is
 * returned - and an out-of-range value throws. Real assertions.
 */

describe('validateGreaterOrEqualToZero (>= 0)', () => {
  it('passes a positive measurement, returning the same instance', () => {
    const v = m(4);
    expect(validateGreaterOrEqualToZero(v)).toBe(v);
  });

  it('passes zero', () => {
    const v = m(0);
    expect(validateGreaterOrEqualToZero(v)).toBe(v);
  });

  it('throws on a negative measurement', () => {
    expect(() => validateGreaterOrEqualToZero(m(-1))).toThrow();
  });

  it('is unit-agnostic (e.g. percentages)', () => {
    const v = mPercent(50);
    expect(validateGreaterOrEqualToZero(v)).toBe(v);
  });
});

describe('validateSmallerOrEqualToZero (<= 0)', () => {
  it('passes a negative measurement, returning the same instance', () => {
    const v = m(-4);
    expect(validateSmallerOrEqualToZero(v)).toBe(v);
  });

  it('passes zero', () => {
    const v = m(0);
    expect(validateSmallerOrEqualToZero(v)).toBe(v);
  });

  it('throws on a positive measurement', () => {
    expect(() => validateSmallerOrEqualToZero(m(1))).toThrow();
  });
});
