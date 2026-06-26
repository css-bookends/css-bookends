import { describe, expect, it } from 'vitest';

import { publishBookFlexShrink } from '../../src';

const flexShrink = publishBookFlexShrink();

describe('flexShrink: happy paths', () => {
  it('renders a constrained factor', () => {
    expect(flexShrink(0.5).css()).toBe('0.5');
    expect(flexShrink(0.5).value()).toBe(0.5);
    expect(flexShrink(0).css()).toBe('0');
    expect(flexShrink(2).css()).toBe('2');
  });

  it('a bare call renders the configured default factor', () => {
    // the book default is 1.
    expect(flexShrink().css()).toBe('1');
    // 'unset' also falls back to the default.
    expect(flexShrink('unset').css()).toBe('1');
    const themed = publishBookFlexShrink({ config: { value: 0 } });
    expect(themed().css()).toBe('0');
    expect(themed('unset').css()).toBe('0');
  });
});

describe('flexShrink: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => flexShrink(-0.5)).toThrow(/below the minimum/);
  });

  it('clamps when the book is configured to clamp', () => {
    const clamped = publishBookFlexShrink({
      config: { outOfRange: 'clamp' },
    });
    expect(clamped(-0.5).css()).toBe('0');
    // in-range values are untouched by clamp.
    expect(clamped(0.25).css()).toBe('0.25');
  });
});
