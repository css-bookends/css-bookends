import { describe, expect, it } from 'vitest';

import { publishBookStrokeMiterlimit } from '../../src';

const strokeMiterlimit = publishBookStrokeMiterlimit();

describe('strokeMiterlimit: happy paths', () => {
  it('renders a constrained ratio', () => {
    expect(strokeMiterlimit(1.5).css()).toBe('1.5');
    expect(strokeMiterlimit(1.5).value()).toBe(1.5);
    expect(strokeMiterlimit(1).css()).toBe('1');
    expect(strokeMiterlimit(10).css()).toBe('10');
  });

  it('a bare call renders the configured default ratio', () => {
    // the book default is 4.
    expect(strokeMiterlimit().css()).toBe('4');
    // 'unset' also falls back to the default.
    expect(strokeMiterlimit('unset').css()).toBe('4');
    const themed = publishBookStrokeMiterlimit({
      config: { value: 2 },
    });
    expect(themed().css()).toBe('2');
    expect(themed('unset').css()).toBe('2');
  });
});

describe('strokeMiterlimit: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => strokeMiterlimit(0.5)).toThrow(/below the minimum/);
  });

  it('clamps when the book is configured to clamp', () => {
    const clamped = publishBookStrokeMiterlimit({
      config: { outOfRange: 'clamp' },
    });
    expect(clamped(0.5).css()).toBe('1');
    // in-range values are untouched by clamp.
    expect(clamped(2.5).css()).toBe('2.5');
  });
});
