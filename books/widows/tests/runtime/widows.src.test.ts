import { describe, expect, it } from 'vitest';

import { publishBookWidows } from '../../src';

const widows = publishBookWidows();

describe('widows: happy paths', () => {
  it('renders a constrained count', () => {
    expect(widows(3).css()).toBe('3');
    expect(widows(3).value()).toBe(3);
    expect(widows(1).css()).toBe('1');
    expect(widows(10).css()).toBe('10');
  });

  it('a bare call renders the configured default count', () => {
    // the book default is 2.
    expect(widows().css()).toBe('2');
    // 'unset' also falls back to the default.
    expect(widows('unset').css()).toBe('2');
    const themed = publishBookWidows({ config: { value: 4 } });
    expect(themed().css()).toBe('4');
    expect(themed('unset').css()).toBe('4');
  });
});

describe('widows: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => widows(0)).toThrow(/below the minimum/);
  });

  it('clamps when the book is configured to clamp', () => {
    const clamped = publishBookWidows({
      config: { outOfRange: 'clamp' },
    });
    expect(clamped(0).css()).toBe('1');
    // in-range values are untouched by clamp.
    expect(clamped(3).css()).toBe('3');
  });
});
