import { describe, expect, it } from 'vitest';

import { publishBookZIndex } from '../../src';

const zIndex = publishBookZIndex();

describe('z-index: happy paths', () => {
  it('renders a constrained integer', () => {
    expect(zIndex(5).css()).toBe('5');
    expect(zIndex(5).value()).toBe(5);
    expect(zIndex(0).css()).toBe('0');
    // negatives are allowed (unbounded integer).
    expect(zIndex(-1).css()).toBe('-1');
  });

  it('renders the auto keyword', () => {
    expect(zIndex('auto').css()).toBe('auto');
    expect(zIndex('auto').value()).toBe('auto');
  });

  it('a bare call renders the configured default value', () => {
    // the book default is 'auto'.
    expect(zIndex().css()).toBe('auto');
    // 'unset' also falls back to the default.
    expect(zIndex('unset').css()).toBe('auto');
    const themed = publishBookZIndex({ config: { value: 10 } });
    expect(themed().css()).toBe('10');
    expect(themed('unset').css()).toBe('10');
  });
});

describe('z-index: invalid input', () => {
  it('rejects an unknown keyword', () => {
    // @ts-expect-error 'baseline' is not a valid z-index keyword.
    expect(() => zIndex('baseline')).toThrow(/not a valid keyword/);
  });

  it('throws on a non-integer', () => {
    expect(() => zIndex(1.5)).toThrow();
  });
});
