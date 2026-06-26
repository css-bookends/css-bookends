import { describe, expect, it } from 'vitest';

import { publishBookLineClamp } from '../../src';

const lineClamp = publishBookLineClamp();

describe('line-clamp: happy paths', () => {
  it('renders a constrained line count', () => {
    expect(lineClamp(3).css()).toBe('3');
    expect(lineClamp(3).value()).toBe(3);
    expect(lineClamp(1).css()).toBe('1');
  });

  it('renders the none keyword', () => {
    expect(lineClamp('none').css()).toBe('none');
    expect(lineClamp('none').value()).toBe('none');
  });

  it('a bare call renders the configured default', () => {
    // the book default is 'none'.
    expect(lineClamp().css()).toBe('none');
    // 'unset' also falls back to the default.
    expect(lineClamp('unset').css()).toBe('none');
    const themed = publishBookLineClamp({ config: { value: 2 } });
    expect(themed().css()).toBe('2');
    expect(themed('unset').css()).toBe('2');
  });

  it('rejects an unknown keyword', () => {
    // @ts-expect-error 'auto' is not a valid line-clamp keyword.
    expect(() => lineClamp('auto')).toThrow(/not a valid keyword/);
  });
});

describe('line-clamp: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => lineClamp(0)).toThrow(/below the minimum/);
  });

  it('throws on a non-integer line count', () => {
    expect(() => lineClamp(1.5)).toThrow();
  });
});
