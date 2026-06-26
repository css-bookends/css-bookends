import { describe, expect, it } from 'vitest';

import { publishBookOpacity } from '../../src';

const opacity = publishBookOpacity();

describe('opacity: happy paths', () => {
  it('renders a constrained alpha', () => {
    expect(opacity(0.5).css()).toBe('0.5');
    expect(opacity(0.5).value()).toBe(0.5);
    expect(opacity(0).css()).toBe('0');
    expect(opacity(1).css()).toBe('1');
  });

  it('a bare call renders the configured default alpha', () => {
    // the book default is 1.
    expect(opacity().css()).toBe('1');
    // 'unset' also falls back to the default.
    expect(opacity('unset').css()).toBe('1');
    const themed = publishBookOpacity({ config: { value: 0.8 } });
    expect(themed().css()).toBe('0.8');
    expect(themed('unset').css()).toBe('0.8');
  });
});

describe('opacity: out of range', () => {
  it('throws on an out-of-range number by default', () => {
    expect(() => opacity(1.5)).toThrow(/above the maximum/);
    expect(() => opacity(-0.5)).toThrow(/below the minimum/);
  });

  it('clamps when the book is configured to clamp', () => {
    const clamped = publishBookOpacity({
      config: { outOfRange: 'clamp' },
    });
    expect(clamped(1.5).css()).toBe('1');
    expect(clamped(-0.5).css()).toBe('0');
    // in-range values are untouched by clamp.
    expect(clamped(0.25).css()).toBe('0.25');
  });
});
